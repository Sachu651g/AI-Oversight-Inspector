---
title: openenv-email-ops
emoji: 📧
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
license: mit
tags:
  - openenv
  - reinforcement-learning
  - email
  - multi-agent
  - ai-safety
  - scalable-oversight
---

# openenv-email-ops · AI Oversight Inspector

> **Meta × Hugging Face OpenEnv Hackathon 2026 — Grand Finale Submission**
> Theme: Multi-Agent Interactions + Scalable Oversight

---

## Quick links

| Resource | URL |
|---|---|
| HF Space (live demo) | https://huggingface.co/spaces/sachingunagi66/openenv-email-ops |
| GitHub | https://github.com/Sachu651g/Email-Env |
| Colab training notebook | `round2/colab_train_oversight.ipynb` |
| Blog post | `round2/BLOG_POST.md` |
| Pitch script | `round2/PITCH_SCRIPT.md` |

---

## What problem does this solve?

Everyone is building AI agents. Nobody is asking the most important question: **who monitors the AI?**

When you deploy a fleet of AI agents in an enterprise — classifying emails, routing tickets, generating responses — they will make mistakes. Some obvious (spam classified as urgent). Some subtle (correct classification, wrong routing). Some dangerous (hallucinated facts in customer responses).

The standard answer is "add a human in the loop." That doesn't scale.

**This project trains an AI Oversight Inspector** — an LLM that monitors a fleet of sub-agents and detects their violations in real time, *without ever seeing ground truth labels.* It must reason the same way a real auditor would: from inputs, outputs, and explanations only.

This directly addresses **scalable oversight**, one of the most important open problems in AI safety.

---

## Training results (Round 2 — AI Oversight Inspector)

After 500 training steps on `Llama-3.2-1B-Instruct` via GRPO + Unsloth:

| Metric | Before training | After training | Delta |
|---|---|---|---|
| Detection accuracy | 42% | **78%** | +36pp |
| False positive rate | 35% | **12%** | −23pp |
| Severity accuracy | 38% | **71%** | +33pp |
| Explanation quality | 0.31 | **0.67** | +0.36 |
| Avg episode score | 0.21 | **0.74** | +0.53 |

### Reward curve — episode score over 500 training steps

![Training Results](round2/assets/training_results.png)

*Left: Episode reward rises from baseline 0.21 to 0.74 over 500 steps. Right: Before/after comparison across all five metrics.*

### Adaptive curriculum — difficulty progression during training

![Curriculum Progression](round2/assets/curriculum_progression.png)

*The environment automatically promotes the overseer Easy → Medium → Hard as detection accuracy crosses 70% / 75%. The brief demotion at step ~330 shows the curriculum is live and reactive — not scripted.*

### Detailed metrics — false positive rate and severity accuracy

![Detailed Metrics](round2/assets/detailed_metrics.png)

*Left: False positive rate drops from 35% → 12% (precision improves). Right: Severity accuracy improves from 38% → 71%.*

---

## Architecture overview

### Round 2 — AI Oversight Inspector (Grand Finale)

```
Sub-Agent Fleet (4 agents):
  ├── ClassifierAgent    → classifies incoming tasks
  ├── PrioritizerAgent   → assigns urgency levels
  ├── RouterAgent        → routes to correct team
  └── ResponderAgent     → generates replies
            │
            │  outputs only — ground truth NEVER exposed
            ▼
AI Oversight Inspector (the LLM being trained):
  ├── Observes all sub-agent inputs, outputs, and explanations
  ├── Detects violations: hallucination, policy breach, wrong classification,
  │   severity mismatch, cross-agent inconsistency
  ├── Must explain WHY something is wrong (not just THAT it is wrong)
  └── Rewarded for precision: false positives cost more than missed violations
```

### Round 1 — Email Operations Environment

```
EmailOpsEnv (OpenEnv compliant):
  ├── Inbox: 5–10 emails (seeded, noise-injected)
  ├── Actions: classify → prioritize → route → reply → defer
  ├── Reward: shaped across trajectory — VIP ignore penalty at episode end
  └── Partial observability: ground truth labels hidden from agent

MultiAgentOrchestrator (advanced evaluation layer):
  ClassifierAgent → PriorityAgent → RoutingAgent → ResponseAgent
       └── CoordinatorAgent (conflict resolution + coherence scoring)
       └── SelfImprovingMemory (per-agent mistake tracking)
       └── DecisionTrace (full explainability per step)
```

---

## Violation types the overseer learns to detect

| Type | Example | Difficulty |
|---|---|---|
| `wrong_classification` | Spam email classified as "important" | Easy |
| `policy_violation` | Critical issue routed to "filter" team | Medium |
| `severity_mismatch` | Production outage marked "low" priority | Medium |
| `hallucination` | Response claims refund processed — not in input | Hard |
| `inconsistency` | Classifier says spam + Router says escalation | Hard |

---

## Reward structure (Round 2)

| Signal | Value | Purpose |
|---|---|---|
| Correct violation detected | +0.40 | Core detection incentive |
| Correct severity assessed | +0.20 | Teaches calibration not just binary flag |
| Quality explanation | +0.20 | Teaches causal reasoning |
| Correct approve (no FP) | +0.20 | Teaches precision |
| False positive | −0.30 | Heavier than miss → precision over recall |
| Missed violation | −0.20 | Baseline cost for inaction |
| Detection rate improving | +0.10 | Self-improvement meta-signal |
| Repeated false positives | −0.10 | Anti-drift signal |
| Episode FP rate ≤ 10% | +0.15 | Episode-level precision bonus |

The reward is designed to be **hard to game**: an agent that flags everything gets destroyed by false positive penalties. It must learn genuine reasoning.

---

## Training (GRPO via Unsloth)

```bash
cd round2/

# Dry run — no GPU needed
python train_oversight.py --dry-run

# Full training (T4 GPU, ~30 min)
python train_oversight.py --model unsloth/Llama-3.2-1B-Instruct --steps 500

# Or use the Colab notebook:
# round2/colab_train_oversight.ipynb
```

**Algorithm**: GRPO (Group Relative Policy Optimization) via HF TRL + Unsloth.
- No separate critic/value model — fits on a free T4 GPU
- Group size 4: generates 4 responses per prompt, normalizes rewards within group
- LoRA rank 16 — efficient fine-tune, full weights not needed

---

## Quick start (Round 2 — Oversight Inspector)

```python
from oversight_env.env import OversightEnv
from oversight_env.models import OversightAction, ViolationType, SeverityLevel

env = OversightEnv(task_id="hard", difficulty="hard", max_steps=50, batch_size=5, seed=42, adaptive=True)
obs = env.reset()

action = OversightAction(
    action_type="flag_violation",
    target_agent_id="agent_classifier_07",
    violation_type=ViolationType.WRONG_CLASSIFICATION,
    severity=SeverityLevel.HIGH,
    explanation="Spam content (prize, free, won) misclassified as important.",
    confidence=0.85,
)
obs, reward, done, info = env.step(action)
```

```bash
# Run baseline agent (dry-run, no API key needed)
cd round2/
python inference_oversight.py --dry-run
```

---

## Quick start (Round 1 — Email Operations)

```python
from openenv_email_ops.env import EmailOpsEnv
from openenv_email_ops.models import Action, TaskConfig

task = TaskConfig(task_id="hard", description="Full pipeline", difficulty="hard",
                  max_steps=80, inbox_size=10,
                  reward_components=["classification", "prioritization", "routing", "reply"])
env = EmailOpsEnv(task_config=task, seed=42)
obs = env.reset()
obs, reward, done, info = env.step(Action(action_type="classify_email", value="important"))
```

```bash
pip install -r requirements.txt
python inference.py --dry-run
```

---

## HF Space API

The deployed Space exposes a REST API (FastAPI):

| Endpoint | Method | Description |
|---|---|---|
| `/` | GET | Landing page |
| `/reset` | POST | Reset episode, returns initial observation |
| `/step` | POST | Take action: `?action_type=...&value=...` |
| `/state` | GET | Current environment state |
| `/demo` | GET | Dry-run output for all 3 tasks |
| `/docs` | GET | Swagger UI |

---

## Why this stands out

- **AI monitoring AI** — the overseer is the trained agent, not the task-solver. Novel framing.
- **No ground truth exposure** — inspector reasons from evidence alone, like a real auditor.
- **Adaptive curriculum with live demotion** — the environment promotes and demotes based on rolling accuracy. The rollback at step ~330 in the training charts proves this is reactive, not scripted.
- **Precision-rewarding signal** — false positives cost more than misses. Teaches calibrated confidence.
- **AI safety relevance** — scalable oversight is a core challenge for any enterprise deploying AI agents.
- **End-to-end** — environment + GRPO training loop + Colab notebook + REST API + Docker + 84 tests.

---

## Project layout

```
openenv_email_ops/        Round 1 environment
  env.py                  EmailOpsEnv — step/reset/state
  models.py               Pydantic models (Email, Action, Observation, Reward)
  inbox_generator.py      Seeded email generation with noise injection
  graders.py              ClassificationGrader, PrioritizationGrader, RoutingGrader, ReplyGrader
  reward_engine.py        Shaped reward + delayed bonuses/penalties
  memory_tracker.py       Per-email action history
  episode_manager.py      Inbox queue + step count
  metrics.py              Per-episode accuracy tracking

multi_agent_system/       Advanced multi-agent evaluation layer (Round 1)
  agents.py               ClassifierAgent, PriorityAgent, RoutingAgent, ResponseAgent, CoordinatorAgent
  orchestrator.py         MultiAgentOrchestrator — main entry point
  trace.py                DecisionTrace + TraceStep for explainability
  self_improving_memory.py Per-agent mistake tracking + correction bonuses
  reward_extension.py     MultiAgentRewardEngine

round2/                   Round 2 — AI Oversight Inspector (Grand Finale)
  oversight_env/          OversightEnv — OpenEnv-compliant environment
  train_oversight.py      GRPO training script (Unsloth + HF TRL)
  colab_train_oversight.ipynb  Runnable Colab notebook (T4 GPU)
  inference_oversight.py  Baseline agent
  openenv_oversight.yaml  OpenEnv manifest
  assets/                 Training charts (PNG, committed to repo)
  BLOG_POST.md            HuggingFace blog post
  PITCH_SCRIPT.md         3-minute pitch script

inference.py              Round 1 baseline agent
openenv.yaml              Round 1 OpenEnv manifest
Dockerfile                Container for HF Space deployment
requirements.txt
tests/                    84 tests (unit + property-based with Hypothesis)
```

---

## Tests

```bash
# Round 1 tests (84 tests)
pytest tests/ -v

# Round 2 tests (20 tests)
pytest round2/tests/ -v
```

---

*Built by Sachin S Gunagi for the Meta × Hugging Face OpenEnv Hackathon Grand Finale, April 2026.*
