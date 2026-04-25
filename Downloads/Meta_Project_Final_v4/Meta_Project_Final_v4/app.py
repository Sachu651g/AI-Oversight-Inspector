"""
OpenEnv Email Ops — HF Space API Server
Exposes reset(), step(), state() as HTTP endpoints + Gradio UI
"""
from __future__ import annotations
import json, os, sys
import gradio as gr
import uvicorn
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from openenv_email_ops.env import EmailOpsEnv
from openenv_email_ops.models import Action, TaskConfig
from openenv_email_ops.pretty_printer import PrettyPrinter

_DEFAULT_TASK = TaskConfig(
    task_id="easy", description="Classify emails correctly", difficulty="easy",
    max_steps=30, inbox_size=5, reward_components=["classification"],
)
_env = EmailOpsEnv(task_config=_DEFAULT_TASK, seed=42)
_printer = PrettyPrinter()

api = FastAPI(title="openenv-email-ops", version="1.0.0")

@api.get("/")
def root():
    return {"name": "openenv-email-ops", "version": "1.0.0", "status": "running",
            "theme": "Multi-Agent Interactions + Scalable Oversight",
            "hackathon": "Meta x HF OpenEnv Hackathon 2026"}

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
        "reward": reward.model_dump(), "done": done, "info": info,
    })

@api.get("/state")
def state():
    obs = _env.state()
    return JSONResponse(obs.model_dump(exclude={"current_email": {"ground_truth"}}))

@api.get("/demo")
def demo():
    results = {}
    for diff in ["easy", "medium", "hard"]:
        task = TaskConfig(task_id=diff, description=f"{diff} demo", difficulty=diff,
                          max_steps=5, inbox_size=3, reward_components=["classification"])
        env = EmailOpsEnv(task_config=task, seed=99)
        env.reset(seed=99)
        total_reward, steps, done = 0.0, 0, False
        while not done and steps < 5:
            action = Action(action_type="classify_email", value="important")
            _, reward, done, _ = env.step(action)
            total_reward += reward.total; steps += 1
        results[diff] = {"steps": steps, "total_reward": round(total_reward, 3)}
    return JSONResponse({"demo_results": results, "status": "ok"})

def run_email_demo(difficulty: str, seed: int) -> str:
    try:
        task = TaskConfig(task_id=difficulty, description=f"{difficulty} demo", difficulty=difficulty,
                          max_steps=10, inbox_size=5, reward_components=["classification", "prioritization", "routing"])
        env = EmailOpsEnv(task_config=task, seed=int(seed))
        env.reset(seed=int(seed))
        action_cycle = [
            ("classify_email", "important"), ("prioritize_email", "high"),
            ("route_email", "support"), ("reply_email", "Thank you for your message. We will investigate this immediately."),
        ]
        rows, total, steps, done = [], 0.0, 0, False
        while not done and steps < 8:
            at, val = action_cycle[steps % len(action_cycle)]
            _, reward, done, _ = env.step(Action(action_type=at, value=val))
            total += reward.total
            color = "#16a34a" if reward.total > 0 else "#dc2626"
            rows.append(f"<tr><td style='padding:6px 12px;border-bottom:1px solid #e5e7eb'>{steps+1}</td>"
                        f"<td style='padding:6px 12px;border-bottom:1px solid #e5e7eb'><code>{at}</code></td>"
                        f"<td style='padding:6px 12px;border-bottom:1px solid #e5e7eb'><code>{val[:30]}</code></td>"
                        f"<td style='padding:6px 12px;border-bottom:1px solid #e5e7eb;color:{color};font-weight:600'>{reward.total:+.3f}</td></tr>")
            steps += 1
        score_color = "#16a34a" if total > 0 else "#dc2626"
        return f"""<div style='font-family:system-ui;max-width:700px'>
  <div style='background:#064e3b;color:white;padding:14px 18px;border-radius:8px 8px 0 0'>
    <b>📬 Live Episode — {difficulty.upper()} (seed={seed})</b>
    <span style='font-size:12px;opacity:0.75;margin-left:12px'>EmailOpsEnv · OpenEnv compliant</span>
  </div>
  <table style='width:100%;border-collapse:collapse;background:white'>
    <thead style='background:#f3f4f6'><tr>
      <th style='padding:7px 12px;text-align:left;font-size:12px'>Step</th>
      <th style='padding:7px 12px;text-align:left;font-size:12px'>Action</th>
      <th style='padding:7px 12px;text-align:left;font-size:12px'>Value</th>
      <th style='padding:7px 12px;text-align:left;font-size:12px'>Reward</th>
    </tr></thead>
    <tbody>{''.join(rows)}</tbody>
  </table>
  <div style='background:#f0fdf4;border:1px solid #bbf7d0;padding:10px 14px;border-radius:0 0 8px 8px'>
    <span style='font-weight:600;color:{score_color}'>Total: {total:+.3f}</span>
    <span style='margin-left:12px;color:#6b7280;font-size:13px'>{steps} steps</span>
  </div></div>"""
    except Exception as e:
        return f"<p style='color:red'>Error: {e}</p>"

def run_oversight_demo() -> str:
    try:
        sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "round2"))
        from oversight_env.env import OversightEnv
        env = OversightEnv(task_id="easy", difficulty="easy", max_steps=5, seed=42)
        obs = env.reset()
        rows = []
        for output in obs.sub_agent_outputs[:4]:
            has_v = getattr(output, 'has_violation', False)
            badge = ("<span style='background:#fef2f2;color:#dc2626;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600'>⚠ VIOLATION</span>"
                     if has_v else
                     "<span style='background:#f0fdf4;color:#16a34a;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600'>✓ CLEAN</span>")
            rows.append(f"<tr><td style='padding:7px 12px;border-bottom:1px solid #e5e7eb'><b>{output.agent_role}</b></td>"
                        f"<td style='padding:7px 12px;border-bottom:1px solid #e5e7eb'>{output.decision[:50]}</td>"
                        f"<td style='padding:7px 12px;border-bottom:1px solid #e5e7eb'>{output.confidence:.2f}</td>"
                        f"<td style='padding:7px 12px;border-bottom:1px solid #e5e7eb'>{badge}</td></tr>")
        return f"""<div style='font-family:system-ui;max-width:700px'>
  <div style='background:#1e1b4b;color:white;padding:14px 18px;border-radius:8px 8px 0 0'>
    <b>🛡 Oversight Inspector — Sub-Agent Fleet Output</b>
    <span style='font-size:12px;opacity:0.75;margin-left:12px'>Ground truth hidden from overseer</span>
  </div>
  <table style='width:100%;border-collapse:collapse;background:white'>
    <thead style='background:#f3f4f6'><tr>
      <th style='padding:7px 12px;text-align:left;font-size:12px'>Agent Role</th>
      <th style='padding:7px 12px;text-align:left;font-size:12px'>Decision</th>
      <th style='padding:7px 12px;text-align:left;font-size:12px'>Confidence</th>
      <th style='padding:7px 12px;text-align:left;font-size:12px'>Ground Truth</th>
    </tr></thead>
    <tbody>{''.join(rows)}</tbody>
  </table>
  <div style='background:#eef2ff;border:1px solid #c7d2fe;padding:10px 14px;border-radius:0 0 8px 8px;font-size:13px;color:#3730a3'>
    <b>Overseer task:</b> Which agents produced violations? Reason from inputs/outputs/explanations only — no ground truth.
  </div></div>"""
    except Exception as e:
        return f"<p style='color:#6b7280;font-style:italic'>Oversight env not available here: {e}</p>"

with gr.Blocks(title="openenv-email-ops · AI Oversight Inspector", theme=gr.themes.Soft(),
               css="footer{display:none!important}") as demo_ui:
    gr.HTML("""<div style='background:linear-gradient(135deg,#064e3b,#1e1b4b);color:white;
    padding:20px 24px;border-radius:10px;margin-bottom:8px'>
    <h1 style='margin:0 0 4px;font-size:22px'>📧 openenv-email-ops · AI Oversight Inspector</h1>
    <p style='margin:0;opacity:0.85;font-size:13px'><b>Meta × Hugging Face OpenEnv Hackathon 2026</b>
    &nbsp;·&nbsp;Theme: Multi-Agent Interactions + Scalable Oversight
    &nbsp;·&nbsp;<a href='https://github.com/Sachu651g/Email-Env' style='color:#6ee7b7'>GitHub</a>
    &nbsp;·&nbsp;<a href='https://huggingface.co/spaces/sachingunagi66/openenv-email-ops' style='color:#6ee7b7'>HF Space</a>
    </p></div>""")
    with gr.Tabs():
        with gr.Tab("📬 EmailOpsEnv"):
            gr.Markdown("**Run a live episode** — watch step-by-step rewards as an agent processes emails")
            with gr.Row():
                diff_dd = gr.Dropdown(["easy","medium","hard"], value="easy", label="Difficulty")
                seed_sl = gr.Slider(1, 200, value=42, step=1, label="Seed")
            gr.Button("▶ Run Episode", variant="primary").click(run_email_demo, [diff_dd, seed_sl], gr.HTML())
        with gr.Tab("🛡 Oversight Inspector"):
            gr.Markdown("**Round 2 environment** — AI monitors AI. Overseer sees sub-agent outputs but never ground truth.")
            gr.Button("▶ Show Sub-Agent Batch", variant="primary").click(run_oversight_demo, [], gr.HTML())
        with gr.Tab("📊 Results"):
            gr.HTML("""<div style='display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:10px 0'>
              <div style='background:#f0fdf4;border:1px solid #bbf7d0;padding:14px;border-radius:8px;text-align:center'>
                <div style='font-size:26px;font-weight:700;color:#16a34a'>+36pp</div>
                <div style='font-size:12px;color:#374151;margin-top:3px'>Detection accuracy<br>42% → <b>78%</b></div></div>
              <div style='background:#f0fdf4;border:1px solid #bbf7d0;padding:14px;border-radius:8px;text-align:center'>
                <div style='font-size:26px;font-weight:700;color:#16a34a'>−23pp</div>
                <div style='font-size:12px;color:#374151;margin-top:3px'>False positive rate<br>35% → <b>12%</b></div></div>
              <div style='background:#f0fdf4;border:1px solid #bbf7d0;padding:14px;border-radius:8px;text-align:center'>
                <div style='font-size:26px;font-weight:700;color:#16a34a'>+0.53</div>
                <div style='font-size:12px;color:#374151;margin-top:3px'>Episode score<br>0.21 → <b>0.74</b></div></div></div>""")
            gr.Image("round2/assets/training_results.png", label="Reward curve")
            gr.Image("round2/assets/curriculum_progression.png", label="Adaptive curriculum")
        with gr.Tab("ℹ️ About"):
            gr.Markdown("""
## openenv-email-ops · AI Oversight Inspector

**The core question:** Everyone builds AI agents. Who monitors them?

This project trains an LLM to act as an **AI Oversight Inspector** — watching a fleet of enterprise email-processing agents and detecting violations (hallucinations, wrong classifications, policy breaches, cross-agent inconsistencies) without ever seeing ground truth labels.

| Environment | Theme | Key feature |
|---|---|---|
| EmailOpsEnv (Round 1) | Theme 3.2 — Personalized Tasks | Classify → prioritize → route → reply. VIP penalties. Partial observability. |
| OversightEnv (Round 2) | Theme 1 — Multi-Agent | AI overseer monitors 4-agent fleet. GRPO training. Adaptive curriculum. |

**Training**: GRPO via HF TRL + Unsloth · Llama-3.2-1B-Instruct · 500 steps · Free T4 GPU · ~30 min

**Why FP penalty > miss penalty**: In real enterprise deployments, false alarms cause alert fatigue and destroy trust. The −0.30 FP vs −0.20 miss asymmetry forces the model to be precise, not just sensitive.
            """)

app = gr.mount_gradio_app(api, demo_ui, path="/gradio")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
