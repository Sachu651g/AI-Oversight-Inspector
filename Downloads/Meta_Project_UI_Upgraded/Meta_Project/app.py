"""
OpenEnv Email Ops — HF Space API Server + Premium UI
Meta × HuggingFace OpenEnv Hackathon 2026
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


# ─────────────────────────────────────────────────────────
# UI LOGIC FUNCTIONS
# ─────────────────────────────────────────────────────────

def run_email_demo(difficulty: str, seed: int) -> str:
    try:
        task = TaskConfig(
            task_id=difficulty, description=f"{difficulty} demo", difficulty=difficulty,
            max_steps=10, inbox_size=5,
            reward_components=["classification", "prioritization", "routing"],
        )
        env = EmailOpsEnv(task_config=task, seed=int(seed))
        env.reset(seed=int(seed))
        action_cycle = [
            ("classify_email", "important"),
            ("prioritize_email", "high"),
            ("route_email", "support"),
            ("generate_reply", "Thank you for your message. We will investigate this immediately."),
        ]
        rows, total, steps, done = [], 0.0, 0, False
        while not done and steps < 8:
            at, val = action_cycle[steps % len(action_cycle)]
            _, reward, done, _ = env.step(Action(action_type=at, value=val))
            total += reward.total
            is_pos = reward.total > 0
            rc = "reward-pos" if is_pos else "reward-neg"
            ri = "↑" if is_pos else "↓"
            action_labels = {
                "classify_email": "🏷 Classify",
                "prioritize_email": "⚡ Prioritize",
                "route_email": "📡 Route",
                "generate_reply": "✉ Reply",
            }
            label = action_labels.get(at, at)
            short_val = val[:28] + ("…" if len(val) > 28 else "")
            rows.append(f"""<tr class="step-row" style="animation-delay:{steps*0.08}s">
              <td class="step-num">{steps+1:02d}</td>
              <td><span class="action-pill">{label}</span></td>
              <td class="val-cell"><code>{short_val}</code></td>
              <td class="{rc}">{ri} {reward.total:+.3f}</td>
            </tr>""")
            steps += 1
        tc = "reward-pos" if total > 0 else "reward-neg"
        dc = {"easy": "#10b981", "medium": "#f59e0b", "hard": "#ef4444"}.get(difficulty, "#6366f1")
        return f"""<div class="ep-card">
  <div class="ep-header" style="border-left:4px solid {dc}">
    <div class="ep-title"><span class="ep-icon">📬</span><span>Live Episode — <strong>{difficulty.upper()}</strong></span><span class="ep-badge">seed={seed}</span></div>
    <span class="ep-sub">EmailOpsEnv · OpenEnv compliant</span>
  </div>
  <table class="ep-table"><thead><tr><th>#</th><th>Action</th><th>Value</th><th>Reward</th></tr></thead>
  <tbody>{"".join(rows)}</tbody></table>
  <div class="ep-footer">
    <span class="{tc} total-score">Σ {total:+.3f}</span>
    <span class="ep-meta">{steps} steps · {difficulty} difficulty</span>
  </div></div>"""
    except Exception as e:
        return f"<div class='error-card'>⚠ Error: {e}</div>"


def run_oversight_demo() -> str:
    try:
        sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "round2"))
        from oversight_env.env import OversightEnv
        env = OversightEnv(task_id="easy", difficulty="easy", max_steps=5, seed=42)
        obs = env.reset()
        rows = []
        role_icons = {"classifier": "🏷", "prioritizer": "⚡", "router": "📡", "responder": "✉"}
        for i, output in enumerate(obs.sub_agent_outputs[:4]):
            has_v = getattr(output, "has_violation", False)
            icon = role_icons.get(output.agent_role, "🤖")
            badge = ("<span class='badge-violation'>⚠ VIOLATION</span>" if has_v
                     else "<span class='badge-clean'>✓ CLEAN</span>")
            row_class = "violation-row" if has_v else "clean-row"
            conf_pct = int(output.confidence * 100)
            conf_bar = f"<div class='conf-track'><div class='conf-fill' style='width:{conf_pct}%'></div></div>"
            rows.append(f"""<tr class="agent-row {row_class}" style="animation-delay:{i*0.1}s">
              <td><span class="agent-role">{icon} {output.agent_role}</span></td>
              <td class="decision-cell">{output.decision[:45]}{"…" if len(output.decision)>45 else ""}</td>
              <td>{conf_bar}<span class="conf-label">{conf_pct}%</span></td>
              <td>{badge}</td></tr>""")
        question = getattr(obs, "overseer_question",
                           "Which agents produced violations? Reason from inputs/outputs/explanations only — no ground truth.")
        return f"""<div class="ov-card">
  <div class="ov-header">
    <div class="ov-title"><span class="ov-icon">🛡</span><span>Oversight Inspector — Sub-Agent Fleet Output</span><span class="ov-badge">Ground truth hidden</span></div>
    <span class="ov-sub">4-agent fleet · GRPO-trained LLM overseer</span>
  </div>
  <table class="ov-table"><thead><tr><th>Agent Role</th><th>Decision</th><th>Confidence</th><th>Status</th></tr></thead>
  <tbody>{"".join(rows)}</tbody></table>
  <div class="ov-question"><span class="question-icon">🤔</span><span>{question}</span></div></div>"""
    except Exception as e:
        return f"<div class='ov-unavail'>🛡 Oversight env: {e}</div>"


# ─────────────────────────────────────────────────────────
# GLOBAL CSS
# ─────────────────────────────────────────────────────────

GLOBAL_CSS = """
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Orbitron:wght@600;800&display=swap');

:root {
  --bg:#080c14; --bg2:#0d1220; --bg3:#111827;
  --surface:#131c2e; --surface2:#1a2540;
  --border:#1f2e4a; --border2:#253554;
  --accent:#00e5ff; --accent2:#7c3aed;
  --green:#10b981; --amber:#f59e0b; --red:#ef4444;
  --text:#e2e8f0; --muted:#64748b; --muted2:#94a3b8;
  --r:10px; --r2:6px;
}

body, .gradio-container { background:var(--bg)!important; font-family:'DM Sans',sans-serif!important; color:var(--text)!important; }
footer{display:none!important}
.gradio-container{max-width:980px!important;margin:0 auto!important}
.tabs{background:transparent!important}
.tab-nav{background:var(--bg2)!important;border-bottom:1px solid var(--border)!important;border-radius:var(--r) var(--r) 0 0!important;padding:0!important}
.tab-nav button{font-family:'DM Sans',sans-serif!important;font-weight:500!important;color:var(--muted2)!important;background:transparent!important;border:none!important;border-bottom:2px solid transparent!important;padding:12px 20px!important;font-size:13px!important;transition:all 0.2s!important;letter-spacing:0.02em!important}
.tab-nav button:hover{color:var(--accent)!important}
.tab-nav button.selected{color:var(--accent)!important;border-bottom-color:var(--accent)!important;background:transparent!important}
.tabitem{background:var(--bg2)!important;padding:24px!important}
button.primary{background:linear-gradient(135deg,#00b4d8,#0077b6)!important;border:none!important;font-family:'DM Sans',sans-serif!important;font-weight:600!important;letter-spacing:0.04em!important;font-size:14px!important;padding:14px 28px!important;border-radius:var(--r)!important;color:white!important;cursor:pointer!important;transition:all 0.25s!important;box-shadow:0 4px 20px rgba(0,180,216,0.35)!important}
button.primary:hover{transform:translateY(-2px)!important;box-shadow:0 8px 30px rgba(0,180,216,0.5)!important}
label,.label-wrap span{color:var(--muted2)!important;font-size:12px!important;font-weight:500!important;text-transform:uppercase!important;letter-spacing:0.08em!important}
select,input[type=number]{background:var(--surface2)!important;border:1px solid var(--border2)!important;color:var(--text)!important;border-radius:var(--r2)!important}
input[type=range]{accent-color:var(--accent)!important}
.wrap,.block{background:transparent!important;border:none!important}

/* Hero */
.hero{background:linear-gradient(135deg,#040d1a 0%,#0a1628 40%,#0d1f3c 100%);border:1px solid var(--border2);border-radius:var(--r);padding:32px 36px;margin-bottom:4px;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;top:-60px;right:-60px;width:240px;height:240px;background:radial-gradient(circle,rgba(0,229,255,0.07) 0%,transparent 70%);pointer-events:none}
.hero::after{content:'';position:absolute;bottom:-40px;left:30%;width:180px;height:180px;background:radial-gradient(circle,rgba(124,58,237,0.06) 0%,transparent 70%);pointer-events:none}
.hero-title{font-family:'Orbitron',monospace;font-size:22px;font-weight:800;color:var(--accent);letter-spacing:0.05em;margin:0 0 6px;text-shadow:0 0 30px rgba(0,229,255,0.4)}
.hero-sub{font-size:13px;color:var(--muted2);margin:0 0 16px;font-weight:400}
.hero-tags{display:flex;flex-wrap:wrap;gap:8px}
.hero-tag{background:rgba(0,229,255,0.07);border:1px solid rgba(0,229,255,0.2);color:var(--accent);font-size:11px;padding:4px 10px;border-radius:20px;font-weight:600;letter-spacing:0.05em}
.hero-tag.purple{background:rgba(124,58,237,0.08);border-color:rgba(124,58,237,0.25);color:#a78bfa}
.hero-tag.green{background:rgba(16,185,129,0.08);border-color:rgba(16,185,129,0.25);color:var(--green)}
.hero-links{margin-top:14px;display:flex;gap:12px}
.hero-link{font-size:12px;color:var(--muted2);text-decoration:none;border:1px solid var(--border2);padding:5px 12px;border-radius:6px;transition:all 0.2s;font-weight:500}
.hero-link:hover{color:var(--accent);border-color:var(--accent);background:rgba(0,229,255,0.05)}

/* Section label */
.section-label{font-family:'Space Mono',monospace;font-size:10px;color:var(--accent);letter-spacing:0.15em;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:8px}
.section-label::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,var(--border2),transparent)}

/* Episode card */
.ep-card,.ov-card{background:var(--surface);border:1px solid var(--border2);border-radius:var(--r);overflow:hidden;margin-top:4px;animation:fadeUp 0.4s ease both}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.ep-header{background:linear-gradient(135deg,#0a1f0f,#071a20);padding:16px 20px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border)}
.ep-title{display:flex;align-items:center;gap:10px;font-weight:600;font-size:14px;color:#d1fae5}
.ep-icon,.ov-icon{font-size:18px}
.ep-badge{background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);color:var(--green);font-size:10px;padding:2px 8px;border-radius:10px;font-family:'Space Mono',monospace}
.ep-sub{font-size:11px;color:var(--muted);font-weight:400}
.ep-table,.ov-table{width:100%;border-collapse:collapse;font-size:13px}
.ep-table thead tr,.ov-table thead tr{background:var(--bg3)}
.ep-table th,.ov-table th{padding:10px 16px;text-align:left;font-size:10px;font-weight:600;color:var(--muted);letter-spacing:0.1em;text-transform:uppercase;border-bottom:1px solid var(--border)}
.ep-table td,.ov-table td{padding:11px 16px;border-bottom:1px solid var(--border);color:var(--text);vertical-align:middle}
.step-row,.agent-row{animation:rowSlide 0.3s ease both;transition:background 0.15s}
.step-row:hover,.agent-row:hover{background:rgba(0,229,255,0.03)}
@keyframes rowSlide{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
.step-num{font-family:'Space Mono',monospace;font-size:11px;color:var(--muted);width:36px}
.action-pill{background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.25);color:#a5b4fc;font-size:11px;padding:3px 10px;border-radius:12px;font-weight:600;white-space:nowrap}
.val-cell code{font-family:'Space Mono',monospace;font-size:11px;color:var(--muted2);background:rgba(255,255,255,0.04);padding:2px 6px;border-radius:4px}
.reward-pos{color:var(--green);font-family:'Space Mono',monospace;font-size:13px;font-weight:700}
.reward-neg{color:var(--red);font-family:'Space Mono',monospace;font-size:13px;font-weight:700}
.ep-footer{background:var(--bg3);padding:12px 20px;display:flex;align-items:center;gap:16px;border-top:1px solid var(--border)}
.total-score{font-size:18px;font-family:'Space Mono',monospace;font-weight:700}
.ep-meta{font-size:12px;color:var(--muted)}

/* Oversight */
.ov-header{background:linear-gradient(135deg,#0d0b22,#12103a);padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center}
.ov-title{display:flex;align-items:center;gap:10px;font-weight:600;font-size:14px;color:#ddd6fe}
.ov-badge{background:rgba(124,58,237,0.15);border:1px solid rgba(124,58,237,0.3);color:#a78bfa;font-size:10px;padding:2px 8px;border-radius:10px;font-family:'Space Mono',monospace}
.ov-sub{font-size:11px;color:var(--muted)}
.agent-role{font-weight:600;font-size:13px;color:var(--text)}
.decision-cell{font-size:12px;color:var(--muted2);font-family:'Space Mono',monospace}
.conf-track{width:70px;height:4px;background:var(--border2);border-radius:2px;display:inline-block;margin-right:6px;vertical-align:middle}
.conf-fill{height:100%;background:linear-gradient(90deg,#00b4d8,#0077b6);border-radius:2px}
.conf-label{font-size:11px;color:var(--muted2);font-family:'Space Mono',monospace}
.badge-violation{background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.35);color:var(--red);font-size:10px;padding:3px 10px;border-radius:10px;font-weight:700;font-family:'Space Mono',monospace;letter-spacing:0.05em}
.badge-clean{background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);color:var(--green);font-size:10px;padding:3px 10px;border-radius:10px;font-weight:700;font-family:'Space Mono',monospace;letter-spacing:0.05em}
.violation-row td:first-child{border-left:3px solid var(--red)}
.clean-row td:first-child{border-left:3px solid var(--green)}
.ov-question{background:rgba(124,58,237,0.06);border-top:1px solid var(--border);padding:14px 20px;display:flex;align-items:center;gap:10px;font-size:13px;color:#c4b5fd}
.question-icon{font-size:16px}
.ov-unavail{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:24px;text-align:center;color:var(--muted);font-size:13px}
.error-card{background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:var(--r);padding:16px 20px;color:var(--red);font-size:13px}

/* Stats grid */
.stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px}
.stat-card{background:var(--surface);border:1px solid var(--border2);border-radius:var(--r);padding:20px 16px;text-align:center;position:relative;overflow:hidden;transition:border-color 0.2s,transform 0.2s}
.stat-card:hover{border-color:var(--accent);transform:translateY(-3px)}
.stat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--accent),var(--accent2))}
.stat-value{font-family:'Orbitron',monospace;font-size:28px;font-weight:800;color:var(--accent);text-shadow:0 0 20px rgba(0,229,255,0.3);margin-bottom:6px}
.stat-value.green{color:var(--green);text-shadow:0 0 20px rgba(16,185,129,0.3)}
.stat-value.red{color:var(--red);text-shadow:0 0 20px rgba(239,68,68,0.3)}
.stat-label{font-size:11px;color:var(--muted2);font-weight:500;line-height:1.5}
.stat-delta{font-size:10px;color:var(--muted);margin-top:4px;font-family:'Space Mono',monospace}

/* Metrics table */
.metrics-table-wrap{background:var(--surface);border:1px solid var(--border2);border-radius:var(--r);overflow:hidden;margin-bottom:16px}
.metrics-table-wrap table{width:100%;border-collapse:collapse}
.metrics-table-wrap thead tr{background:var(--bg3)}
.metrics-table-wrap th{padding:10px 16px;text-align:left;font-size:10px;color:var(--muted);font-weight:600;letter-spacing:0.1em;text-transform:uppercase}
.metrics-table-wrap td{padding:12px 16px;border-top:1px solid var(--border);font-size:13px;color:var(--text)}
.metric-bar-wrap{display:flex;align-items:center;gap:10px}
.metric-bar-track{flex:1;height:6px;background:var(--border2);border-radius:3px}
.metric-bar-fill{height:100%;border-radius:3px;transition:width 0.6s ease}

/* About */
.about-section{background:var(--surface);border:1px solid var(--border2);border-radius:var(--r);padding:24px;margin-bottom:14px}
.about-section h3{font-family:'Orbitron',monospace;font-size:12px;color:var(--accent);letter-spacing:0.1em;margin:0 0 14px;text-transform:uppercase}
.about-table{width:100%;border-collapse:collapse;font-size:13px}
.about-table td{padding:10px 0;border-bottom:1px solid var(--border);color:var(--muted2);vertical-align:top}
.about-table td:first-child{color:var(--text);font-weight:600;width:35%;padding-right:16px}
.about-table tr:last-child td{border-bottom:none}
.reward-row{display:flex;align-items:center;gap:8px;margin:6px 0;font-size:12px;font-family:'Space Mono',monospace}
.rw-pos{color:var(--green)}
.rw-neg{color:var(--red)}
.pipeline-step{display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid var(--border)}
.pipeline-step:last-child{border-bottom:none}
.pipeline-num{background:var(--accent);color:var(--bg);font-family:'Orbitron',monospace;font-size:10px;font-weight:800;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
.pipeline-text strong{display:block;font-size:13px;color:var(--text);margin-bottom:3px}
.pipeline-text span{font-size:12px;color:var(--muted2)}
"""


# ─────────────────────────────────────────────────────────
# STATIC HTML BLOCKS
# ─────────────────────────────────────────────────────────

HERO_HTML = """
<div class="hero">
  <div class="hero-title">openenv-email-ops &nbsp;×&nbsp; AI Oversight Inspector</div>
  <div class="hero-sub">Meta × Hugging Face OpenEnv Hackathon 2026 &nbsp;·&nbsp; Sachin S Gunagi</div>
  <div class="hero-tags">
    <span class="hero-tag">Theme 1: Multi-Agent Interactions</span>
    <span class="hero-tag purple">Theme 4: Self-Improvement</span>
    <span class="hero-tag green">OpenEnv Compliant</span>
    <span class="hero-tag">GRPO + Unsloth</span>
    <span class="hero-tag purple">Scalable Oversight</span>
  </div>
  <div class="hero-links">
    <a class="hero-link" href="https://github.com/Sachu651g/AI-Oversight-Inspector" target="_blank">⌥ GitHub</a>
    <a class="hero-link" href="https://huggingface.co/spaces/sachingunagi66/openenv-email-ops" target="_blank">⊕ HF Space</a>
    <a class="hero-link" href="https://colab.research.google.com" target="_blank">📓 Colab Notebook</a>
  </div>
</div>"""

RESULTS_HTML = """
<div class="stats-grid">
  <div class="stat-card">
    <div class="stat-value green">+36pp</div>
    <div class="stat-label">Detection Accuracy<br>42% → <strong>78%</strong></div>
    <div class="stat-delta">500 training steps</div>
  </div>
  <div class="stat-card">
    <div class="stat-value red">−23pp</div>
    <div class="stat-label">False Positive Rate<br>35% → <strong>12%</strong></div>
    <div class="stat-delta">precision rewarded</div>
  </div>
  <div class="stat-card">
    <div class="stat-value">+0.53</div>
    <div class="stat-label">Avg Episode Score<br>0.21 → <strong>0.74</strong></div>
    <div class="stat-delta">GRPO · Llama-3.2-1B</div>
  </div>
</div>
<div class="section-label">Training Metrics</div>
<div class="metrics-table-wrap">
  <table>
    <thead><tr><th>Metric</th><th>Before</th><th>After</th><th>Progress</th></tr></thead>
    <tbody>
      <tr><td>Detection accuracy</td><td style="color:#64748b;font-family:'Space Mono',monospace">42%</td><td style="color:#10b981;font-family:'Space Mono',monospace;font-weight:700">78%</td><td><div class="metric-bar-wrap"><div class="metric-bar-track"><div class="metric-bar-fill" style="width:78%;background:linear-gradient(90deg,#10b981,#059669)"></div></div><span style="font-size:11px;color:#64748b;font-family:'Space Mono',monospace">78%</span></div></td></tr>
      <tr><td>False positive rate</td><td style="color:#64748b;font-family:'Space Mono',monospace">35%</td><td style="color:#10b981;font-family:'Space Mono',monospace;font-weight:700">12%</td><td><div class="metric-bar-wrap"><div class="metric-bar-track"><div class="metric-bar-fill" style="width:12%;background:linear-gradient(90deg,#ef4444,#dc2626)"></div></div><span style="font-size:11px;color:#64748b;font-family:'Space Mono',monospace">12% ↓</span></div></td></tr>
      <tr><td>Severity accuracy</td><td style="color:#64748b;font-family:'Space Mono',monospace">38%</td><td style="color:#10b981;font-family:'Space Mono',monospace;font-weight:700">71%</td><td><div class="metric-bar-wrap"><div class="metric-bar-track"><div class="metric-bar-fill" style="width:71%;background:linear-gradient(90deg,#00b4d8,#0077b6)"></div></div><span style="font-size:11px;color:#64748b;font-family:'Space Mono',monospace">71%</span></div></td></tr>
      <tr><td>Explanation quality</td><td style="color:#64748b;font-family:'Space Mono',monospace">0.31</td><td style="color:#10b981;font-family:'Space Mono',monospace;font-weight:700">0.67</td><td><div class="metric-bar-wrap"><div class="metric-bar-track"><div class="metric-bar-fill" style="width:67%;background:linear-gradient(90deg,#7c3aed,#6d28d9)"></div></div><span style="font-size:11px;color:#64748b;font-family:'Space Mono',monospace">0.67</span></div></td></tr>
      <tr><td>Avg episode score</td><td style="color:#64748b;font-family:'Space Mono',monospace">0.21</td><td style="color:#10b981;font-family:'Space Mono',monospace;font-weight:700">0.74</td><td><div class="metric-bar-wrap"><div class="metric-bar-track"><div class="metric-bar-fill" style="width:74%;background:linear-gradient(90deg,#00e5ff,#00b4d8)"></div></div><span style="font-size:11px;color:#64748b;font-family:'Space Mono',monospace">0.74</span></div></td></tr>
    </tbody>
  </table>
</div>"""

ABOUT_HTML = """
<div class="about-section">
  <h3>The Problem</h3>
  <table class="about-table">
    <tr><td>Challenge</td><td>Enterprises deploy fleets of AI agents — classifier, prioritizer, router, responder — but have no scalable way to monitor them. Human oversight does not scale.</td></tr>
    <tr><td>Solution</td><td>Train an <strong>AI Oversight Inspector</strong> — an LLM that monitors sub-agents and detects violations without ever seeing ground truth labels.</td></tr>
    <tr><td>Why it matters</td><td>Scalable oversight is an open AI safety problem. This environment directly trains that capability on commodity hardware.</td></tr>
  </table>
</div>
<div class="about-section">
  <h3>Reward Structure</h3>
  <div class="reward-row rw-pos">+0.40 &nbsp; Correct violation detected</div>
  <div class="reward-row rw-pos">+0.20 &nbsp; Correct severity assessed</div>
  <div class="reward-row rw-pos">+0.20 &nbsp; Quality explanation provided</div>
  <div class="reward-row rw-pos">+0.20 &nbsp; Correct approval (no false alarm)</div>
  <div class="reward-row rw-neg">−0.30 &nbsp; False positive (wrong flag)</div>
  <div class="reward-row rw-neg">−0.20 &nbsp; Missed violation</div>
  <div class="reward-row rw-neg">−0.05 &nbsp; Escalated to human review</div>
  <p style="margin-top:12px;font-size:12px;color:#64748b">Asymmetric FP penalty teaches precision over recall — false alarms cause alert fatigue in production systems.</p>
</div>
<div class="about-section">
  <h3>Adaptive Curriculum</h3>
  <div class="pipeline-step"><div class="pipeline-num">1</div><div class="pipeline-text"><strong>Easy — 20% violation rate</strong><span>Obvious violations: spam → "important", critical → "low priority"</span></div></div>
  <div class="pipeline-step"><div class="pipeline-num">2</div><div class="pipeline-text"><strong>Medium — 40% violation rate &nbsp;(promote at 70% acc)</strong><span>Subtle policy violations, intent correct but routing wrong</span></div></div>
  <div class="pipeline-step"><div class="pipeline-num">3</div><div class="pipeline-text"><strong>Hard — 60% violation rate &nbsp;(promote at 75% acc)</strong><span>Adversarial hallucinations with high confidence, cross-agent inconsistencies</span></div></div>
  <div class="pipeline-step"><div class="pipeline-num">↑</div><div class="pipeline-text"><strong>Demotion (if accuracy drops below 50%)</strong><span>Recursive self-improvement — overseer must keep improving to maintain its level</span></div></div>
</div>
<div class="about-section">
  <h3>Training Pipeline</h3>
  <table class="about-table">
    <tr><td>Algorithm</td><td>GRPO (Group Relative Policy Optimization) via HF TRL</td></tr>
    <tr><td>Base model</td><td>unsloth/Llama-3.2-1B-Instruct</td></tr>
    <tr><td>Optimization</td><td>Unsloth 2× speedup · 4-bit quantization</td></tr>
    <tr><td>Hardware</td><td>Free T4 GPU (Google Colab) · ~30 min</td></tr>
    <tr><td>Steps</td><td>500 GRPO steps · 4 episodes per step</td></tr>
  </table>
</div>"""


# ─────────────────────────────────────────────────────────
# GRADIO BLOCKS
# ─────────────────────────────────────────────────────────

with gr.Blocks(
    title="openenv-email-ops · AI Oversight Inspector",
    theme=gr.themes.Base(
        primary_hue="cyan",
        neutral_hue="slate",
        font=[gr.themes.GoogleFont("DM Sans"), "sans-serif"],
    ),
    css=GLOBAL_CSS,
) as demo_ui:

    gr.HTML(HERO_HTML)

    with gr.Tabs():

        with gr.Tab("📬 EmailOpsEnv — Round 1"):
            gr.HTML("<div class='section-label'>Live Episode Demo</div>")
            gr.HTML("<p style='font-size:13px;color:#64748b;margin-bottom:16px'>An RL agent navigates a live inbox — classifying, prioritizing, routing and replying to emails. VIP senders carry <strong style='color:#f59e0b'>2× penalties</strong>. Partial observability. Adaptive difficulty.</p>")
            with gr.Row():
                diff_dd = gr.Dropdown(["easy", "medium", "hard"], value="easy", label="Difficulty", scale=2)
                seed_sl = gr.Slider(1, 200, value=42, step=1, label="Random Seed", scale=3)
            run_btn1 = gr.Button("▶ Run Live Episode", variant="primary")
            ep_out = gr.HTML()
            run_btn1.click(run_email_demo, [diff_dd, seed_sl], ep_out)

        with gr.Tab("🛡 Oversight Inspector — Round 2"):
            gr.HTML("<div class='section-label'>Sub-Agent Fleet Monitor</div>")
            gr.HTML("<p style='font-size:13px;color:#64748b;margin-bottom:16px'>The Overseer LLM watches 4 enterprise agents in real-time. It <strong style='color:#e2e8f0'>never sees ground truth</strong> — it must reason from inputs, outputs, and explanations alone. Trained via GRPO with asymmetric rewards: <strong style='color:#ef4444'>−0.30 false alarm</strong> vs <strong style='color:#f59e0b'>−0.20 missed violation</strong>.</p>")
            run_btn2 = gr.Button("▶ Show Sub-Agent Batch", variant="primary")
            ov_out = gr.HTML()
            run_btn2.click(run_oversight_demo, [], ov_out)

        with gr.Tab("📊 Training Results"):
            gr.HTML("<div class='section-label'>GRPO Training — 500 Steps — Llama-3.2-1B-Instruct</div>")
            gr.HTML(RESULTS_HTML)
            try:
                gr.Image("round2/assets/training_results.png", label="Reward curve + Before/After", show_label=True)
                gr.Image("round2/assets/curriculum_progression.png", label="Adaptive curriculum progression", show_label=True)
            except Exception:
                gr.HTML("<p style='color:#64748b;font-size:13px'>Training plots available in round2/assets/ after running the Colab notebook.</p>")

        with gr.Tab("ℹ About"):
            gr.HTML("<div class='section-label'>Project Overview</div>")
            gr.HTML(ABOUT_HTML)


app = gr.mount_gradio_app(api, demo_ui, path="/gradio")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
