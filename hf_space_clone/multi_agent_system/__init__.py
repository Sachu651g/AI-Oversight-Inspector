"""
multi_agent_system — NEW: Multi-Agent Coordination Layer for openenv-email-ops

Provides:
  - Independent reasoning agents (Classifier, Priority, Routing, Response)
  - CoordinatorAgent that detects inconsistencies and resolves conflicts
  - Structured AgentMessage protocol for inter-agent communication
  - DecisionTrace for full explainability and observability
  - SelfImprovingMemory for per-agent mistake tracking and correction bonuses
  - MultiAgentRewardEngine for local + global + coordination rewards

All components are additive — zero changes to existing OpenEnv core APIs.
"""

from multi_agent_system.agents import (
    ClassifierAgent,
    PriorityAgent,
    RoutingAgent,
    ResponseAgent,
    CoordinatorAgent,
)
from multi_agent_system.messages import AgentMessage, AgentContext
from multi_agent_system.trace import DecisionTrace, TraceStep
from multi_agent_system.self_improving_memory import SelfImprovingMemory
from multi_agent_system.reward_extension import MultiAgentRewardEngine

__all__ = [
    "ClassifierAgent",
    "PriorityAgent",
    "RoutingAgent",
    "ResponseAgent",
    "CoordinatorAgent",
    "AgentMessage",
    "AgentContext",
    "DecisionTrace",
    "TraceStep",
    "SelfImprovingMemory",
    "MultiAgentRewardEngine",
]
