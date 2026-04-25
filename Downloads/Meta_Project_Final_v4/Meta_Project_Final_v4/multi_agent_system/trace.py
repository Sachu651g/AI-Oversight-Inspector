"""
NEW: multi_agent_system/trace.py

Full decision trace for explainability and observability.
Stores agent-by-agent decisions, coordinator actions, and final rewards.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from multi_agent_system.messages import AgentMessage


@dataclass
class TraceStep:
    """One step in the episode trace."""

    step: int
    email_id: str
    agent_outputs: dict[str, AgentMessage]
    coordinator_score: float
    coordinator_explanation: str
    final_action_type: str
    final_action_value: str
    step_reward: float
    episode_reward: float
    breakdown: dict[str, float]

    def to_dict(self) -> dict:
        return {
            "step": self.step,
            "email_id": self.email_id,
            "agents": {name: msg.to_dict() for name, msg in self.agent_outputs.items()},
            "coordinator_score": round(self.coordinator_score, 3),
            "coordinator_explanation": self.coordinator_explanation,
            "action": f"{self.final_action_type}:{self.final_action_value}",
            "step_reward": round(self.step_reward, 3),
            "episode_reward": round(self.episode_reward, 3),
            "breakdown": {k: round(v, 3) for k, v in self.breakdown.items()},
        }


@dataclass
class DecisionTrace:
    """Full episode trace with all agent decisions and rewards."""

    task_id: str
    steps: list[TraceStep] = field(default_factory=list)
    final_score: float = 0.0
    total_steps: int = 0

    def add_step(self, trace_step: TraceStep) -> None:
        self.steps.append(trace_step)
        self.total_steps += 1

    def finalize(self, final_score: float) -> None:
        self.final_score = final_score

    def to_dict(self) -> dict:
        return {
            "task_id": self.task_id,
            "total_steps": self.total_steps,
            "final_score": round(self.final_score, 3),
            "steps": [s.to_dict() for s in self.steps],
        }

    def summary(self) -> str:
        """Return a compact text summary for README examples."""
        lines = [f"=== Trace: {self.task_id} ==="]
        lines.append(f"Total steps: {self.total_steps} | Final score: {self.final_score:.3f}")
        for s in self.steps[:5]:  # Show first 5 steps
            lines.append(f"  Step {s.step}: {s.final_action_type} → reward {s.step_reward:.2f}")
            for name, msg in s.agent_outputs.items():
                lines.append(f"    {name}: {msg.decision} (conf={msg.confidence:.2f})")
        if len(self.steps) > 5:
            lines.append(f"  ... ({len(self.steps) - 5} more steps)")
        return "\n".join(lines)
