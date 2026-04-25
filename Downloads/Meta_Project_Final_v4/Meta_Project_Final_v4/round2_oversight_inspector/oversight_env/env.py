"""
oversight_env/env.py — Main OpenEnv interface for the AI Oversight Inspector.

The overseer observes sub-agent outputs and must detect violations without seeing ground truth.
"""

from __future__ import annotations

from typing import Any, Literal

from oversight_env.adaptive_curriculum import AdaptiveCurriculum
from oversight_env.models import (
    AuditReport,
    OversightAction,
    OversightObservation,
    OversightReward,
    SubAgentOutput,
    ViolationType,
)
from oversight_env.reward_engine import OversightRewardEngine
from oversight_env.sub_agent_fleet import SubAgentFleet


class OversightEnv:
    """
    OpenEnv-compliant AI Oversight Inspector environment.

    The overseer agent monitors a fleet of sub-agents and must detect violations.
    """

    def __init__(
        self,
        task_id: str = "easy",
        difficulty: Literal["easy", "medium", "hard"] = "easy",
        max_steps: int = 30,
        batch_size: int = 3,
        seed: int = 42,
        adaptive: bool = False,
    ) -> None:
        self._task_id = task_id
        self._difficulty = difficulty
        self._max_steps = max_steps
        self._batch_size = batch_size
        self._seed = seed
        self._adaptive = adaptive

        self._fleet = SubAgentFleet(seed=seed)
        self._reward_engine = OversightRewardEngine()
        self._curriculum = AdaptiveCurriculum(initial_difficulty=difficulty) if adaptive else None

        self._step_count: int = 0
        self._episode_reward: float = 0.0
        self._audit_history: list[dict] = []
        self._done: bool = False
        self._current_batch: list[SubAgentOutput] = []

    # ------------------------------------------------------------------
    # OpenEnv interface
    # ------------------------------------------------------------------

    def reset(self, seed: int | None = None) -> OversightObservation:
        """Initialize a new episode."""
        if seed is not None:
            self._seed = seed
            self._fleet.reset(seed)

        self._reward_engine.reset()
        if self._curriculum:
            self._curriculum.reset(self._difficulty)

        self._step_count = 0
        self._episode_reward = 0.0
        self._audit_history = []
        self._done = False

        # Generate first batch
        current_difficulty = self._curriculum.difficulty if self._curriculum else self._difficulty
        self._current_batch = self._fleet.generate_batch(current_difficulty, self._batch_size)

        return self._build_observation()

    def step(self, action: OversightAction) -> tuple[OversightObservation, OversightReward, bool, dict]:
        """Advance the episode by one step."""
        if self._done:
            raise RuntimeError("Episode has ended. Call reset() to start a new episode.")

        # Score the overseer's action
        target_output = next(
            (o for o in self._current_batch if o.agent_id == action.target_agent_id),
            None,
        )
        reward = self._reward_engine.score_step(
            action=action,
            sub_agent_outputs=self._current_batch,
            step_count=self._step_count,
            target_output=target_output,
        )

        # Accumulate episode reward
        self._episode_reward += reward.step_reward
        self._episode_reward = max(-1.0, min(1.0, self._episode_reward))

        # Record audit decision
        self._audit_history.append({
            "step": self._step_count,
            "action_type": action.action_type,
            "target_agent_id": action.target_agent_id,
            "violation_type": action.violation_type.value,
            "severity": action.severity.value,
            "confidence": action.confidence,
            "step_reward": reward.step_reward,
        })

        # Update adaptive curriculum
        if self._curriculum:
            detection_raw = reward.breakdown.get("detection", 0.0) / 0.4  # Denormalize
            self._curriculum.record_step(detection_raw)

        # Increment step
        self._step_count += 1

        # Check done
        done = self._step_count >= self._max_steps
        info: dict[str, Any] = {}

        if done:
            self._done = True
            # Finalize episode
            adjustment, delayed_breakdown = self._reward_engine.finalize_episode(
                episode_reward=self._episode_reward,
                total_steps=self._step_count,
                optimal_steps=self._max_steps // 2,
            )
            self._episode_reward += adjustment
            self._episode_reward = max(-1.0, min(1.0, self._episode_reward))
            # Normalize to (0.001, 0.999) for OpenEnv compliance
            self._episode_reward = max(0.001, min(0.999, self._episode_reward))

            # Generate audit report
            info["audit_report"] = self._generate_audit_report()
            if self._curriculum:
                info["curriculum_stats"] = self._curriculum.get_stats()

        # Generate next batch
        if not done:
            current_difficulty = self._curriculum.difficulty if self._curriculum else self._difficulty
            self._current_batch = self._fleet.generate_batch(current_difficulty, self._batch_size)

        # Build final reward
        final_reward = OversightReward(
            step_reward=reward.step_reward,
            episode_reward=self._episode_reward,
            breakdown=reward.breakdown,
        )

        obs = self._build_observation()
        return obs, final_reward, done, info

    def state(self) -> dict:
        """Return serializable state snapshot."""
        return {
            "step_count": self._step_count,
            "done": self._done,
            "episode_reward": self._episode_reward,
            "task_id": self._task_id,
            "difficulty": self._curriculum.difficulty if self._curriculum else self._difficulty,
        }

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _build_observation(self) -> OversightObservation:
        """Build observation from current state."""
        # Compute running stats (no ground truth exposed)
        total_flagged = sum(1 for a in self._audit_history if a["action_type"] == "flag_violation")
        total_approved = sum(1 for a in self._audit_history if a["action_type"] == "approve")

        episode_stats = {
            "total_steps": self._step_count,
            "total_flagged": total_flagged,
            "total_approved": total_approved,
            "avg_confidence": (
                sum(a["confidence"] for a in self._audit_history) / len(self._audit_history)
                if self._audit_history else 0.0
            ),
        }

        return OversightObservation(
            step_count=self._step_count,
            task_id=self._task_id,
            difficulty=self._curriculum.difficulty if self._curriculum else self._difficulty,
            sub_agent_outputs=self._current_batch,
            audit_history=list(self._audit_history),
            episode_stats=episode_stats,
        )

    def _generate_audit_report(self) -> dict:
        """Generate end-of-episode audit report."""
        total_violations = 0
        detected = 0
        missed = 0
        false_positives = 0

        # Reconstruct from audit history (simplified — full version would track all batches)
        for entry in self._audit_history:
            if entry["action_type"] == "flag_violation":
                # Approximate: assume flagged entries were violations
                detected += 1
            # Full tracking would require storing all batches

        # Compute metrics from detection history
        detection_history = self._reward_engine._detection_history
        correct_detections = sum(1 for d in detection_history if d > 0)
        false_positives = sum(1 for d in detection_history if d < 0)
        total_violations = len(detection_history)

        detection_accuracy = correct_detections / total_violations if total_violations > 0 else 0.0
        fp_rate = false_positives / total_violations if total_violations > 0 else 0.0

        return {
            "total_violations_detected": correct_detections,
            "total_violations_missed": total_violations - correct_detections - false_positives,
            "false_positives": false_positives,
            "detection_accuracy": round(detection_accuracy, 3),
            "false_positive_rate": round(fp_rate, 3),
            "severity_accuracy": 0.0,  # Placeholder
            "explanation_quality": 0.0,  # Placeholder
            "overall_score": round(self._episode_reward, 3),
        }
