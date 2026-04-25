"""
NEW: multi_agent_system/agents.py

Independent reasoning agents. Each agent:
  - Receives an AgentContext (email + prior agent outputs + memory)
  - Returns an AgentMessage (decision + confidence + explanation)
  - Is deterministic given the same context

CoordinatorAgent monitors all agents, detects inconsistencies, and resolves conflicts.
"""

from __future__ import annotations

from multi_agent_system.messages import AgentContext, AgentMessage

# ---------------------------------------------------------------------------
# Consistency rules used by CoordinatorAgent
# ---------------------------------------------------------------------------

# Valid (classification, route) pairs — incoherent pairs trigger conflict penalty
_COHERENT_PAIRS: set[tuple[str, str]] = {
    ("important", "escalation"),
    ("important", "sales"),
    ("important", "support"),
    ("spam", "support"),
    ("promotion", "sales"),
    ("promotion", "support"),
}

_INCOHERENT_PAIRS: set[tuple[str, str]] = {
    ("spam", "escalation"),
    ("spam", "sales"),
    ("promotion", "escalation"),
}

# Priority consistency: spam/promotion should never be high priority
_PRIORITY_CONFLICTS: dict[str, set[str]] = {
    "spam": {"high", "medium"},
    "promotion": {"high"},
}


class ClassifierAgent:
    """Classifies email as spam / important / promotion with confidence and explanation."""

    name = "ClassifierAgent"

    _SPAM_SIGNALS = ["prize", "won", "free", "click here", "earn", "miracle",
                     "lose weight", "make money", "risk-free", "act now", "limited time"]
    _IMPORTANT_SIGNALS = ["refund", "billing", "account", "access", "outage", "contract",
                          "invoice", "suspension", "critical", "urgent", "escalation",
                          "partnership", "executive", "board", "vip", "renewal"]

    def decide(self, ctx: AgentContext) -> AgentMessage:
        text = (ctx.subject + " " + ctx.body).lower()
        sender = ctx.sender_type

        spam_hits = sum(1 for s in self._SPAM_SIGNALS if s in text)
        important_hits = sum(1 for s in self._IMPORTANT_SIGNALS if s in text)

        if sender == "spammer" or spam_hits >= 2:
            decision = "spam"
            confidence = min(0.95, 0.6 + spam_hits * 0.1)
            explanation = f"Spam signals detected ({spam_hits} hits). Sender type: {sender}."
            alternatives = ["promotion"] if spam_hits < 3 else []
        elif sender in ("VIP", "internal") or important_hits >= 1:
            decision = "important"
            confidence = min(0.95, 0.65 + important_hits * 0.1)
            explanation = f"Important signals detected ({important_hits} hits). Sender: {sender}."
            alternatives = ["promotion"] if important_hits == 1 else []
        else:
            decision = "promotion"
            confidence = 0.6
            explanation = "No strong spam or important signals. Defaulting to promotion."
            alternatives = ["important"]

        # Consistency with history: if same sender was classified differently before
        if ctx.classification_history and ctx.classification_history[-1] != decision:
            confidence = max(0.4, confidence - 0.15)
            explanation += f" Note: prior classification for {ctx.sender_type} was '{ctx.classification_history[-1]}'."

        return AgentMessage(
            agent_name=self.name,
            decision=decision,
            confidence=confidence,
            explanation=explanation,
            alternatives=alternatives,
        )


class PriorityAgent:
    """Assigns priority (low/medium/high) based on email content and classifier output."""

    name = "PriorityAgent"

    def decide(self, ctx: AgentContext) -> AgentMessage:
        urgency = ctx.urgency_score
        classification = ctx.prior_outputs.get("ClassifierAgent")
        cls_decision = classification.decision if classification else "important"

        # Error propagation: if classifier said spam, priority should be low
        if cls_decision == "spam":
            decision = "low"
            confidence = 0.9
            explanation = "Spam emails always get low priority."
            alternatives = []
        elif urgency >= 0.75 or ctx.sender_type == "VIP":
            decision = "high"
            confidence = min(0.95, 0.7 + urgency * 0.3)
            explanation = f"High urgency ({urgency:.2f}) or VIP sender warrants high priority."
            alternatives = ["medium"]
        elif urgency >= 0.45:
            decision = "medium"
            confidence = 0.75
            explanation = f"Moderate urgency ({urgency:.2f}) maps to medium priority."
            alternatives = ["high", "low"]
        else:
            decision = "low"
            confidence = 0.8
            explanation = f"Low urgency ({urgency:.2f}) maps to low priority."
            alternatives = ["medium"]

        # Conflict detection: hard task conflicting signal
        if urgency >= 0.7 and decision != "high" and cls_decision == "important":
            explanation += " [CONFLICT: high urgency but non-high priority — ambiguous email detected]"

        return AgentMessage(
            agent_name=self.name,
            decision=decision,
            confidence=confidence,
            explanation=explanation,
            alternatives=alternatives,
        )


class RoutingAgent:
    """Routes email to support/sales/escalation based on content and prior decisions."""

    name = "RoutingAgent"

    _ESCALATION_SIGNALS = ["critical", "outage", "executive", "board", "contract",
                           "investment", "escalation", "production", "urgent"]
    _SALES_SIGNALS = ["partnership", "proposal", "pricing", "renewal", "revenue",
                      "demo", "upgrade", "purchase", "buy", "plan"]

    def decide(self, ctx: AgentContext) -> AgentMessage:
        text = (ctx.subject + " " + ctx.body).lower()
        classification = ctx.prior_outputs.get("ClassifierAgent")
        priority = ctx.prior_outputs.get("PriorityAgent")
        cls_decision = classification.decision if classification else "important"
        pri_decision = priority.decision if priority else "medium"

        escalation_hits = sum(1 for s in self._ESCALATION_SIGNALS if s in text)
        sales_hits = sum(1 for s in self._SALES_SIGNALS if s in text)

        if cls_decision == "spam":
            decision = "support"
            confidence = 0.95
            explanation = "Spam always routed to support for filtering."
            alternatives = []
        elif ctx.sender_type == "VIP" or (escalation_hits >= 1 and pri_decision == "high"):
            decision = "escalation"
            confidence = min(0.95, 0.7 + escalation_hits * 0.1)
            explanation = f"VIP or high-priority escalation signals ({escalation_hits} hits)."
            alternatives = ["support"]
        elif sales_hits >= 1 and cls_decision in ("important", "promotion"):
            decision = "sales"
            confidence = min(0.9, 0.65 + sales_hits * 0.1)
            explanation = f"Sales signals detected ({sales_hits} hits)."
            alternatives = ["support"]
        else:
            decision = "support"
            confidence = 0.75
            explanation = "Default routing to support team."
            alternatives = ["escalation"] if pri_decision == "high" else []

        return AgentMessage(
            agent_name=self.name,
            decision=decision,
            confidence=confidence,
            explanation=explanation,
            alternatives=alternatives,
        )


class ResponseAgent:
    """Generates a professional reply based on email content and prior agent decisions."""

    name = "ResponseAgent"

    def decide(self, ctx: AgentContext) -> AgentMessage:
        classification = ctx.prior_outputs.get("ClassifierAgent")
        routing = ctx.prior_outputs.get("RoutingAgent")
        cls_decision = classification.decision if classification else "important"
        route_decision = routing.decision if routing else "support"

        if cls_decision == "spam":
            reply = (
                "Hello, we have received your message. "
                "Our system has flagged this email for review. "
                "If this was sent in error, please contact our support team."
            )
            confidence = 0.9
            explanation = "Standard spam acknowledgment reply."
        elif route_decision == "escalation":
            reply = (
                f"Hello, thank you for reaching out regarding '{ctx.subject}'. "
                "This matter has been escalated to our senior team and will be addressed "
                "with the highest priority within 2 hours. We appreciate your patience."
            )
            confidence = 0.85
            explanation = "Escalation reply with SLA commitment."
        elif route_decision == "sales":
            reply = (
                f"Hello, thank you for your interest regarding '{ctx.subject}'. "
                "Our sales team will review your request and reach out within 24 hours "
                "to discuss how we can best assist you."
            )
            confidence = 0.85
            explanation = "Sales team handoff reply."
        else:
            reply = (
                f"Hello, thank you for contacting us about '{ctx.subject}'. "
                "We have received your message and our support team will respond "
                "within 24 hours with a resolution."
            )
            confidence = 0.8
            explanation = "Standard support acknowledgment reply."

        # Add dominant intent reference for hard task
        if ctx.dominant_intent and ctx.dominant_intent.lower() not in reply.lower():
            reply = reply.rstrip(".") + f", specifically regarding your {ctx.dominant_intent}."
            explanation += f" Dominant intent '{ctx.dominant_intent}' referenced."

        return AgentMessage(
            agent_name=self.name,
            decision=reply,
            confidence=confidence,
            explanation=explanation,
        )


class CoordinatorAgent:
    """
    NEW: CoordinatorAgent — monitors all agents, detects inconsistencies,
    resolves conflicts, and improves overall decision quality.

    Responsibilities:
    1. Detect incoherent (classification, route) pairs
    2. Detect priority conflicts (spam marked high priority)
    3. Override decisions when confidence gap is large
    4. Compute coordination score for reward engine
    5. Generate conflict resolution explanation
    """

    name = "CoordinatorAgent"

    def coordinate(
        self,
        ctx: AgentContext,
        agent_outputs: dict[str, AgentMessage],
    ) -> tuple[dict[str, AgentMessage], float, str]:
        """
        Review all agent outputs, resolve conflicts, return:
          - corrected outputs dict
          - coordination_score: float in [-0.2, +0.2]
          - coordination_explanation: str
        """
        outputs = dict(agent_outputs)
        issues: list[str] = []
        coordination_score = 0.0

        cls_msg = outputs.get("ClassifierAgent")
        pri_msg = outputs.get("PriorityAgent")
        rte_msg = outputs.get("RoutingAgent")

        cls = cls_msg.decision if cls_msg else None
        pri = pri_msg.decision if pri_msg else None
        rte = rte_msg.decision if rte_msg else None

        # --- Check 1: Classification vs Route coherence ---
        if cls and rte:
            if (cls, rte) in _INCOHERENT_PAIRS:
                issues.append(f"CONFLICT: {cls} classified but routed to {rte}")
                coordination_score -= 0.15
                # Override route to most coherent option
                if cls == "spam":
                    corrected_route = "support"
                elif cls == "promotion":
                    corrected_route = "sales"
                else:
                    corrected_route = rte
                if corrected_route != rte and rte_msg:
                    outputs["RoutingAgent"] = AgentMessage(
                        agent_name="RoutingAgent",
                        decision=corrected_route,
                        confidence=0.85,
                        explanation=f"[COORDINATOR OVERRIDE] Route corrected from '{rte}' to '{corrected_route}' due to classification conflict.",
                        alternatives=[rte],
                        metadata={"overridden_by": "CoordinatorAgent", "original": rte},
                    )
            elif (cls, rte) in _COHERENT_PAIRS:
                coordination_score += 0.1
                issues.append(f"COHERENT: {cls} + {rte} is a valid pair")

        # --- Check 2: Priority vs Classification conflict ---
        if cls and pri:
            conflict_priorities = _PRIORITY_CONFLICTS.get(cls, set())
            if pri in conflict_priorities:
                issues.append(f"CONFLICT: {cls} email marked {pri} priority")
                coordination_score -= 0.1
                # Override priority
                if pri_msg:
                    outputs["PriorityAgent"] = AgentMessage(
                        agent_name="PriorityAgent",
                        decision="low",
                        confidence=0.9,
                        explanation=f"[COORDINATOR OVERRIDE] Priority corrected from '{pri}' to 'low' — {cls} emails should not be {pri} priority.",
                        alternatives=[pri],
                        metadata={"overridden_by": "CoordinatorAgent", "original": pri},
                    )

        # --- Check 3: Agent agreement bonus ---
        confidences = [m.confidence for m in outputs.values() if m]
        if confidences:
            avg_confidence = sum(confidences) / len(confidences)
            if avg_confidence >= 0.8 and not any("CONFLICT" in i for i in issues):
                coordination_score += 0.05
                issues.append(f"HIGH AGREEMENT: avg confidence {avg_confidence:.2f}")

        # Clamp coordination score
        coordination_score = max(-0.2, min(0.2, coordination_score))

        explanation = (
            f"CoordinatorAgent reviewed {len(outputs)} agents. "
            + " | ".join(issues) if issues
            else "CoordinatorAgent: all decisions are consistent."
        )

        return outputs, coordination_score, explanation
