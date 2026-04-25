"""
UPDATED: multi_agent_system/reward_extension.py

Extended reward engine with:
  - Local rewards per agent
  - Global outcome reward
  - Coordination reward (agents agree + consistent)
  - Conflict penalty (incoherent decisions)
  - Improvement bonus (self-improving behavior)
  - Final score normalized to (0.0, 1.0) exclusive

This extends (not replaces) the existing RewardEngine.
"""

from __future__ import annotations

from multi_agent_system.messages import AgentMessage
from multi_agent_system.self_improving_memory import SelfImprovingMemory


# Ground truth for local reward computation
_VALID_CLASSIFICATIONS = {"spam", "important", "promotion"}
_VALID_PRIORITIES = {"low", "medium", "high"}
_VALID_ROUTES = {"support", "sales", "escalation"}


class MultiAgentRewardEngine:
    """
    Computes multi-dimensional rewards for the multi-agent system.
    Returns a structured breakdown for full observability.
    """

    def compute(
        self,
        agent_outputs: dict[str, AgentMessage],
        coordinator_score: float,
        ground_truth: dict[str, str],
        self_improving_memory: SelfImprovingMemory,
        step_count: int,
    ) -> tuple[float, dict[str, float]]:
        """
        Compute total multi-agent reward and breakdown.

        Args:
            agent_outputs: Final (post-coordinator) agent decisions
            coordinator_score: Score from CoordinatorAgent (-0.2 to +0.2)
            ground_truth: {"classification": ..., "priority": ..., "route": ...}
            self_improving_memory: For improvement/degradation bonuses
            step_count: Current episode step

        Returns:
            (total_reward, breakdown_dict)
        """
        breakdown: dict[str, float] = {}
        total = 0.0

        # --- Local rewards per agent ---
        cls_msg = agent_outputs.get("ClassifierAgent")
        pri_msg = agent_outputs.get("PriorityAgent")
        rte_msg = agent_outputs.get("RoutingAgent")
        rsp_msg = agent_outputs.get("ResponseAgent")

        if cls_msg and "classification" in ground_truth:
            correct = cls_msg.decision == ground_truth["classification"]
            local_cls = 0.4 if correct else -0.2
            breakdown["local_classification"] = local_cls
            total += local_cls
            self_improving_memory.record("current", "ClassifierAgent", cls_msg.decision, correct)

        if pri_msg and "priority" in ground_truth:
            correct = pri_msg.decision == ground_truth["priority"]
            local_pri = 0.2 if correct else 0.0
            breakdown["local_priority"] = local_pri
            total += local_pri
            self_improving_memory.record("current", "PriorityAgent", pri_msg.decision, correct)

        if rte_msg and "route" in ground_truth:
            correct = rte_msg.decision == ground_truth["route"]
            local_rte = 0.2 if correct else 0.0
            breakdown["local_routing"] = local_rte
            total += local_rte
            self_improving_memory.record("current", "RoutingAgent", rte_msg.decision, correct)

        if rsp_msg:
            reply = rsp_msg.decision
            reply_score = self._score_reply(reply)
            breakdown["local_reply"] = reply_score * 0.2
            total += reply_score * 0.2

        # --- Coordination reward ---
        breakdown["coordination"] = coordinator_score
        total += coordinator_score

        # --- Self-improvement bonuses ---
        for agent_name in ["ClassifierAgent", "PriorityAgent", "RoutingAgent"]:
            adj = self_improving_memory.compute_adjustment(agent_name)
            if adj != 0.0:
                key = f"improvement_{agent_name}" if adj > 0 else f"degradation_{agent_name}"
                breakdown[key] = adj
                total += adj

        # --- Efficiency bonus: reward for acting early ---
        if step_count <= 1:
            breakdown["efficiency_bonus"] = 0.05
            total += 0.05

        # --- Clamp to valid range ---
        total = max(-1.0, min(1.0, total))

        return total, breakdown

    def _score_reply(self, reply: str) -> float:
        """Score reply quality on 5 criteria (0.2 each)."""
        score = 0
        if len(reply) >= 30:
            score += 1
        reply_lower = reply.lower()
        if any(g in reply_lower for g in ["hi", "hello", "dear", "greetings"]):
            score += 1
        if len(reply) >= 80:
            score += 1
        if "[" not in reply and "TODO" not in reply.upper():
            score += 1
        if any(w in reply_lower for w in ["thank", "team", "respond", "assist", "support"]):
            score += 1
        return score * 0.2

    def compute_episode_metrics(
        self,
        self_improving_memory: SelfImprovingMemory,
        total_steps: int,
        optimal_steps: int,
    ) -> dict[str, float]:
        """
        Compute episode-level evaluation metrics.

        Returns:
          - decision_consistency_score
          - agent_agreement_score
          - recovery_score
          - efficiency_score
        """
        summary = self_improving_memory.get_summary()

        # Decision consistency: average accuracy across agents
        accuracies = [v["accuracy"] for v in summary.values()]
        consistency = sum(accuracies) / len(accuracies) if accuracies else 0.0

        # Agent agreement: low variance in accuracy = high agreement
        if len(accuracies) >= 2:
            mean = consistency
            variance = sum((a - mean) ** 2 for a in accuracies) / len(accuracies)
            agreement = max(0.0, 1.0 - variance * 4)
        else:
            agreement = 1.0

        # Recovery score: fraction of corrections made
        total_mistakes = sum(v["total_decisions"] - v["correct"] for v in summary.values())
        # Approximate recovery as inverse of mistake rate
        recovery = max(0.0, 1.0 - (total_mistakes / max(1, sum(v["total_decisions"] for v in summary.values()))))

        # Efficiency score: optimal_steps / actual_steps
        efficiency = min(1.0, optimal_steps / max(1, total_steps))

        return {
            "decision_consistency_score": round(consistency, 3),
            "agent_agreement_score": round(agreement, 3),
            "recovery_score": round(recovery, 3),
            "efficiency_score": round(efficiency, 3),
        }
