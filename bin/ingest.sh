#!/usr/bin/env bash
set -euo pipefail

# ingest.sh — Orchestrate the full pipeline: record → transcribe → update plan.
# Usage: ingest.sh [--file AUDIO_FILE] [--duration SECONDS] [--skip-snapshot]
#
# If --file is given, skip recording and transcribe the provided audio file.
# Otherwise, record audio first, then transcribe and update the plan.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

AUDIO_FILE=""
DURATION_ARGS=()
SKIP_SNAPSHOT=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --file)
            AUDIO_FILE="$2"
            shift 2
            ;;
        --duration)
            DURATION_ARGS=(--duration "$2")
            shift 2
            ;;
        --skip-snapshot)
            SKIP_SNAPSHOT=true
            shift
            ;;
        -h|--help)
            echo "Usage: $(basename "$0") [--file AUDIO_FILE] [--duration SECONDS] [--skip-snapshot]"
            echo ""
            echo "Record audio (or use --file), transcribe it, and update the action plan."
            exit 0
            ;;
        *)
            echo "Unknown option: $1" >&2
            exit 1
            ;;
    esac
done

# Step 0: Snapshot the current plan (before update)
if [[ "$SKIP_SNAPSHOT" == "false" ]]; then
    echo "==> Taking plan snapshot..." >&2
    python "$PROJECT_ROOT/src/snapshot.py" 2>&1 | sed 's/^/    /' >&2 || true
fi

# Step 1: Record audio (if no file provided)
if [[ -z "$AUDIO_FILE" ]]; then
    echo "==> Recording audio..." >&2
    AUDIO_FILE=$("$SCRIPT_DIR/record.sh" "${DURATION_ARGS[@]}")
    echo "    Audio: $AUDIO_FILE" >&2
fi

if [[ ! -f "$AUDIO_FILE" ]]; then
    echo "Error: Audio file not found: $AUDIO_FILE" >&2
    exit 1
fi

# Step 2: Transcribe
echo "==> Transcribing audio..." >&2
TRANSCRIPT_FILE=$(python "$PROJECT_ROOT/src/transcribe.py" "$AUDIO_FILE")
echo "    Transcript: $TRANSCRIPT_FILE" >&2

# Step 3: Update the plan
echo "==> Updating action plan..." >&2
PLAN_FILE=$(python "$PROJECT_ROOT/src/planner.py" "$TRANSCRIPT_FILE")
echo "    Plan: $PLAN_FILE" >&2

echo "" >&2
echo "Done! Your plan has been updated." >&2
echo "Review it at: $PLAN_FILE" >&2
