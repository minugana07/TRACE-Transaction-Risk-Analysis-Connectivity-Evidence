import json
import logging
import os
from typing import List, Optional
from app.models.contracts import (
    AIExplanationResponse,
    Alert,
    Transaction,
)

logger = logging.getLogger("trace.ai")


def deterministic_fallback_explanation(
    alert: Alert,
    transactions: List[Transaction],
    mode: str = "investigate",
    user_prompt: Optional[str] = None,
) -> AIExplanationResponse:
    """
    Deterministic evidence-grounded explanation engine.
    Used when GEMINI_API_KEY is unset or when the Gemini API request fails.
    Strictly observes empirical facts, identifies gaps, and never declares guilt.
    """
    tx_count = len(transactions)
    total_amount = sum(tx.amount for tx in transactions)
    evidence_types = [e.type for e in alert.evidence]

    if mode == "protect_me":
        # Consumer safety mode: plain, non-jargony, reassuring, actionable
        headline = f"Security Notice: Review activity on your account ({alert.customer_id})"
        
        observations = [
            f"We flagged {tx_count} recent transaction(s) involving your account totaling ${total_amount:,.2f}.",
            f"Payment channel(s) observed: {', '.join(set(tx.channel for tx in transactions))}.",
        ]
        for ev in alert.evidence:
            observations.append(f"Activity detail: {ev.description}")

        inferences = [
            "This pattern differs from your typical routine and resembles behavior often seen in unauthorized account access or payment redirection.",
            "This notice does NOT mean you have done anything wrong or that fraud is confirmed.",
        ]

        limitations = [
            "If you personally authorized these payments (e.g., travel, business invoice, or emergency transfer), no further action is required.",
            "Our automated shield flags unusual speed or location shifts as a precaution to safeguard your funds.",
        ]

        recommended_actions = [
            "Review the list of transactions below to verify whether you recognize each one.",
            "If you recognize these transactions, click 'Confirm It Was Me' to clear this alert.",
            "If you DO NOT recognize these transactions, immediately click 'Lock My Account' and request a security callback.",
            "Check that your phone number and email address on file have not been changed.",
        ]

        evidence_breakdown = [
            {
                "title": ev.type.replace("_", " ").title(),
                "detail": ev.description,
                "severity": ev.severity,
            }
            for ev in alert.evidence
        ]

    else:
        # Investigate mode: professional fraud analyst workbench brief
        headline = f"Analyst Intelligence Brief: Case {alert.case_id} [Priority: {alert.risk_score:.0f}/100]"

        observations = [
            f"Subject entity {alert.customer_id} is associated with {tx_count} flagged transaction(s) with an aggregate volume of ${total_amount:,.2f}.",
            f"Triggered detection rules: {', '.join(alert.triggered_rules)}.",
        ]
        for ev in alert.evidence:
            observations.append(f"Empirical evidence [{ev.type}]: {ev.description}")

        inferences = [
            f"Observed behavioral signature aligns with known fraud typology: {', '.join(evidence_types)}.",
            f"Current priority score of {alert.risk_score:.0f}/100 reflects high urgency for human analyst verification.",
            "Fund velocity and counterparty dispersion indicate potential structured layering or compromised account takeover.",
        ]

        limitations = list(alert.limitations)
        if not limitations:
            limitations = [
                "Counterparty beneficiary KYC verification records are pending retrieval.",
                "Historical behavioral baseline prior to the current 30-day window is not fully indexed.",
                "Legitimate commercial or high-net-worth transaction rationale has not been ruled out.",
            ]

        recommended_actions = [
            "Perform out-of-band customer verification via registered contact channels.",
            "Verify counterparty beneficiary account status with correspondent banking institutions.",
            "Inspect transaction network connectivity in the Risk Ripple graph for secondary mule hops.",
            "If confirmed suspicious, place temporary settlement hold and file Suspicious Activity Report (SAR).",
            "Update case notes with all findings before resolving status.",
        ]

        evidence_breakdown = [
            {
                "id": ev.id,
                "category": ev.type,
                "observation": ev.description,
                "severity": ev.severity,
                "details": ev.details,
            }
            for ev in alert.evidence
        ]

    return AIExplanationResponse(
        case_id=alert.case_id,
        mode=mode,
        headline=headline,
        observations=observations,
        inferences=inferences,
        evidence_breakdown=evidence_breakdown,
        limitations=limitations,
        recommended_actions=recommended_actions,
        engine_used="TRACE Deterministic Grounded Engine (Safety Fallback)",
        disclaimer=(
            "TRACE AI provides evidence summarization and decision-support. "
            "It does not declare guilt, fabricate records, or replace human judgment."
        ),
    )


def generate_trace_ai_explanation(
    alert: Alert,
    transactions: List[Transaction],
    mode: str = "investigate",
    user_prompt: Optional[str] = None,
) -> AIExplanationResponse:
    """
    Invokes Google Gemini API through the backend to generate evidence-grounded
    explanations for cases. Falls back to deterministic engine if API key is missing
    or if API call fails.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        try:
            from dotenv import load_dotenv
            load_dotenv()
            api_key = os.environ.get("GEMINI_API_KEY")
        except Exception:
            pass

    if not api_key:
        logger.info("GEMINI_API_KEY not found in environment; using deterministic fallback.")
        return deterministic_fallback_explanation(alert, transactions, mode, user_prompt)

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)

        # Build strictly grounded context
        tx_details = []
        for tx in transactions:
            geo_str = f", Loc: {tx.geographic_data.city or 'Lat ' + str(tx.geographic_data.latitude)}" if tx.geographic_data else ""
            tx_details.append(
                f"- ID: {tx.id}, Time: {tx.timestamp}, Sender: {tx.sender_id}, "
                f"Receiver: {tx.receiver_id}, Amount: ${tx.amount:,.2f} {tx.currency}, "
                f"Channel: {tx.channel}, Status: {tx.status}{geo_str}"
            )

        evidence_details = [
            f"- [{e.type} | Severity: {e.severity}] {e.description} (Details: {e.details})"
            for e in alert.evidence
        ]

        system_instruction = (
            "You are TRACE AI, the dedicated intelligence assistant for the TRACE fraud detection platform. "
            "TRACE stands for Transaction Risk Analysis, Connectivity & Evidence. "
            "STRICT RULES:\n"
            "1. Ground all explanations exclusively in the provided transaction records and evidence.\n"
            "2. NEVER invent transactions, counterparty relationships, or fake locations.\n"
            "3. NEVER declare someone guilty or manufacture arbitrary risk scores. Risk scores denote investigation priority.\n"
            "4. Clearly separate OBSERVATIONS (factual data points) from INFERENCES (analytical hypotheses).\n"
            "5. Explicitly identify LIMITATIONS and benign alternative possibilities.\n"
            "6. Recommend cautious, compliant next steps.\n"
            "7. Output valid JSON adhering to the required schema."
        )

        user_content = f"""
Case Information:
- Case ID: {alert.case_id}
- Alert ID: {alert.id}
- Subject Account: {alert.customer_id}
- Investigation Priority Score: {alert.risk_score:.0f}/100 ({alert.priority})
- Target Audience Mode: {'Consumer / Safety Mode' if mode == 'protect_me' else 'Fraud Analyst Workbench'}
- Triggered Rules: {', '.join(alert.triggered_rules)}
- Stated Limitations: {', '.join(alert.limitations)}

Empirical Evidence Items:
{chr(10).join(evidence_details)}

Associated Transactions ({len(transactions)} items):
{chr(10).join(tx_details)}

User / Analyst Question: {user_prompt or 'Explain this case and provide evidence-grounded next steps.'}

Return your response in pure JSON matching this exact structure:
{{
    "headline": "concise headline",
    "observations": ["observation 1", "observation 2"],
    "inferences": ["inference 1", "inference 2"],
    "evidence_breakdown": [{{"category": "category", "finding": "finding"}}],
    "limitations": ["limitation 1", "limitation 2"],
    "recommended_actions": ["action 1", "action 2"]
}}
"""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=user_content,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )

        if response.text:
            parsed = json.loads(response.text)
            return AIExplanationResponse(
                case_id=alert.case_id,
                mode=mode,
                headline=parsed.get("headline", f"TRACE AI Analysis for Case {alert.case_id}"),
                observations=parsed.get("observations", []),
                inferences=parsed.get("inferences", []),
                evidence_breakdown=parsed.get("evidence_breakdown", []),
                limitations=parsed.get("limitations", alert.limitations),
                recommended_actions=parsed.get("recommended_actions", []),
                engine_used="Google Gemini (gemini-2.5-flash via TRACE Backend)",
                disclaimer=(
                    "TRACE AI provides evidence summarization and decision-support. "
                    "It does not declare guilt, fabricate records, or replace human judgment."
                ),
            )

    except Exception as e:
        logger.warning(f"Gemini API invocation failed ({e}); falling back gracefully.", exc_info=True)

    return deterministic_fallback_explanation(alert, transactions, mode, user_prompt)
