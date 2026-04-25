# Implementation Plan: openenv-email-ops-enhancement

## Overview

All changes are in-place modifications to existing modules. No new files are created. Tasks are ordered by dependency: data models first, then graders, then memory tracker, then reward engine, then inbox generator, then env wiring, then tests.

## Tasks

- [x] 1. Add `dominant_intent` field to `Email` model (`models.py`)
  - Add `dominant_intent: str | None = None` as an optional field to the `Email` Pydantic model, after `ground_truth`
  - This is backward compatible — all existing `Email` construction without this field continues to work
  - _Requirements: 16.4_

- [x] 2. Upgrade `ClassificationGrader` and `PrioritizationGrader` to partial scores (`graders.py`)
  - [x] 2.1 Add `_CLASSIFICATION_ADJACENCY` dict and update `ClassificationGrader.score()` to return 1.0 / 0.5 / 0.0
    - `"important"` ↔ `"promotion"` are adjacent (0.5); `"spam"` is adjacent to neither
    - _Requirements: 18.1, 18.6_
  - [ ]* 2.2 Write property test for `ClassificationGrader` adjacency scoring (Property 12)
    - **Property 12: ClassificationGrader adjacency scoring**
    - **Validates: Requirements 18.1, 18.6**
    - Add to `tests/test_graders.py`: parametrize exact/adjacent/no-match pairs and assert 1.0/0.5/0.0
  - [x] 2.3 Add `_PRIORITY_ADJACENCY` dict and update `PrioritizationGrader.score()` to return 1.0 / 0.5 / 0.0
    - `"high"` ↔ `"medium"` and `"medium"` ↔ `"low"` are adjacent; `"high"` ↔ `"low"` is 0.0
    - _Requirements: 18.2, 18.7_
  - [ ]* 2.4 Write property test for `PrioritizationGrader` adjacency scoring (Property 13)
    - **Property 13: PrioritizationGrader adjacency scoring**
    - **Validates: Requirements 18.2, 18.7**
    - Add to `tests/test_graders.py`: parametrize exact/adjacent/two-level pairs and assert 1.0/0.5/0.0

- [x] 3. Upgrade `ReplyGrader` to 5-criterion scoring (`graders.py`)
  - [x] 3.1 Update `ReplyGrader.score()` from 4 criteria (0.25 each) to 5 criteria (0.2 each)
    - New criterion 5: reply length >= 80 characters (substantive content)
    - Existing criterion 1 threshold changes from >= 20 to >= 30 characters
    - Update docstring and all criterion weights to 0.2
    - _Requirements: 18.4_
  - [x] 3.2 Add `ReplyGrader.score_hard()` method for dominant-intent check
    - `score_hard(reply: str, email: Email) -> float`: calls `self.score()` then adds +0.25 if `email.dominant_intent` keyword is present in reply, capped at 1.0
    - If `email.dominant_intent` is `None`, returns base score unchanged
    - _Requirements: 16.8_
  - [ ]* 3.3 Update existing `ReplyGrader` unit tests in `tests/test_graders.py` to match new 5-criterion scoring
    - Fix `test_reply_grader_criteria` and `test_reply_grader_empty_reply` expected values (0.25 → 0.2 per criterion)
    - _Requirements: 18.4_
  - [ ]* 3.4 Write property test for `ReplyGrader` score being a multiple of 0.2 (Property 14)
    - **Property 14: ReplyGrader score is a multiple of 0.2**
    - **Validates: Requirements 18.4**
    - Add to `tests/test_graders.py`: for any reply and email, assert `score % 0.2 < 1e-9`

- [x] 4. Extend `MemoryTracker` with classification history (`memory_tracker.py`)
  - [x] 4.1 Add `_classification_history: dict[str, list[str]]` internal state and initialize in `__init__`
    - _Requirements: 17.1, 17.6_
  - [x] 4.2 Update `record_action()` signature to accept optional `sender_type: str | None = None`
    - When `action.action_type == "classify_email"` and `sender_type` is not None, append `action.value` to `_classification_history[sender_type]`
    - _Requirements: 17.1_
  - [x] 4.3 Add `get_classification_history(sender_type: str) -> list[str]` public method
    - Returns a copy of the list for the given sender_type, or `[]` if not present
    - _Requirements: 17.5_
  - [x] 4.4 Add `get_all_classification_histories() -> dict[str, list[str]]` public method
    - Returns a shallow copy of the full `_classification_history` dict
    - _Requirements: 17.4_
  - [x] 4.5 Update `reset()` to clear `_classification_history`
    - _Requirements: 17.7_
  - [ ]* 4.6 Write property test for classification history round-trip (Property 8)
    - **Property 8: Classification history round-trip**
    - **Validates: Requirements 17.1, 17.5**
    - Add to `tests/test_reward_engine.py` or a new section: generate random sender_types and classification sequences, assert `get_classification_history()` returns them in order
  - [ ]* 4.7 Write unit test for `reset()` clearing classification history (Property 10)
    - **Property 10: Memory cleared on reset**
    - **Validates: Requirements 17.7**
    - Add to `tests/test_reward_engine.py`: record classifications, call `tracker.reset()`, assert history is empty

- [x] 5. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Update `RewardEngine.score_step()` with new reward values and penalties (`reward_engine.py`)
  - [x] 6.1 Update classification reward: correct → +0.4 (was +0.2), incorrect → -0.2 (unchanged)
    - Change `score = 0.2 if raw == 1.0 else -0.2` to `score = 0.4 if raw == 1.0 else (-0.2 if raw == 0.0 else raw * 0.4)`
    - Note: with the new adjacency grader, `raw` can be 0.5 → reward = 0.5 * 0.4 = 0.2 for adjacent match
    - _Requirements: 15.1, 15.2_
  - [x] 6.2 Add `_VALID_VALUES` dict and invalid-action penalty check at the top of `score_step()`
    - Before any grader call, if `action.action_type` is in `_VALID_VALUES` and `action.value` is not valid, add `breakdown["invalid_action"] = -0.1` and return early
    - _Requirements: 15.8_
  - [x] 6.3 Add repetition penalty check in `score_step()`
    - After the invalid-action check, query `memory_tracker.get_actions_for_email(email.id)` and check if the same `action_type` was already applied; if so, add `breakdown["repetition_penalty"] = -0.1`
    - _Requirements: 15.7_
  - [x] 6.4 Add consistency penalty check in `score_step()` for `classify_email` actions
    - After scoring, call `memory_tracker.get_classification_history(email.sender_type)`; if `len(history) >= 2` and the last two entries differ, add `breakdown["consistency_penalty"] = -0.1`
    - _Requirements: 17.3_
  - [x] 6.5 Add `_check_reasoning_consistency()` private method and call it in `score_step()` for hard task
    - Returns +0.15 for coherent (classify, route) pairs, -0.15 for contradictory (e.g., spam + escalation), 0.0 otherwise
    - Call only when `task_config.difficulty == "hard"` and the email has had all 4 action types applied
    - _Requirements: 16.5, 16.6_
  - [ ]* 6.6 Write unit tests for new penalties and bonuses in `tests/test_reward_engine.py`
    - Test: correct classification now returns +0.4 in breakdown
    - Test: invalid action value returns `breakdown["invalid_action"] == -0.1`
    - Test: duplicate action returns `breakdown["repetition_penalty"] == -0.1`
    - Test: inconsistent classification for same sender_type returns `breakdown["consistency_penalty"] == -0.1`
    - _Requirements: 15.1, 15.7, 15.8, 17.3_
  - [ ]* 6.7 Write property test for repetition penalty (Property 4)
    - **Property 4: Repetition penalty on duplicate actions**
    - **Validates: Requirements 15.7**
    - Add to `tests/test_reward_engine.py`: for any email and action type, apply same action twice, assert second call has `breakdown["repetition_penalty"] == -0.1`
  - [ ]* 6.8 Write property test for invalid action penalty (Property 5)
    - **Property 5: Invalid action penalty**
    - **Validates: Requirements 15.8**
    - Add to `tests/test_reward_engine.py`: generate invalid values for each action type, assert `breakdown["invalid_action"] == -0.1`
  - [ ]* 6.9 Write property test for consistency penalty (Property 9)
    - **Property 9: Consistency penalty on divergent classifications**
    - **Validates: Requirements 17.3**
    - Add to `tests/test_reward_engine.py`: classify two emails of same sender_type with different labels, assert second step has `breakdown["consistency_penalty"] == -0.1`

- [x] 7. Update `RewardEngine.finalize_episode()` with consistency bonus (`reward_engine.py`)
  - [x] 7.1 Add consistency bonus logic: for each sender_type in `memory_tracker.get_all_classification_histories()`, if all classifications are identical and match the ground truth for that sender_type, add `breakdown[f"consistency_bonus_{sender_type}"] = 0.2`
    - Requires iterating `inbox` to find ground truth per sender_type
    - _Requirements: 17.4_
  - [ ]* 7.2 Write unit test for consistency bonus in `tests/test_reward_engine.py`
    - Test: classify all emails of a sender_type correctly and consistently → `finalize_episode` returns +0.2 bonus
    - _Requirements: 17.4_

- [x] 8. Add `HARD_EMAIL_POOL` and `difficulty` param to `InboxGenerator` (`inbox_generator.py`)
  - [x] 8.1 Add `HARD_EMAIL_POOL` module-level list with at least 5 email template dicts
    - Each template must have `urgency >= 0.7` with `priority = "medium"` or `"low"` (conflicting signal)
    - Each template must have a multi-intent subject and a `dominant_intent` field
    - _Requirements: 16.1, 16.3, 16.4_
  - [x] 8.2 Update `InboxGenerator.generate()` signature to `generate(self, size: int, seed: int, difficulty: str = "easy") -> list[Email]`
    - When `difficulty == "hard"`, draw `max(1, math.ceil(size * 0.4))` emails from `HARD_EMAIL_POOL` (with `dominant_intent` set), fill the rest from normal pool
    - Hard-pool emails must be constructed with `dominant_intent` populated
    - _Requirements: 16.2_
  - [ ]* 8.3 Write unit tests for `HARD_EMAIL_POOL` in `tests/test_inbox_generator.py`
    - Test: `len(HARD_EMAIL_POOL) >= 5`
    - Test: all hard pool templates have `urgency >= 0.7` and `priority in {"medium", "low"}`
    - Test: all hard pool templates have a `dominant_intent` field
    - _Requirements: 16.1, 16.3, 16.4_
  - [ ]* 8.4 Write property test for hard-task inbox pool proportion (Property 7)
    - **Property 7: Hard task inbox pool proportion**
    - **Validates: Requirements 16.2**
    - Add to `tests/test_inbox_generator.py`: for random seeds and sizes >= 5, generate with `difficulty="hard"`, assert at least 40% of emails have `dominant_intent` set
  - [ ]* 8.5 Write property test for seeded determinism with `difficulty` param
    - Extend existing `test_seeded_determinism` or add new test: same seed + same difficulty produces identical results
    - _Requirements: 16.2_

- [x] 9. Wire `difficulty` and `sender_type` into `EmailOpsEnv` (`env.py`)
  - [x] 9.1 Pass `difficulty=self._task_config.difficulty` to `self._inbox_generator.generate()` in `reset()`
    - _Requirements: 16.2_
  - [x] 9.2 Pass `sender_type=current_email.sender_type` to `self._memory_tracker.record_action()` in `step()`
    - _Requirements: 17.1_
  - [x] 9.3 Apply episode reward clamping `max(-1.0, min(1.0, self._episode_reward))` after every `self._episode_reward += reward.step_reward` and after `self._episode_reward += adjustment` in `step()`
    - _Requirements: 15.9_
  - [ ]* 9.4 Write property test for episode reward clamping invariant (Property 6)
    - **Property 6: Episode reward clamping invariant**
    - **Validates: Requirements 15.9**
    - Add to `tests/test_reward_engine.py` or `tests/test_env.py`: run full episodes with random action sequences, assert `reward.episode_reward` is always in `[-1.0, 1.0]`

- [x] 10. Update `score_step()` to use `score_hard()` for hard-task reply scoring (`reward_engine.py`)
  - When `task_config.difficulty == "hard"` and `action.action_type == "generate_reply"`, call `_reply_grader.score_hard(action.value or "", email)` instead of `_reply_grader.score()`
  - _Requirements: 16.8_

- [x] 11. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- All changes are additive modifications to existing files — no new files are created
- The `get_actions_for_email()` method referenced in task 6.3 already exists on `MemoryTracker` as `_history.get(email_id, [])` — use `memory_tracker._history.get(email.id, [])` directly or expose a public accessor if preferred
- Checkpoints ensure incremental validation before wiring everything together
- Property tests validate universal correctness properties across random inputs
