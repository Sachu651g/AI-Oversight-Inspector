"""
NEW: multi_agent_system/orchestrator.py

MultiAgentOrchestrator — the main entry point for the multi-agent system.

Given an email observation, it:
1. Runs all 4 specialist agents in sequence (with error propagation)
2. Passes outputs to CoordinatorAgent for conflict resolution
3. Computes multi-agent rewards
4. Records a full DecisionTrace step
5. Returns the final action to take in the OpenEnv environment

This is a STANDALONE layer — it does NOT modify env.py or any existing code.
"""

from __future__ import annotations

from openenv_email_ops.models import Action, Email, TaskConfig

from multi_agent_system.agents import (
    ClassifierAgent,
    CoordinatorAgent,
    PriorityAgent,
    ResponseAgent,
    RoutingAgent,
)
from multi_agent_system.messages import AgentContext, AgentMessage
from multi_agent_system.reward_extension import MultiAgentRewardEngine
from multi_agent_system.self_improving_memory import SelfImprovingMemory
from multi_agent_system.trace import DecisionTrace, TraceStep


class MultiAgentOrchestrator:
    """
    Orchestrates all agents for a single email step.

    Usage:
        orchestrator = MultiAgentOrchestrator()
        orchestrator.reset()

        # For each step in the episode:
        action, trace_step = orchestrator.process(email, task_config, step_count)
        env.step(action)
    """

    def __init__(self) -> None:
        self._classifier = ClassifierAgent()
        self._priority = PriorityAgent()
        self._routing = RoutingAgent()
        self._response = ResponseAgent()
        self._coordinator = CoordinatorAgent()
        self._reward_engine = MultiAgentRewardEngine()
        self._memory = SelfImprovingMemory()
        self._trace: DecisionTrace | None = None
        self._step_counter = 0
        # Tracks which action type to apply next for each email
        self._email_action_cycle: dict[str, int] = {}

    def reset(self, task_id: str = "easy") -> None:
        """Reset for a new episode."""
        self._memory.reset()
        self._trace = DecisionTrace(task_id=task_id)
        self._step_counter = 0
        self._email_action_cycle.clear()

    def process(
        self,
        email: Email,
        task_config: TaskConfig,
        step_count: int,
        classification_history: list[str] | None = None,
    ) -> tuple[Action, TraceStep]:
        """
        Run all agents on the email and return the next Action + TraceStep.

        The action type cycles through the task's reward_components in order.
        """
        components = task_config.reward_components
        cycle_idx = self._email_action_cycle.get(email.id, 0)
        action_type = self._get_action_type(components, cycle_idx)
        self._email_action_cycle[email.id] = cycle_idx + 1

        # Build context
        ctx = AgentContext(
            email_id=email.id,
            subject=email.subject,
            body=email.body,
            sender_type=email.sender_type,
            urgency_score=email.urgency_score,
            step_count=step_count,
            classification_history=classification_history or [],
            episode_step=self._step_counter,
            dominant_intent=email.dominant_intent,
        )

        # Run agents in sequence (with error propagation via prior_outputs)
        agent_outputs: dict[str, AgentMessage] = {}

        cls_msg = self._classifier.decide(ctx)
        agent_outputs["ClassifierAgent"] = cls_msg
        ctx.prior_outputs["ClassifierAgent"] = cls_msg

        pri_msg = self._priority.decide(ctx)
        agent_outputs["PriorityAgent"] = pri_msg
        ctx.prior_outputs["PriorityAgent"] = pri_msg

        rte_msg = self._routing.decide(ctx)
        agent_outputs["RoutingAgent"] = rte_msg
        ctx.prior_outputs["RoutingAgent"] = rte_msg

        rsp_msg = self._response.decide(ctx)
        agent_outputs["ResponseAgent"] = rsp_msg

        # Coordinator resolves conflicts
        final_outputs, coord_score, coord_explanation = self._coordinator.coordinate(
            ctx, agent_outputs
        )

        # Compute multi-agent rewards
        ground_truth = {
            "classification": email.ground_truth.correct_classification,
            "priority": email.ground_truth.correct_priority,
            "route": email.ground_truth.correct_route,
        }
        ma_reward, ma_breakdown = self._reward_engine.compute(
            agent_outputs=final_outputs,
            coordinator_score=coord_score,
            ground_truth=ground_truth,
            self_improving_memory=self._memory,
            step_count=step_count,
        )

        # Build the actual OpenEnv action
        action = self._build_action(action_type, final_outputs)

        # Record trace step
        trace_step = TraceStep(
            step=self._step_counter,
            email_id=email.id,
            agent_outputs=final_outputs,
            coordinator_score=coord_score,
            coordinator_explanation=coord_explanation,
            final_action_type=action_type,
            final_action_value=action.value or "",
            step_reward=ma_reward,
            episode_reward=0.0,  # Updated by caller
            breakdown=ma_breakdown,
        )

        if self._trace:
            self._trace.add_step(trace_step)

        self._step_counter += 1
        return action, trace_step

    def get_trace(self) -> DecisionTrace | None:
        return self._trace

    def get_episode_metrics(self, total_steps: int, optimal_steps: int) -> dict:
        return self._reward_engine.compute_episode_metrics(
            self._memory, total_steps, optimal_steps
        )

    def _get_action_type(self, components: list[str], cycle_idx: int) -> str:
        """Map reward component name to action type."""
        _MAP = {
            "classification": "classify_email",
            "prioritization": "prioritize_email",
            "routing": "route_email",
            "reply": "generate_reply",
        }
        if not components:
            return "classify_email"
        component = components[cycle_idx % len(components)]
        return _MAP.get(component, "classify_email")

    def _build_action(
        self, action_type: str, outputs: dict[str, AgentMessage]
    ) -> Action:
        """Build the OpenEnv Action from agent outputs."""
        if action_type == "classify_email":
            value = outputs.get("ClassifierAgent", AgentMessage("", "spam", 0.5, "")).decision
        elif action_type == "prioritize_email":
            value = outputs.get("PriorityAgent", AgentMessage("", "medium", 0.5, "")).decision
        elif action_type == "route_email":
            value = outputs.get("RoutingAgent", AgentMessage("", "support", 0.5, "")).decision
        elif action_type == "generate_reply":
            value = outputs.get("ResponseAgent", AgentMessage("", "Hello, thank you.", 0.5, "")).decision
        else:
            value = "spam"

        return Action(action_type=action_type, value=value)
