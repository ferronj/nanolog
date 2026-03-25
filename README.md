# NanoLog

A personal productivity system where you speak your thoughts throughout the day, and an AI agent turns voice recordings into an evolving, executable action plan.

**Core loop:** Record audio → Transcribe → Update plan → Select tasks → Agent executes → Results written back to plan

## Setup

### Prerequisites

- **Python 3.11+**
- **sox** — for audio recording
- **Claude Code CLI** — for agent execution
- **tmux** (optional) — for parallel task execution

### Install dependencies

```bash
# Install sox
# Ubuntu/Debian: sudo apt install sox
# macOS:         brew install sox
# Windows:       choco install sox

# Install Python dependencies
pip install -r requirements.txt
```

### API keys

Set the following environment variables:

```bash
export OPENAI_API_KEY="sk-..."       # For Whisper transcription
export ANTHROPIC_API_KEY="sk-ant-..."  # For plan generation
```

## Usage

### Quick start — full pipeline

```bash
# Record → transcribe → update plan (press Ctrl+C to stop recording)
bin/ingest.sh

# With a fixed recording duration
bin/ingest.sh --duration 60

# From an existing audio file
bin/ingest.sh --file path/to/recording.wav
```

### Step by step

```bash
# 1. Record audio
bin/record.sh --duration 30

# 2. Transcribe
python src/transcribe.py /tmp/voice-plan-XXXXXX.wav

# 3. Update the plan
python src/planner.py transcripts/transcript_20260320_120000.md

# 4. Review the plan
cat plan/plan.md

# 5. Execute tasks
bin/execute.sh --list           # See available tasks
bin/execute.sh 1 3              # Execute tasks 1 and 3
bin/execute.sh --no-tmux 2      # Execute task 2 without tmux
```

### Snapshots

Plan snapshots are taken automatically before each update and execution. You can also take one manually:

```bash
python src/snapshot.py
```

Snapshots are saved in `plan/snapshots/` with timestamps.

## Configuration

Edit `config.yaml` to customize:

| Section | Key | Description |
|---------|-----|-------------|
| `audio` | `device` | Audio input device (default: `default`) |
| `audio` | `sample_rate` | Recording sample rate (default: `16000`) |
| `audio` | `delete_after_transcribe` | Delete audio after transcription (default: `true`) |
| `transcription` | `provider` | `whisper-api` or `whisper-local` |
| `transcription` | `model` | Whisper model name |
| `planning` | `model` | Claude model for plan generation |
| `planning` | `max_plan_items` | Soft cap before archiving completed items |
| `execution` | `use_tmux` | Use tmux for task execution |
| `execution` | `parallel_tasks` | Max parallel agent tasks |
| `snapshots` | `enabled` | Enable/disable automatic snapshots |

## Project structure

```
voice-plan/
├── bin/
│   ├── record.sh       # CLI audio recorder
│   ├── ingest.sh       # Orchestrator: record → transcribe → plan
│   └── execute.sh      # Run selected plan items via agent
├── src/
│   ├── transcribe.py   # Audio-to-text (Whisper API or local)
│   ├── planner.py      # Transcript → plan update (Claude API)
│   ├── executor.py     # Agent task execution
│   └── snapshot.py     # Plan version snapshots
├── plan/
│   ├── plan.md         # The living action plan
│   └── snapshots/      # Timestamped plan copies
├── transcripts/        # Saved transcripts
├── logs/               # Execution logs
├── config.yaml         # Configuration
└── requirements.txt    # Python dependencies
```

## Privacy

Audio files are deleted after transcription by default. Only text transcripts are stored. Set `audio.delete_after_transcribe: false` in `config.yaml` to retain audio files.
