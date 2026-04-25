"""
oversight_env — AI Oversight Inspector Environment
Round 2: Meta × Hugging Face OpenEnv Hackathon

An OpenEnv-compliant environment where an LLM agent acts as an AI Oversight Inspector,
monitoring a fleet of sub-agents for hallucinations, policy violations, and inconsistencies.

Theme: Multi-Agent Interactions + Scalable Oversight (bonus prize)
"""

from oversight_env.env import OversightEnv
from oversight_env.models import (
    OversightObservation,
    OversightAction,
    OversightReward,
    SubAgentOutput,
    ViolationType,
    SeverityLevel,
)

__all__ = [
    "OversightEnv",
    "OversightObservation",
    "OversightAction",
    "OversightReward",
    "SubAgentOutput",
    "ViolationType",
    "SeverityLevel",
]
