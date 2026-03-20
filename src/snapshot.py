"""Save timestamped snapshots of plan.md for version history."""

from __future__ import annotations

import argparse
import logging
import shutil
from datetime import datetime, timezone
from pathlib import Path

import yaml

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = PROJECT_ROOT / "config.yaml"
PLAN_PATH = PROJECT_ROOT / "plan" / "plan.md"
SNAPSHOTS_DIR = PROJECT_ROOT / "plan" / "snapshots"


def load_config() -> dict:
    if CONFIG_PATH.exists():
        with open(CONFIG_PATH) as f:
            return yaml.safe_load(f) or {}
    return {}


def take_snapshot(config: dict | None = None) -> Path | None:
    """Save a timestamped copy of plan.md.

    Returns:
        Path to the snapshot file, or None if plan.md doesn't exist.
    """
    if config is None:
        config = load_config()

    if not config.get("snapshots", {}).get("enabled", True):
        logger.info("Snapshots disabled in config.")
        return None

    if not PLAN_PATH.exists():
        logger.info("No plan.md to snapshot.")
        return None

    SNAPSHOTS_DIR.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    snapshot_path = SNAPSHOTS_DIR / f"plan_{timestamp}.md"

    # Skip if plan hasn't changed since last snapshot
    existing = sorted(SNAPSHOTS_DIR.glob("plan_*.md"))
    if existing:
        latest = existing[-1].read_text(encoding="utf-8")
        current = PLAN_PATH.read_text(encoding="utf-8")
        if latest == current:
            logger.info("Plan unchanged since last snapshot — skipping.")
            return None

    shutil.copy2(PLAN_PATH, snapshot_path)
    logger.info("Snapshot saved: %s", snapshot_path)
    return snapshot_path


def main():
    parser = argparse.ArgumentParser(description="Take a snapshot of the current action plan.")
    parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s", stream=__import__("sys").stderr)

    result = take_snapshot()
    if result:
        print(result)


if __name__ == "__main__":
    main()
