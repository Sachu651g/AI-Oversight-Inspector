"""
OpenEnv Email Ops — HF Space API Server
Exposes reset(), step(), state() as HTTP endpoints + Gradio UI
"""
from __future__ import annotations

import os
import uvicorn
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import gradio as gr

from openenv_email_ops.env import EmailOpsEnv
from openenv_email_ops.models import Action, TaskConfig
from openenv_email_ops.pretty_printer import PrettyPrinter

# ---------------------------------------------------------------------------
# Global env instance (stateful for demo)
# ---------------------------------------------------------------------------
_DEFAULT_TASK = TaskConfig(
    task_id="easy",
    description="Classify emails correctly",
    difficulty="easy",
    max_steps=30,
    inbox_size=5,
    reward_components=["classification"],
)
_env = EmailOpsEnv(task_config=_DEFAULT_TASK, seed=42)
_printer = PrettyPrinter()

# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
api = FastAPI(title="openenv-email-ops", version="1.0.0")


@api.get("/")
def root():
    return {"name": "openenv-email-ops", "version": "1.0.0", "status": "running"}


@api.get("/health")
def health():
    return {"status": "healthy"}


@api.post("/reset")
def reset(seed: int = 42):
    obs = _env.reset(seed=seed)
    return JSONResponse({"observation": obs.model_dump(exclude={"current_email": {"ground_truth"}}), "status": "ok"})


@api.post("/step")
def step(action_type: str = "classify_email", value: str = "spam"):
    action = Action(action_type=action_type, value=value)
    obs, reward, done, info = _env.step(action)
    return JSONResponse({
        "observation": obs.model_dump(exclude={"current_email": {"ground_truth"}}),
        "reward": reward.model_dump(),
        "done": done,
        "info": info,
    })


@api.get("/state")
def state():
    return JSONResponse(_env.state())


@api.get("/multi-agent-demo")
def multi_agent_demo():
    """Run the multi-agent orchestrator on the hard task and return the full decision trace."""
    try:
        from multi_agent_system.orchestrator import MultiAgentOrchestrator

        env = EmailOpsEnv.from_yaml("openenv.yaml", "hard", seed=42)
        obs = env.reset(seed=42)
        done = False
        orchestrator = MultiAgentOrchestrator()
        orchestrator.reset(task_id="hard")
        step_num = 0
        total_reward = 0.0

        while not done and step_num < 12:
            email = obs.current_email
            if email is None:
                break
            classification_history = env._memory_tracker.get_classification_history(email.sender_type)
            action, trace_step = orchestrator.process(
                email=email,
                task_config=env._task_config,
                step_count=obs.step_count,
                classification_history=classification_history,
            )
            obs, reward, done, info = env.step(action)
            total_reward = reward.episode_reward
            step_num += 1

        trace = orchestrator.get_trace()
        if trace:
            trace.finalize(total_reward)

        ep_metrics = orchestrator.get_episode_metrics(
            total_steps=step_num,
            optimal_steps=env._task_config.inbox_size,
        )

        return JSONResponse({
            "task": "hard",
            "total_steps": step_num,
            "final_score": round(max(0.001, min(0.999, total_reward)), 3),
            "episode_metrics": ep_metrics,
            "trace": trace.to_dict() if trace else {},
        })
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


# ---------------------------------------------------------------------------
# Gradio UI (dry-run demo)
# ---------------------------------------------------------------------------
_MOCK = [
    Action(action_type="classify_email", value="important"),
    Action(action_type="prioritize_email", value="high"),
    Action(action_type="route_email", value="support"),
    Action(action_type="generate_reply",
           value="Hello, thank you for reaching out. We will respond shortly."),
]


def run_demo():
    lines = ["openenv-email-ops — Dry Run Demo", "=" * 40, ""]
    step_idx = 0
    for task_id in ["easy", "medium", "hard"]:
        env = EmailOpsEnv.from_yaml("openenv.yaml", task_id, seed=42)
        obs = env.reset(seed=42)
        done = False
        total = 0.0
        breakdown: dict[str, float] = {}
        while not done:
            action = _MOCK[step_idx % len(_MOCK)]
            step_idx += 1
            obs, reward, done, _ = env.step(action)
            total = reward.episode_reward
            for k, v in reward.breakdown.items():
                breakdown[k] = breakdown.get(k, 0.0) + v
        lines.append(f"=== Task: {task_id.upper()} ===")
        lines.append(f"Total reward: {total:.4f}")
        for k, v in breakdown.items():
            lines.append(f"  {k}: {v:.4f}")
        lines.append("")
    return "\n".join(lines)


with gr.Blocks(title="openenv-email-ops") as demo:
    gr.Markdown("# 📧 openenv-email-ops\n**Enterprise Inbox Simulation — OpenEnv RL Environment**")
    gr.Markdown("API endpoints: `POST /reset` · `POST /step` · `GET /state`")
    btn = gr.Button("▶ Run Dry-Run Inference (All 3 Tasks)", variant="primary")
    out = gr.Textbox(label="Output", lines=25, interactive=False)
    btn.click(fn=run_demo, outputs=out)

# Mount Gradio into FastAPI
app = gr.mount_gradio_app(api, demo, path="/ui")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
