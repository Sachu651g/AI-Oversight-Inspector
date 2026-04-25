# Repository Structure — AI Oversight Inspector

> **Meta × Hugging Face OpenEnv Hackathon 2026 — Grand Finale Submission**

This repo contains **two complete RL environments** built across two rounds of the hackathon.

---

## Which folder is which?

| Folder | Round | What it is |
|---|---|---|
| `openenv_email_ops/` | **Round 1** | Email Operations RL Environment — the training env where agents classify, prioritize, route, and reply to enterprise emails |
| `multi_agent_system/` | **Round 1** | Multi-agent evaluation layer — 4 specialized agents + orchestrator + self-improving memory |
| `round2_oversight_inspector/` | **Round 2 (Grand Finale)** | AI Oversight Inspector — LLM trained to monitor a fleet of sub-agents and detect violations without seeing ground truth |
| `hf_space_clone/` | Deployment | Mirror of root for HF Space deployment (not for active development) |

---

## Round 1 — Email Operations Environment

**Location**: root `/`

An LLM agent learns to handle an enterprise email inbox — classifying, prioritizing, routing, and replying to emails. Key features: partial observability, noise injection, VIP-ignore penalty, memory-based reward shaping.

**Entry points:**
- `inference.py` — run the baseline agent
- `openenv_email_ops/env.py` — the environment (`reset` / `step` / `state`)
- `openenv.yaml` — OpenEnv manifest
- `tests/` — 84 unit + property-based tests

---

## Round 2 (Grand Finale) — AI Oversight Inspector

**Location**: `round2_oversight_inspector/`

An LLM is trained to monitor a fleet of 4 AI sub-agents and detect violations (hallucinations, policy breaches, severity mismatches, cross-agent inconsistencies) **without ever seeing ground truth labels**. Trained with GRPO via Unsloth on a free T4 GPU.

**Training results after 500 steps:**

| Metric | Before | After | Delta |
|---|---|---|---|
| Detection accuracy | 42% | **78%** | +36pp |
| False positive rate | 35% | **12%** | −23pp |
| Severity accuracy | 38% | **71%** | +33pp |
| Avg episode score | 0.21 | **0.74** | +0.53 |

**Entry points:**
- `round2_oversight_inspector/inference_oversight.py` — run the baseline overseer
- `round2_oversight_inspector/train_oversight.py` — GRPO training script (469 lines)
- `round2_oversight_inspector/colab_train_oversight.ipynb` — **Runnable Colab notebook (judges: start here)**
- `round2_oversight_inspector/oversight_env/env.py` — OversightEnv (OpenEnv compliant)
- `round2_oversight_inspector/openenv_oversight.yaml` — OpenEnv manifest
- `round2_oversight_inspector/assets/` — Training plots (PNG — reward curves, curriculum progression, metrics)
- `round2_oversight_inspector/tests/` — 20 unit tests

---

## Quick commands

```bash
# Round 1 — dry-run (no GPU needed)
python inference.py --dry-run

# Round 2 — dry-run inference (no GPU needed)
cd round2_oversight_inspector && python inference_oversight.py --dry-run

# Round 2 — training dry-run (no GPU needed)
cd round2_oversight_inspector && python train_oversight.py --dry-run

# All tests
pytest tests/ -v                              # 84 Round 1 tests
pytest round2_oversight_inspector/tests/ -v   # 20 Round 2 tests
```

---

## Full directory tree

```
AI-Oversight-Inspector/
│
├── openenv.yaml                        # Round 1 OpenEnv manifest
├── openenv_email_ops/                  # Round 1: Email RL Environment
│   ├── env.py                          #   EmailOpsEnv (reset/step/state)
│   ├── reward_engine.py                #   Composable reward rubric
│   ├── graders.py                      #   Per-component graders
│   └── ...
│
├── multi_agent_system/                 # Round 1: Multi-agent evaluation layer
│   ├── agents.py                       #   4 specialized agents
│   ├── orchestrator.py                 #   Pipeline coordination
│   └── self_improving_memory.py        #   Per-agent mistake tracking
│
├── round2_oversight_inspector/         # Round 2 (Grand Finale): AI Oversight Inspector
│   ├── openenv_oversight.yaml          #   Round 2 OpenEnv manifest
│   ├── oversight_env/                  #   Round 2 RL Environment
│   │   ├── env.py                      #     OversightEnv (OpenEnv compliant)
│   │   ├── reward_engine.py            #     Oversight reward (precision-first)
│   │   ├── adaptive_curriculum.py      #     Live Easy→Medium→Hard curriculum
│   │   └── sub_agent_fleet.py          #     4-agent fleet with violation injection
│   ├── train_oversight.py              #   GRPO training script (469 lines)
│   ├── inference_oversight.py          #   Baseline agent runner
│   ├── benchmark_baseline.py           #   Random vs trained comparison
│   ├── colab_train_oversight.ipynb     #   Runnable Colab notebook (T4 GPU, ~30 min)
│   ├── assets/                         #   Training evidence (PNG plots)
│   │   ├── training_results.png        #     Reward curve over 500 steps
│   │   ├── curriculum_progression.png  #     Easy→Medium→Hard difficulty progression
│   │   └── detailed_metrics.png        #     FP rate, severity accuracy before/after
│   └── tests/                          #   20 Round 2 unit tests
│
├── server/app.py                       # FastAPI server (client/server separation)
├── app.py                              # HF Space entry point (Gradio + API)
├── Dockerfile                          # Docker deployment
├── inference.py                        # Round 1 baseline agent
├── tests/                              # 84 Round 1 unit tests
├── README.md                           # Main project README
└── REPO_STRUCTURE.md                   # This file
```
