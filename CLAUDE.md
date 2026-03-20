# Voice-Driven AI Action Plan Tool

## Project Overview

A personal productivity system where the user speaks their thoughts throughout the day, and an AI agent turns voice recordings into an evolving, executable action plan. The user reviews and selects tasks; the agent executes them autonomously.

**Core loop:** Record audio → Transcribe → Update plan → User selects tasks → Agent executes → Write results back to plan

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌────────────────┐
│ Audio Input  │────▶│ Transcription │────▶│ Plan Engine  │────▶│ Agent Executor │
│ (CLI record) │     │ (whisper/API) │     │ (update plan)│     │ (claude code)  │
└─────────────┘     └──────────────┘     └──────────────┘     └────────────────┘
                                               │                       │
                                               ▼                       ▼
                                         ┌──────────┐          ┌──────────────┐
                                         │ plan.md  │◀─────────│ Result logs  │
                                         │ (living) │          │ (summaries)  │
                                         └──────────┘          └──────────────┘
```

## Directory Structure

```
voice-plan/
├── CLAUDE.md              # This file — project brief
├── README.md              # User-facing docs
├── bin/
│   ├── record.sh          # CLI audio recorder (sox/arecord)
│   ├── ingest.sh          # Orchestrator: transcribe → update plan
│   └── execute.sh         # Run selected plan items via claude code
├── src/
│   ├── transcribe.py      # Audio-to-text (OpenAI Whisper or Anthropic API)
│   ├── planner.py         # Parse transcript, update plan.md
│   ├── executor.py        # Spin up agent tasks, write summaries back
│   └── snapshot.py        # Version/snapshot the plan periodically
├── plan/
│   ├── plan.md            # The living action plan (auto-updated)
│   └── snapshots/         # Timestamped copies of plan.md
├── transcripts/           # Raw transcripts (audio is NOT stored by default)
├── logs/                  # Execution logs and result summaries
├── config.yaml            # User config (audio device, model, compute budget)
└── requirements.txt       # Python dependencies
```

## Implementation Phases

### Phase 1: Audio Capture (CLI)
- Bash script `bin/record.sh` that records audio from the default mic
- Uses `sox` (rec) for cross-platform recording
- Saves to a temp file, then passes to the ingest pipeline
- Flag: `--duration` for timed recordings, or press Ctrl+C to stop
- Audio files are deleted after transcription by default (privacy-first)
- Config option to retain audio if desired

### Phase 2: Transcription
- `src/transcribe.py` converts audio to text
- Primary: OpenAI Whisper API (fast, accurate)
- Fallback: local whisper model via `openai-whisper` package
- Output: timestamped transcript saved to `transcripts/`
- Strips filler words and cleans up for readability

### Phase 3: Plan Generation & Update
- `src/planner.py` takes a transcript and updates `plan/plan.md`
- Uses Claude API to:
  1. Parse intent and action items from transcript
  2. Merge new items into the existing plan (no duplicates, smart grouping)
  3. Categorize by urgency/effort
- Plan format: Markdown with checkboxes, sections, and metadata
- Each entry has: description, status, priority, created date, result summary

### Phase 4: Agent Execution
- `src/executor.py` reads selected items from the plan
- Spins up execution via Claude Code in a tmux session
- Each task runs in its own pane/window for isolation
- On completion, writes a short summary back into the plan entry
- Supports a compute budget cap (configurable in `config.yaml`)
- `bin/execute.sh` is the user-facing wrapper

### Phase 5: Continuous Loop & Snapshots
- `src/snapshot.py` saves timestamped copies of `plan/plan.md`
- Ingest can be triggered repeatedly — each new recording updates the plan
- Cron-friendly: can schedule overnight execution windows
- Plan is always the single source of truth

## Config (config.yaml)

```yaml
audio:
  device: default          # Audio input device
  format: wav
  sample_rate: 16000
  delete_after_transcribe: true

transcription:
  provider: whisper-api    # whisper-api | whisper-local
  model: whisper-1         # For API; or "base", "small", "medium" for local
  language: en

planning:
  model: claude-sonnet-4-20250514
  max_plan_items: 50       # Soft cap before archiving completed items

execution:
  model: claude-sonnet-4-20250514
  compute_budget_minutes: 60   # Max agent runtime per session
  use_tmux: true
  parallel_tasks: 2

snapshots:
  enabled: true
  interval: before_update  # before_update | hourly | daily
```

## Tech Stack
- **Shell**: bash (recording, orchestration scripts)
- **Python 3.11+**: core logic
- **sox**: audio recording
- **OpenAI Whisper**: transcription
- **Anthropic Claude API**: plan generation and task execution
- **tmux**: agent session management
- **PyYAML**: config parsing

## Coding Conventions
- Scripts in `bin/` are bash, executable, with `#!/usr/bin/env bash` and `set -euo pipefail`
- Python code uses type hints, f-strings, pathlib for paths
- All API calls wrapped in retry logic with exponential backoff
- Logging to stderr; structured output to stdout or files
- No audio is stored by default — transcript-only for privacy

## Getting Started (for the agent)

1. Initialize the repo structure per the directory layout above
2. Implement Phase 1 (`bin/record.sh`) — get audio capture working
3. Implement Phase 2 (`src/transcribe.py`) — wire up transcription
4. Implement Phase 3 (`src/planner.py`) — plan generation with Claude API
5. Wire it together in `bin/ingest.sh`
6. Implement Phase 4 (`src/executor.py` + `bin/execute.sh`)
7. Add snapshot support
8. Write README.md with setup and usage instructions

## Open Questions
- Cost estimation: calculate API costs per recording (whisper + claude) and per execution session
- Future: simple TUI or web GUI for reviewing/interacting with the plan
- Future: watch mode that auto-ingests new recordings from a directory
