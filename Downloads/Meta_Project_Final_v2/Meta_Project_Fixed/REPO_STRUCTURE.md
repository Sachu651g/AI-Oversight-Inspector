# Repository Structure Guide

This repo contains two complete RL environments submitted for the Meta × Hugging Face OpenEnv Hackathon 2026.

---

## Which folder is which?

| Folder | What it is | Status |
|---|---|---|
| `/` (root) | **Round 1** — Email Operations Environment | Submitted Round 1 |
| `round2/` | **Round 2 (Grand Finale)** — AI Oversight Inspector | Grand Finale submission |
| `hf_space_clone/` | Mirror of root for HF Space deployment | Deployment artifact |
| `multi_agent_system/` | Advanced multi-agent layer built on top of Round 1 | Part of Round 1 |

---

## Round 1 — Email Operations Environment

**Location**: root `/`

The agent learns to classify, prioritize, route, and reply to enterprise emails.
Key features: partial observability, noise injection, memory-based reward shaping (VIP ignore penalty).

Entry points:
- `inference.py` — run the baseline agent
- `openenv_email_ops/env.py` — the environment
- `openenv.yaml` — OpenEnv manifest
- `tests/` — 84 unit + property-based tests

---

## Round 2 (Grand Finale) — AI Oversight Inspector

**Location**: `round2/`

An LLM is trained to monitor a fleet of 4 AI sub-agents and detect violations (hallucinations, policy breaches, inconsistencies) **without seeing ground truth labels**. Trained with GRPO via Unsloth.

Entry points:
- `round2/inference_oversight.py` — run the baseline agent
- `round2/train_oversight.py` — training script
- `round2/colab_train_oversight.ipynb` — Colab notebook (T4 GPU, runnable by judges)
- `round2/oversight_env/env.py` — the environment
- `round2/openenv_oversight.yaml` — OpenEnv manifest
- `round2/assets/` — training charts (PNG)
- `round2/tests/` — 20 unit tests

---

## Quick commands

```bash
# Round 1 dry-run
python inference.py --dry-run

# Round 2 dry-run
cd round2/ && python inference_oversight.py --dry-run

# Round 2 training (dry-run, no GPU)
cd round2/ && python train_oversight.py --dry-run

# All tests
pytest tests/ -v                  # 84 Round 1 tests
pytest round2/tests/ -v           # 20 Round 2 tests
```
