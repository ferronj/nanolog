"""Execute selected plan items via Claude Code in tmux sessions."""

from __future__ import annotations

import argparse
import logging
import re
import shutil
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path

import yaml

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = PROJECT_ROOT / "config.yaml"
PLAN_PATH = PROJECT_ROOT / "plan" / "plan.md"
LOGS_DIR = PROJECT_ROOT / "logs"

# Match unchecked plan items: - [ ] **Description** — metadata
PLAN_ITEM_RE = re.compile(
    r"^- \[ \] \*\*(.+?)\*\*(.*)$",
    re.MULTILINE,
)


def load_config() -> dict:
    if CONFIG_PATH.exists():
        with open(CONFIG_PATH) as f:
            return yaml.safe_load(f) or {}
    return {}


def parse_plan_items(plan_text: str) -> list[dict]:
    """Extract unchecked items from the plan."""
    items = []
    for match in PLAN_ITEM_RE.finditer(plan_text):
        description = match.group(1).strip()
        metadata = match.group(2).strip()
        items.append({
            "description": description,
            "metadata": metadata,
            "raw_line": match.group(0),
        })
    return items


def select_items(items: list[dict], indices: list[int] | None = None) -> list[dict]:
    """Select items by index (1-based) or return all if no indices given."""
    if indices is None:
        return items
    return [items[i - 1] for i in indices if 0 < i <= len(items)]


def execute_task_tmux(task: dict, session_name: str, config: dict) -> str:
    """Execute a single task in a tmux window using Claude Code."""
    description = task["description"]
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    log_file = LOGS_DIR / f"task_{timestamp}_{_slugify(description)}.log"

    LOGS_DIR.mkdir(parents=True, exist_ok=True)

    # Build the claude command
    prompt = (
        f"Execute this task and report results:\n\n"
        f"Task: {description}\n\n"
        f"When done, write a concise summary of what you did and the outcome."
    )

    claude_cmd = f'claude --print "{prompt}" 2>&1 | tee "{log_file}"'

    # Create or use tmux session
    if not _tmux_session_exists(session_name):
        subprocess.run(
            ["tmux", "new-session", "-d", "-s", session_name],
            check=True,
        )

    window_name = _slugify(description)[:30]
    subprocess.run(
        ["tmux", "new-window", "-t", session_name, "-n", window_name, claude_cmd],
        check=True,
    )

    logger.info("Task '%s' launched in tmux session '%s', window '%s'", description, session_name, window_name)
    logger.info("Log file: %s", log_file)

    return str(log_file)


def execute_task_direct(task: dict) -> str:
    """Execute a single task directly (no tmux) and capture output."""
    description = task["description"]
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    log_file = LOGS_DIR / f"task_{timestamp}_{_slugify(description)}.log"

    LOGS_DIR.mkdir(parents=True, exist_ok=True)

    prompt = (
        f"Execute this task and report results:\n\n"
        f"Task: {description}\n\n"
        f"When done, write a concise summary of what you did and the outcome."
    )

    logger.info("Executing task '%s' directly...", description)

    try:
        result = subprocess.run(
            ["claude", "--print", prompt],
            capture_output=True,
            text=True,
            timeout=3600,  # 1 hour max
        )
        output = result.stdout + ("\n" + result.stderr if result.stderr else "")
    except subprocess.TimeoutExpired:
        output = "ERROR: Task timed out after 1 hour."
    except FileNotFoundError:
        output = "ERROR: 'claude' command not found. Install Claude Code CLI."

    log_file.write_text(output, encoding="utf-8")
    logger.info("Task output saved to %s", log_file)

    return output


def update_plan_with_result(task: dict, summary: str) -> None:
    """Write the execution result back into plan.md."""
    plan_text = PLAN_PATH.read_text(encoding="utf-8")

    # Replace the unchecked item with a checked item + result
    old_line = task["raw_line"]
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    short_summary = summary.strip().split("\n")[0][:200] if summary.strip() else "Completed"
    new_line = old_line.replace("- [ ]", "- [x]") + f"\n  > Result ({today}): {short_summary}"

    updated = plan_text.replace(old_line, new_line, 1)
    PLAN_PATH.write_text(updated, encoding="utf-8")
    logger.info("Plan updated with result for '%s'", task["description"])


def _slugify(text: str) -> str:
    """Convert text to a filename-safe slug."""
    slug = re.sub(r"[^\w\s-]", "", text.lower())
    return re.sub(r"[\s-]+", "-", slug).strip("-")[:50]


def _tmux_session_exists(name: str) -> bool:
    result = subprocess.run(
        ["tmux", "has-session", "-t", name],
        capture_output=True,
    )
    return result.returncode == 0


def run(
    indices: list[int] | None = None,
    use_tmux: bool | None = None,
    config: dict | None = None,
) -> list[str]:
    """Run selected plan items.

    Args:
        indices: 1-based indices of items to execute (None = all).
        use_tmux: Whether to use tmux. Falls back to config.
        config: Optional config dict.

    Returns:
        List of log file paths or output strings.
    """
    if config is None:
        config = load_config()

    if use_tmux is None:
        use_tmux = config.get("execution", {}).get("use_tmux", True)

    plan_text = PLAN_PATH.read_text(encoding="utf-8")
    items = parse_plan_items(plan_text)

    if not items:
        logger.info("No actionable items found in the plan.")
        return []

    selected = select_items(items, indices)
    if not selected:
        logger.info("No items matched the given indices.")
        return []

    logger.info("Executing %d task(s)...", len(selected))
    results = []

    session_name = "voice-plan"

    for task in selected:
        if use_tmux and shutil.which("tmux"):
            log_path = execute_task_tmux(task, session_name, config)
            results.append(log_path)
        else:
            output = execute_task_direct(task)
            update_plan_with_result(task, output)
            results.append(output)

    return results


def main():
    parser = argparse.ArgumentParser(description="Execute selected items from the action plan.")
    parser.add_argument(
        "items",
        nargs="*",
        type=int,
        help="1-based indices of plan items to execute (default: all)",
    )
    parser.add_argument("--no-tmux", action="store_true", help="Run directly without tmux")
    parser.add_argument("--list", action="store_true", help="List plan items and exit")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s", stream=__import__("sys").stderr)

    if args.list:
        plan_text = PLAN_PATH.read_text(encoding="utf-8")
        items = parse_plan_items(plan_text)
        if not items:
            print("No actionable items in the plan.")
        else:
            for i, item in enumerate(items, 1):
                print(f"  {i}. {item['description']}")
        return

    indices = args.items if args.items else None
    use_tmux = not args.no_tmux

    run(indices=indices, use_tmux=use_tmux)


if __name__ == "__main__":
    main()
