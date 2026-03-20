"""Parse transcripts and update the living action plan using Claude API."""

from __future__ import annotations

import argparse
import logging
import time
from datetime import datetime, timezone
from pathlib import Path

import yaml

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = PROJECT_ROOT / "config.yaml"
PLAN_PATH = PROJECT_ROOT / "plan" / "plan.md"

MAX_RETRIES = 3
INITIAL_BACKOFF = 1.0

SYSTEM_PROMPT = """\
You are a personal productivity assistant. Your job is to maintain an action plan \
in Markdown format based on voice transcripts from the user.

Rules:
1. Parse the transcript for action items, ideas, goals, and tasks.
2. Merge new items into the existing plan — avoid duplicates, group related items.
3. Categorize items by urgency (high / medium / low) and effort (small / medium / large).
4. Each item uses this format:
   - [ ] **Description** — priority: high|medium|low, effort: small|medium|large, created: YYYY-MM-DD
5. Keep sections: "In Progress", "To Do", "Done".
6. Move items between sections as appropriate based on transcript context.
7. Preserve existing items and their metadata (don't drop anything).
8. Keep the plan concise — max {max_items} active items. Archive completed items older than 7 days.

Return ONLY the updated plan.md content, starting with "# Action Plan".\
"""

UPDATE_PROMPT = """\
Here is the current action plan:

<current_plan>
{current_plan}
</current_plan>

Here is the new transcript to incorporate:

<transcript>
{transcript}
</transcript>

Today's date is {today}. Update the plan based on the transcript.\
"""


def load_config() -> dict:
    if CONFIG_PATH.exists():
        with open(CONFIG_PATH) as f:
            return yaml.safe_load(f) or {}
    return {}


def _retry(fn, *args, **kwargs):
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


def update_plan(transcript_path: Path, config: dict | None = None) -> Path:
    """Update plan.md based on a transcript using Claude API.

    Args:
        transcript_path: Path to the transcript file.
        config: Optional config dict.

    Returns:
        Path to the updated plan.md.
    """
    import anthropic

    if config is None:
        config = load_config()

    planning_config = config.get("planning", {})
    model = planning_config.get("model", "claude-sonnet-4-20250514")
    max_items = planning_config.get("max_plan_items", 50)

    # Read inputs
    transcript = transcript_path.read_text(encoding="utf-8")
    current_plan = PLAN_PATH.read_text(encoding="utf-8") if PLAN_PATH.exists() else "# Action Plan\n\n(empty)"

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    client = anthropic.Anthropic()

    def _call():
        response = client.messages.create(
            model=model,
            max_tokens=4096,
            system=SYSTEM_PROMPT.format(max_items=max_items),
            messages=[
                {
                    "role": "user",
                    "content": UPDATE_PROMPT.format(
                        current_plan=current_plan,
                        transcript=transcript,
                        today=today,
                    ),
                }
            ],
        )
        return response.content[0].text

    logger.info("Updating plan with transcript '%s'...", transcript_path.name)
    updated_plan = _retry(_call)

    # Write updated plan
    PLAN_PATH.parent.mkdir(parents=True, exist_ok=True)
    PLAN_PATH.write_text(updated_plan + "\n", encoding="utf-8")
    logger.info("Plan updated at %s", PLAN_PATH)

    return PLAN_PATH


def main():
    parser = argparse.ArgumentParser(description="Update the action plan from a transcript.")
    parser.add_argument("transcript_file", type=Path, help="Path to the transcript file")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s", stream=__import__("sys").stderr)

    if not args.transcript_file.exists():
        parser.error(f"Transcript file not found: {args.transcript_file}")

    plan_path = update_plan(args.transcript_file)
    print(plan_path)


if __name__ == "__main__":
    main()
