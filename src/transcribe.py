"""Audio-to-text transcription using OpenAI Whisper API or local whisper model."""

from __future__ import annotations

import argparse
import logging
import re
import time
from datetime import datetime, timezone
from pathlib import Path

import yaml

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = PROJECT_ROOT / "config.yaml"
TRANSCRIPTS_DIR = PROJECT_ROOT / "transcripts"

# Filler words to strip for readability
FILLER_WORDS = re.compile(
    r"\b(um|uh|hmm|like|you know|I mean|basically|actually|literally|right)\b",
    re.IGNORECASE,
)

MAX_RETRIES = 3
INITIAL_BACKOFF = 1.0


def load_config() -> dict:
    """Load configuration from config.yaml."""
    if CONFIG_PATH.exists():
        with open(CONFIG_PATH) as f:
            return yaml.safe_load(f) or {}
    return {}


def clean_transcript(text: str) -> str:
    """Strip filler words and clean up whitespace."""
    text = FILLER_WORDS.sub("", text)
    text = re.sub(r"\s{2,}", " ", text)
    text = re.sub(r"\s+([.,!?])", r"\1", text)
    return text.strip()


def _retry(fn, *args, **kwargs):
    """Call fn with exponential backoff retry."""
    backoff = INITIAL_BACKOFF
    for attempt in range(MAX_RETRIES):
        try:
            return fn(*args, **kwargs)
        except Exception as e:
            if attempt == MAX_RETRIES - 1:
                raise
            logger.warning("Attempt %d failed: %s. Retrying in %.1fs...", attempt + 1, e, backoff)
            time.sleep(backoff)
            backoff *= 2


def transcribe_whisper_api(audio_path: Path, config: dict) -> str:
    """Transcribe audio using OpenAI Whisper API."""
    from openai import OpenAI

    client = OpenAI()
    model = config.get("transcription", {}).get("model", "whisper-1")
    language = config.get("transcription", {}).get("language", "en")

    def _call():
        with open(audio_path, "rb") as audio_file:
            response = client.audio.transcriptions.create(
                model=model,
                file=audio_file,
                language=language,
            )
        return response.text

    return _retry(_call)


def transcribe_whisper_local(audio_path: Path, config: dict) -> str:
    """Transcribe audio using local whisper model."""
    import whisper

    model_name = config.get("transcription", {}).get("model", "base")
    language = config.get("transcription", {}).get("language", "en")

    logger.info("Loading local whisper model '%s'...", model_name)
    model = whisper.load_model(model_name)

    def _call():
        result = model.transcribe(str(audio_path), language=language)
        return result["text"]

    return _retry(_call)


def transcribe(audio_path: Path, config: dict | None = None) -> Path:
    """Transcribe an audio file and save the transcript.

    Args:
        audio_path: Path to the audio file.
        config: Optional config dict. Loaded from config.yaml if not provided.

    Returns:
        Path to the saved transcript file.
    """
    if config is None:
        config = load_config()

    provider = config.get("transcription", {}).get("provider", "whisper-api")

    logger.info("Transcribing '%s' with provider '%s'...", audio_path.name, provider)

    if provider == "whisper-api":
        raw_text = transcribe_whisper_api(audio_path, config)
    elif provider == "whisper-local":
        raw_text = transcribe_whisper_local(audio_path, config)
    else:
        raise ValueError(f"Unknown transcription provider: {provider}")

    text = clean_transcript(raw_text)

    # Save transcript
    TRANSCRIPTS_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    transcript_path = TRANSCRIPTS_DIR / f"transcript_{timestamp}.md"
    transcript_path.write_text(
        f"# Transcript — {timestamp}\n\n"
        f"**Source:** {audio_path.name}\n"
        f"**Provider:** {provider}\n\n"
        f"---\n\n"
        f"{text}\n",
        encoding="utf-8",
    )

    logger.info("Transcript saved to %s", transcript_path)

    # Delete audio if configured
    if config.get("audio", {}).get("delete_after_transcribe", True):
        audio_path.unlink(missing_ok=True)
        logger.info("Deleted audio file (privacy-first default).")

    return transcript_path


def main():
    parser = argparse.ArgumentParser(description="Transcribe an audio file to text.")
    parser.add_argument("audio_file", type=Path, help="Path to the audio file")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s", stream=__import__("sys").stderr)

    if not args.audio_file.exists():
        parser.error(f"Audio file not found: {args.audio_file}")

    transcript_path = transcribe(args.audio_file)
    # Print path to stdout for piping
    print(transcript_path)


if __name__ == "__main__":
    main()
