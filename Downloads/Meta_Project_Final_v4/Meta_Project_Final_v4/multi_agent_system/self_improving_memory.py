"""
UPDATED: multi_agent_system/self_improving_memory.py

Self-improving memory layer that tracks per-agent mistakes and corrections.
Applies dynamic reward adjustments:
  - Improvement bonus: agent corrects a past mistake
  - Degradation penalty: agent repeats the same mistake
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class AgentRecord:
    """Per-agent decision history for one email."""
    decisions: list[str] = field(default_factory=list)
    was_correct: list[bool] = field(default_factory=list)


class SelfImprovingMemory:
    """
    Tracks per-agent decision history across an episode.
    Detects corrections (improvement) and repeated mistakes (degradation).
    """

    def __init__(self) -> None:
        # Maps (email_id, agent_name) -> AgentRecord
        self._records: dict[tuple[str, str], AgentRecord] = {}
        # Maps agent_name -> list of (decision, correct) across all emails
        self._agent_history: dict[str, list[tuple[str, bool]]] = {}

    def record(
        self,
        email_id: str,
        agent_name: str,
        decision: str,
        correct: bool,
    ) -> None:
        """Record an agent's decision and whether it was correct."""
        key = (email_id, agent_name)
        if key not in self._records:
            self._records[key] = AgentRecord()
        self._records[key].decisions.append(decision)
        self._records[key].was_correct.append(correct)

        if agent_name not in self._agent_history:
            self._agent_history[agent_name] = []
        self._agent_history[agent_name].append((decision, correct))

    def compute_adjustment(self, agent_name: str) -> float:
        """
        Compute dynamic reward adjustment for an agent based on recent history.

        Returns:
          +0.1 if agent corrected a previous mistake (improvement)
          -0.1 if agent repeated the same mistake (degradation)
           0.0 otherwise
        """
        history = self._agent_history.get(agent_name, [])
        if len(history) < 2:
            return 0.0

        prev_decision, prev_correct = history[-2]
        curr_decision, curr_correct = history[-1]

        # Improvement: was wrong before, now correct
        if not prev_correct and curr_correct:
            return 0.1

        # Degradation: wrong before AND wrong again with same decision
        if not prev_correct and not curr_correct and prev_decision == curr_decision:
            return -0.1

        return 0.0

    def get_mistake_rate(self, agent_name: str) -> float:
        """Return fraction of incorrect decisions for this agent."""
        history = self._agent_history.get(agent_name, [])
        if not history:
            return 0.0
        wrong = sum(1 for _, correct in history if not correct)
        return wrong / len(history)

    def get_improvement_trend(self, agent_name: str, window: int = 5) -> float:
        """
        Return improvement trend over last `window` decisions.
        Positive = improving, negative = degrading.
        """
        history = self._agent_history.get(agent_name, [])
        if len(history) < window:
            return 0.0
        recent = history[-window:]
        correct_count = sum(1 for _, c in recent if c)
        return (correct_count / window) - 0.5  # Centered at 0

    def reset(self) -> None:
        """Clear all memory for a new episode."""
        self._records.clear()
        self._agent_history.clear()

    def get_summary(self) -> dict[str, dict]:
        """Return per-agent summary for metrics."""
        summary = {}
        for agent_name, history in self._agent_history.items():
            total = len(history)
            correct = sum(1 for _, c in history if c)
            summary[agent_name] = {
                "total_decisions": total,
                "correct": correct,
                "accuracy": round(correct / total, 3) if total > 0 else 0.0,
                "mistake_rate": round(1 - correct / total, 3) if total > 0 else 0.0,
            }
        return summary
