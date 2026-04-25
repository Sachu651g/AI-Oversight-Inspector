"""Tests for multi_agent_system — unit tests for all new components."""

from __future__ import annotations

import pytest

from openenv_email_ops.models import Action, Email, GroundTruth, TaskConfig

from multi_agent_system.agents import (
    ClassifierAgent,
    CoordinatorAgent,
    PriorityAgent,
    ResponseAgent,
    RoutingAgent,
)
from multi_agent_system.messages import AgentContext, AgentMessage
from multi_agent_system.orchestrator import MultiAgentOrchestrator
from multi_agent_system.reward_extension import MultiAgentRewardEngine
from multi_agent_system.self_improving_memory import SelfImprovingMemory
from multi_agent_system.trace import DecisionTrace, TraceStep


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_email(
    subject: str = "Test subject",
    body: str = "Test body content here.",
    sender_type: str = "customer",
    urgency: float = 0.5,
    classification: str = "important",
    priority: str = "medium",
    route: str = "support",
) -> Email:
    return Email(
        id="test-email-001",
        subject=subject,
        body=body,
        sender_type=sender_type,
        urgency_score=urgency,
        ground_truth=GroundTruth(
            correct_classification=classification,
            correct_priority=priority,
            correct_route=route,
        ),
    )


def _make_ctx(email: Email, prior: dict | None = None) -> AgentContext:
    return AgentContext(
        email_id=email.id,
        subject=email.subject,
        body=email.body,
        sender_type=email.sender_type,
        urgency_score=email.urgency_score,
        step_count=0,
        prior_outputs=prior or {},
    )


EASY_TASK = TaskConfig(
    task_id="easy",
    description="Easy task",
    difficulty="easy",
    max_steps=30,
    inbox_size=5,
    reward_components=["classification"],
)

HARD_TASK = TaskConfig(
    task_id="hard",
    description="Hard task",
    difficulty="hard",
    max_steps=80,
    inbox_size=10,
    reward_components=["classification", "prioritization", "routing", "reply"],
)


# ---------------------------------------------------------------------------
# ClassifierAgent tests
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_classifier_spam():
    agent = ClassifierAgent()
    email = _make_email(
        subject="You WON a FREE iPhone!!!",
        body="Click here to claim your prize. Act now!!!",
        sender_type="spammer",
    )
    msg = agent.decide(_make_ctx(email))
    assert msg.decision == "spam"
    assert msg.confidence >= 0.6
    assert msg.agent_name == "ClassifierAgent"


@pytest.mark.unit
def test_classifier_important_vip():
    agent = ClassifierAgent()
    email = _make_email(
        subject="Contract renewal discussion",
        body="We need to discuss the contract renewal.",
        sender_type="VIP",
    )
    msg = agent.decide(_make_ctx(email))
    assert msg.decision == "important"
    assert msg.confidence >= 0.6


@pytest.mark.unit
def test_classifier_returns_explanation():
    agent = ClassifierAgent()
    email = _make_email()
    msg = agent.decide(_make_ctx(email))
    assert len(msg.explanation) > 10


# ---------------------------------------------------------------------------
# PriorityAgent tests
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_priority_spam_always_low():
    agent = PriorityAgent()
    email = _make_email(sender_type="spammer", urgency=0.9)
    cls_msg = AgentMessage("ClassifierAgent", "spam", 0.9, "spam detected")
    ctx = _make_ctx(email, prior={"ClassifierAgent": cls_msg})
    msg = agent.decide(ctx)
    assert msg.decision == "low"


@pytest.mark.unit
def test_priority_high_urgency():
    agent = PriorityAgent()
    email = _make_email(urgency=0.85)
    ctx = _make_ctx(email)
    msg = agent.decide(ctx)
    assert msg.decision == "high"


@pytest.mark.unit
def test_priority_low_urgency():
    agent = PriorityAgent()
    email = _make_email(urgency=0.2)
    ctx = _make_ctx(email)
    msg = agent.decide(ctx)
    assert msg.decision == "low"


# ---------------------------------------------------------------------------
# RoutingAgent tests
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_routing_spam_to_support():
    agent = RoutingAgent()
    email = _make_email(sender_type="spammer")
    cls_msg = AgentMessage("ClassifierAgent", "spam", 0.9, "spam")
    ctx = _make_ctx(email, prior={"ClassifierAgent": cls_msg})
    msg = agent.decide(ctx)
    assert msg.decision == "support"


@pytest.mark.unit
def test_routing_vip_to_escalation():
    agent = RoutingAgent()
    email = _make_email(
        subject="Critical issue escalation",
        sender_type="VIP",
        urgency=0.95,
    )
    cls_msg = AgentMessage("ClassifierAgent", "important", 0.9, "important")
    pri_msg = AgentMessage("PriorityAgent", "high", 0.9, "high")
    ctx = _make_ctx(email, prior={"ClassifierAgent": cls_msg, "PriorityAgent": pri_msg})
    msg = agent.decide(ctx)
    assert msg.decision == "escalation"


# ---------------------------------------------------------------------------
# CoordinatorAgent tests
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_coordinator_detects_spam_escalation_conflict():
    coordinator = CoordinatorAgent()
    email = _make_email()
    ctx = _make_ctx(email)
    outputs = {
        "ClassifierAgent": AgentMessage("ClassifierAgent", "spam", 0.9, "spam"),
        "RoutingAgent": AgentMessage("RoutingAgent", "escalation", 0.8, "escalation"),
    }
    corrected, score, explanation = coordinator.coordinate(ctx, outputs)
    assert score < 0.0  # Conflict penalty
    assert corrected["RoutingAgent"].decision == "support"  # Override applied
    assert "CONFLICT" in explanation or "COORDINATOR" in corrected["RoutingAgent"].explanation


@pytest.mark.unit
def test_coordinator_coherent_pair_bonus():
    coordinator = CoordinatorAgent()
    email = _make_email()
    ctx = _make_ctx(email)
    outputs = {
        "ClassifierAgent": AgentMessage("ClassifierAgent", "important", 0.9, "important"),
        "RoutingAgent": AgentMessage("RoutingAgent", "support", 0.85, "support"),
    }
    _, score, _ = coordinator.coordinate(ctx, outputs)
    assert score > 0.0  # Coherent pair bonus


# ---------------------------------------------------------------------------
# SelfImprovingMemory tests
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_self_improving_memory_improvement_bonus():
    mem = SelfImprovingMemory()
    mem.record("e1", "ClassifierAgent", "spam", correct=False)
    mem.record("e2", "ClassifierAgent", "important", correct=True)
    adj = mem.compute_adjustment("ClassifierAgent")
    assert adj == pytest.approx(0.1)


@pytest.mark.unit
def test_self_improving_memory_degradation_penalty():
    mem = SelfImprovingMemory()
    mem.record("e1", "ClassifierAgent", "spam", correct=False)
    mem.record("e2", "ClassifierAgent", "spam", correct=False)
    adj = mem.compute_adjustment("ClassifierAgent")
    assert adj == pytest.approx(-0.1)


@pytest.mark.unit
def test_self_improving_memory_reset():
    mem = SelfImprovingMemory()
    mem.record("e1", "ClassifierAgent", "spam", correct=False)
    mem.reset()
    assert mem.get_summary() == {}


# ---------------------------------------------------------------------------
# MultiAgentRewardEngine tests
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_reward_engine_correct_classification():
    engine = MultiAgentRewardEngine()
    mem = SelfImprovingMemory()
    outputs = {
        "ClassifierAgent": AgentMessage("ClassifierAgent", "important", 0.9, "correct"),
    }
    total, breakdown = engine.compute(
        agent_outputs=outputs,
        coordinator_score=0.0,
        ground_truth={"classification": "important"},
        self_improving_memory=mem,
        step_count=0,
    )
    assert breakdown["local_classification"] == pytest.approx(0.4)


@pytest.mark.unit
def test_reward_engine_score_in_range():
    engine = MultiAgentRewardEngine()
    mem = SelfImprovingMemory()
    outputs = {
        "ClassifierAgent": AgentMessage("ClassifierAgent", "spam", 0.9, "spam"),
        "PriorityAgent": AgentMessage("PriorityAgent", "low", 0.9, "low"),
        "RoutingAgent": AgentMessage("RoutingAgent", "support", 0.9, "support"),
    }
    total, _ = engine.compute(
        agent_outputs=outputs,
        coordinator_score=0.1,
        ground_truth={"classification": "spam", "priority": "low", "route": "support"},
        self_improving_memory=mem,
        step_count=0,
    )
    assert -1.0 <= total <= 1.0


# ---------------------------------------------------------------------------
# MultiAgentOrchestrator integration test
# ---------------------------------------------------------------------------

@pytest.mark.unit
def test_orchestrator_produces_valid_action():
    orch = MultiAgentOrchestrator()
    orch.reset(task_id="easy")
    email = _make_email()
    action, trace_step = orch.process(email, EASY_TASK, step_count=0)
    assert action.action_type == "classify_email"
    assert action.value in {"spam", "important", "promotion"}
    assert trace_step.step == 0
    assert "ClassifierAgent" in trace_step.agent_outputs


@pytest.mark.unit
def test_orchestrator_hard_task_cycles_all_actions():
    orch = MultiAgentOrchestrator()
    orch.reset(task_id="hard")
    email = _make_email()
    action_types = []
    for i in range(4):
        action, _ = orch.process(email, HARD_TASK, step_count=i)
        action_types.append(action.action_type)
    assert "classify_email" in action_types
    assert "prioritize_email" in action_types
    assert "route_email" in action_types
    assert "generate_reply" in action_types


@pytest.mark.unit
def test_orchestrator_trace_records_steps():
    orch = MultiAgentOrchestrator()
    orch.reset(task_id="easy")
    email = _make_email()
    for i in range(3):
        orch.process(email, EASY_TASK, step_count=i)
    trace = orch.get_trace()
    assert trace is not None
    assert trace.total_steps == 3
