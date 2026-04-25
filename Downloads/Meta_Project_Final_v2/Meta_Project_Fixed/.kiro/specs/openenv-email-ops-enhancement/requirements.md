# Requirements Document

## Introduction

This document specifies enhancements to the existing `openenv-email-ops` OpenEnv reinforcement learning environment. The goal is to improve reward signal quality, increase hard-task complexity for LLM agents, introduce context memory for cross-email consistency, strengthen grader evaluation, and maintain performance constraints — all without breaking existing functionality or OpenEnv interface compliance.

The existing environment already implements: OpenEnv `step()`/`reset()`/`state()` interface, three difficulty tasks (easy/medium/hard), four graders (classification, prioritization, routing, reply), a memory tracker, and a reward engine with bonuses and penalties. These enhancements extend and refine those components only.

## Glossary

- **Environment**: The existing OpenEnv-compliant simulation engine (EmailOpsEnv) — unchanged interface
- **Reward_Engine**: The component (RewardEngine) that aggregates grader outputs and applies bonuses/penalties
- **Grader**: A deterministic scoring component returning a float in [0.0, 1.0]
- **Hard_Task**: The task with difficulty="hard" requiring classify, prioritize, route, and generate_reply
- **Context_Memory**: Cross-email tracking of classification decisions within an episode to enforce consistency
- **Memory_Tracker**: The existing MemoryTracker component, extended to support context memory
- **Consistency_Penalty**: A reward deduction applied when an agent classifies emails from the same sender_type inconsistently
- **Consistency_Bonus**: A reward addition applied when an agent classifies all emails of a given sender_type correctly and consistently
- **Ambiguous_Email**: An email with conflicting signals (e.g., urgent tone but low-priority content, or multi-intent subject)
- **Reasoning_Consistency**: The property that an agent's classification, priority, and routing decisions for a single email are logically coherent with each other
- **Partial_Score**: A grader output strictly between 0.0 and 1.0, representing degrees of correctness
- **Repetition_Penalty**: A reward deduction applied when the same action type is applied to the same email more than once
- **Step_Reward**: The immediate reward signal returned after a single `step()` call
- **Episode_Reward**: The cumulative reward accumulated across all steps in an episode
- **InboxGenerator**: The existing component that generates seeded email streams
- **Hard_Email_Pool**: The set of email templates used exclusively for the hard task, containing ambiguous and multi-intent emails

---

## Requirements

### Requirement 15: Granular Reward Signals

**User Story:** As an AI researcher, I want the reward function to emit continuous, granular signals rather than binary 0/1 values, so that the agent receives meaningful gradient-like feedback that distinguishes near-correct from completely wrong decisions.

#### Acceptance Criteria

1. WHEN an Agent correctly classifies an Email, THE Reward_Engine SHALL add +0.4 to the step Reward for the classification component
2. WHEN an Agent incorrectly classifies an Email, THE Reward_Engine SHALL subtract 0.2 from the step Reward for the classification component
3. WHEN an Agent correctly prioritizes an Email, THE Reward_Engine SHALL add +0.2 to the step Reward for the prioritization component
4. WHEN an Agent correctly routes an Email, THE Reward_Engine SHALL add +0.2 to the step Reward for the routing component
5. WHEN an Agent generates a reply, THE Reward_Engine SHALL add a score in [0.0, 0.2] to the step Reward proportional to the ReplyGrader's continuous output
6. THE Reward_Engine SHALL NOT produce a step Reward that is strictly binary (only 0.0 or 1.0) for any single action type; partial scores SHALL be possible
7. WHEN an Agent applies the same action_type to the same Email more than once in an episode, THE Reward_Engine SHALL apply a Repetition_Penalty of -0.1 for each duplicate action beyond the first
8. WHEN an Agent submits an action with a value that is not in the valid set for that action_type (e.g., classify_email with value "unknown"), THE Reward_Engine SHALL apply an invalid-action penalty of -0.1 to the step Reward
9. THE Reward_Engine SHALL ensure the cumulative Episode_Reward remains in the range [-1.0, 1.0] after all bonuses and penalties are applied

---

### Requirement 16: Enhanced Hard Task Complexity

**User Story:** As an AI researcher, I want the hard task to present ambiguous, multi-intent emails with conflicting signals, so that LLM agents must perform genuine multi-step reasoning rather than pattern-matching on obvious cues.

#### Acceptance Criteria

1. THE InboxGenerator SHALL maintain a dedicated Hard_Email_Pool containing at least 5 email templates with ambiguous or multi-intent characteristics
2. WHEN generating emails for the hard task, THE InboxGenerator SHALL select at least 40% of emails from the Hard_Email_Pool
3. THE Hard_Email_Pool SHALL include emails where the tone is urgent (urgency_score >= 0.7) but the correct_priority is "medium" or "low", creating a conflicting signal
4. THE Hard_Email_Pool SHALL include emails with multi-intent subjects (e.g., a single email requesting both a refund and a product question), where the correct classification requires choosing the dominant intent
5. WHEN the hard task Grader evaluates a complete 4-step sequence (classify → prioritize → route → reply) on a single email, THE Reward_Engine SHALL apply a reasoning_consistency_bonus of +0.15 if all four decisions are logically coherent with each other
6. WHEN the hard task Grader evaluates a complete 4-step sequence and the classification contradicts the routing decision (e.g., classified as "spam" but routed to "escalation"), THE Reward_Engine SHALL apply a reasoning_consistency_penalty of -0.15
7. THE hard task SHALL NOT change the easy or medium task email pools or reward logic
8. WHEN the hard task Grader evaluates a generate_reply action, THE ReplyGrader SHALL additionally check that the reply references the dominant intent identified in the email subject, contributing an additional 0.25 weight to the reply score

---

### Requirement 17: Context Memory for Cross-Email Consistency

**User Story:** As an AI researcher, I want the agent's past classification decisions to influence reward shaping for subsequent emails, so that the agent learns to maintain consistent triage policies across an entire inbox session.

#### Acceptance Criteria

1. THE Memory_Tracker SHALL record the classification decision (action_type="classify_email", value) for each Email processed in an episode, keyed by sender_type
2. WHEN an Agent classifies an Email from a sender_type that has been classified before in the same episode, THE Reward_Engine SHALL compare the new classification to the prior classification for that sender_type
3. WHEN an Agent classifies two emails from the same sender_type with different labels (e.g., one "spam" and one "important" for two spammer emails), THE Reward_Engine SHALL apply a Consistency_Penalty of -0.1 to the step Reward
4. WHEN an Agent correctly and consistently classifies all emails of a given sender_type in an episode (all matching the Ground_Truth), THE Reward_Engine SHALL apply a Consistency_Bonus of +0.2 to the Episode_Reward at episode end
5. THE Memory_Tracker SHALL expose a method `get_classification_history(sender_type: str) -> list[str]` that returns all classification values applied to emails of that sender_type in the current episode
6. THE context memory implementation SHALL NOT require any external storage, databases, or network calls; all state SHALL be held in-process within the MemoryTracker instance
7. WHEN `reset()` is called on the Environment, THE Memory_Tracker SHALL clear all context memory state, including classification history by sender_type

---

### Requirement 18: Strengthened Grader Evaluation

**User Story:** As an AI researcher, I want graders to return continuous scores and validate logical consistency and completeness, so that scoring is more informative and harder to game with trivially correct but incomplete responses.

#### Acceptance Criteria

1. THE ClassificationGrader SHALL return 1.0 for an exact match, 0.5 for a semantically adjacent label (e.g., "promotion" when correct is "important"), and 0.0 for a completely wrong label (e.g., "spam" when correct is "important" or "promotion")
2. THE PrioritizationGrader SHALL return 1.0 for an exact match, 0.5 for an adjacent priority level (e.g., "medium" when correct is "high" or "low"), and 0.0 for a two-level mismatch (e.g., "low" when correct is "high")
3. THE RoutingGrader SHALL return 1.0 for an exact match and 0.0 for any mismatch (routing has no partial credit as routes are categorically distinct)
4. THE ReplyGrader SHALL evaluate replies on five criteria, each worth 0.2: (1) minimum length >= 30 characters, (2) presence of a greeting, (3) relevance to email subject keywords, (4) absence of placeholder text, (5) reply length >= 80 characters indicating substantive content
5. WHEN given the same inputs, EACH Grader SHALL return the same score deterministically across all runs
6. THE ClassificationGrader SHALL define the semantic adjacency mapping: "promotion" is adjacent to "important"; "spam" is not adjacent to either "important" or "promotion"
7. THE PrioritizationGrader SHALL define adjacency as: "high"↔"medium" and "medium"↔"low" are adjacent; "high"↔"low" is a two-level mismatch

---

### Requirement 19: Performance and Compatibility Constraints

**User Story:** As a platform engineer, I want the enhanced environment to remain lightweight and fully compatible with the existing OpenEnv interface and deployment setup, so that no existing integrations break and the system runs within resource limits.

#### Acceptance Criteria

1. THE Environment SHALL complete a full inference run across all three tasks (easy, medium, hard) in under 20 minutes when using an OpenAI-compatible API
2. THE Environment SHALL NOT introduce any new Python package dependencies beyond those already listed in requirements.txt
3. THE Environment SHALL maintain full backward compatibility with the existing openenv.yaml schema; no existing fields SHALL be removed or renamed
4. THE Environment SHALL maintain full backward compatibility with the existing `step()`, `reset()`, and `state()` method signatures and return types
5. WHEN the enhanced Environment is run with the existing inference.py script without modification, THE inference.py script SHALL execute without errors
6. THE Memory_Tracker's context memory additions SHALL use O(n) memory where n is the number of emails in the inbox, with no unbounded growth
7. THE enhanced reward computation per step SHALL complete in under 10 milliseconds on standard hardware, ensuring no latency regression
