#!/usr/bin/env bash
set -euo pipefail

# execute.sh — Run selected plan items via the agent executor.
# Usage: execute.sh [--list] [--no-tmux] [ITEM_INDEX ...]
#
# Examples:
#   execute.sh --list          # Show available tasks
#   execute.sh 1 3             # Execute tasks 1 and 3
#   execute.sh --no-tmux 2     # Execute task 2 without tmux
#   execute.sh                 # Execute all tasks

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Take a snapshot before executing
echo "==> Taking plan snapshot before execution..." >&2
python "$PROJECT_ROOT/src/snapshot.py" 2>&1 | sed 's/^/    /' >&2 || true

echo "==> Running executor..." >&2
python "$PROJECT_ROOT/src/executor.py" "$@"
