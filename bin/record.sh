#!/usr/bin/env bash
set -euo pipefail

# record.sh — Record audio from the default mic using sox (rec).
# Usage: record.sh [--duration SECONDS] [--output FILE]
# Without --duration, records until Ctrl+C.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_FILE="$PROJECT_ROOT/config.yaml"

# Defaults
DURATION=""
OUTPUT=""
SAMPLE_RATE=16000
FORMAT="wav"

# Parse config.yaml for audio settings (lightweight, no yaml parser needed)
if [[ -f "$CONFIG_FILE" ]]; then
    sr=$(grep 'sample_rate:' "$CONFIG_FILE" | head -1 | awk '{print $2}')
    fmt=$(grep 'format:' "$CONFIG_FILE" | head -1 | awk '{print $2}')
    [[ -n "$sr" ]] && SAMPLE_RATE="$sr"
    [[ -n "$fmt" ]] && FORMAT="$fmt"
fi

usage() {
    cat <<USAGE
Usage: $(basename "$0") [OPTIONS]

Record audio from the default microphone.

Options:
  --duration SECONDS   Record for a fixed duration (default: until Ctrl+C)
  --output FILE        Output file path (default: temp file in /tmp)
  -h, --help           Show this help message
USAGE
    exit 0
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --duration)
            DURATION="$2"
            shift 2
            ;;
        --output)
            OUTPUT="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo "Unknown option: $1" >&2
            usage
            ;;
    esac
done

# Check for sox
if ! command -v rec &>/dev/null; then
    echo "Error: 'sox' is not installed. Install it with:" >&2
    echo "  Ubuntu/Debian: sudo apt install sox" >&2
    echo "  macOS:         brew install sox" >&2
    echo "  Windows:       choco install sox" >&2
    exit 1
fi

# Set output path
if [[ -z "$OUTPUT" ]]; then
    OUTPUT=$(mktemp "/tmp/voice-plan-XXXXXX.$FORMAT")
fi

echo "Recording audio (${FORMAT}, ${SAMPLE_RATE}Hz)..." >&2
if [[ -n "$DURATION" ]]; then
    echo "Duration: ${DURATION}s — recording..." >&2
    rec -q -r "$SAMPLE_RATE" -c 1 "$OUTPUT" trim 0 "$DURATION"
else
    echo "Press Ctrl+C to stop recording." >&2
    rec -q -r "$SAMPLE_RATE" -c 1 "$OUTPUT"
fi

echo "Recording saved to: $OUTPUT" >&2
# Print the output path to stdout for piping to downstream scripts
echo "$OUTPUT"
