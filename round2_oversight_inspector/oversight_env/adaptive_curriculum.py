"""
oversight_env/adaptive_curriculum.py — Self-improving adaptive curriculum.

Escalates difficulty as the overseer improves:
  - Starts at 'easy' (20% violation rate, obvious errors)
  - Promotes to 'medium' when detection accuracy >= 0.7 over last 5 steps
  - Promotes to 'hard' when detection accuracy >= 0.75 over last 5 steps
  - Demotes if accuracy drops below threshold

This drives recursive skill amplification — the overseer must keep improving
to maintain its difficulty level.
"""

from __future__ import annotations

from typing import Literal


class AdaptiveCurriculum:
    """
    Tracks overseer performance and adjusts difficulty dynamically.

    Thresholds:
      easy → medium:  detection_accuracy >= 0.70 over last 5 steps
      medium → hard:  detection_accuracy >= 0.75 over last 5 steps
      hard → medium:  detection_accuracy < 0.50 over last 5 steps (demotion)
      medium → easy:  detection_accuracy < 0.45 over last 5 steps (demotion)
    """

    PROMOTE_EASY_TO_MEDIUM = 0.70
    PROMOTE_MEDIUM_TO_HARD = 0.75
    DEMOTE_HARD_TO_MEDIUM = 0.50
    DEMOTE_MEDIUM_TO_EASY = 0.45
    WINDOW = 5

    def __init__(self, initial_difficulty: Literal["easy", "medium", "hard"] = "easy") -> None:
        self._difficulty: Literal["easy", "medium", "hard"] = initial_difficulty
        self._detection_scores: list[float] = []
        self._promotions: int = 0
        self._demotions: int = 0

    @property
    def difficulty(self) -> Literal["easy", "medium", "hard"]:
        return self._difficulty

    def record_step(self, detection_score: float) -> None:
        """Record a detection score (1.0=correct, 0.0=miss, -0.5=FP) and update difficulty."""
        # Normalize to [0, 1] for accuracy tracking
        normalized = max(0.0, detection_score)
        self._detection_scores.append(normalized)
        self._maybe_adjust_difficulty()

    def _maybe_adjust_difficulty(self) -> None:
        if len(self._detection_scores) < self.WINDOW:
            return

        recent = self._detection_scores[-self.WINDOW:]
        accuracy = sum(recent) / len(recent)

        if self._difficulty == "easy" and accuracy >= self.PROMOTE_EASY_TO_MEDIUM:
            self._difficulty = "medium"
            self._promotions += 1
        elif self._difficulty == "medium" and accuracy >= self.PROMOTE_MEDIUM_TO_HARD:
            self._difficulty = "hard"
            self._promotions += 1
        elif self._difficulty == "hard" and accuracy < self.DEMOTE_HARD_TO_MEDIUM:
            self._difficulty = "medium"
            self._demotions += 1
        elif self._difficulty == "medium" and accuracy < self.DEMOTE_MEDIUM_TO_EASY:
            self._difficulty = "easy"
            self._demotions += 1

    def get_stats(self) -> dict:
        recent = self._detection_scores[-self.WINDOW:] if self._detection_scores else []
        return {
            "current_difficulty": self._difficulty,
            "promotions": self._promotions,
            "demotions": self._demotions,
            "recent_accuracy": round(sum(recent) / len(recent), 3) if recent else 0.0,
            "total_steps": len(self._detection_scores),
        }

    def reset(self, initial_difficulty: Literal["easy", "medium", "hard"] = "easy") -> None:
        self._difficulty = initial_difficulty
        self._detection_scores.clear()
        self._promotions = 0
        self._demotions = 0
