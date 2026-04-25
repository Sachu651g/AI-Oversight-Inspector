"""
NEW: multi_agent_system/messages.py

Structured message protocol for inter-agent communication.
Each agent receives an AgentContext containing the email, prior agent outputs,
and episode context memory. Agents return AgentMessage with decision + explanation.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class AgentMessage:
    """Output produced by a single agent for one email."""

    agent_name: str
    decision: str                    # The agent's chosen value
    confidence: float                # 0.0–1.0 confidence score
    explanation: str                 # Human-readable reasoning
    alternatives: list[str] = field(default_factory=list)  # Other options considered
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "agent": self.agent_name,
            "decision": self.decision,
            "confidence": round(self.confidence, 3),
            "explanation": self.explanation,
            "alternatives": self.alternatives,
            "metadata": self.metadata,
        }


@dataclass
class AgentContext:
    """Full context passed to each agent before it makes a decision."""

    email_id: str
    subject: str
    body: str
    sender_type: str
    urgency_score: float
    step_count: int
    prior_outputs: dict[str, AgentMessage] = field(default_factory=dict)
    classification_history: list[str] = field(default_factory=list)
    episode_step: int = 0
    dominant_intent: str | None = None

    def summary(self) -> str:
        """Return a compact text summary for LLM prompts."""
        lines = [
            f"Subject: {self.subject}",
            f"Sender: {self.sender_type} | Urgency: {self.urgency_score:.2f}",
            f"Body: {self.body[:200]}",
        ]
        if self.prior_outputs:
            lines.append("Prior agent decisions:")
            for name, msg in self.prior_outputs.items():
                lines.append(f"  {name}: {msg.decision} (conf={msg.confidence:.2f})")
        if self.classification_history:
            lines.append(f"Past classifications for {self.sender_type}: {self.classification_history}")
        return "\n".join(lines)
