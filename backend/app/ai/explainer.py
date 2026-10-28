import json
import logging
import os
from typing import List, Optional, Dict, Any
from app.models.contracts import (
    AIExplanationResponse,
    AIChatResponse,
    Alert,
    Transaction,
)
from app.store import store

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

    prompt_note = f" (Focus: '{user_prompt}')" if user_prompt else ""

    if mode == "protect_me":
        # Consumer safety mode: plain, non-jargony, reassuring, actionable
        headline = f"Security Notice: Review activity on your account ({alert.customer_id}){prompt_note}"

        observations = [
            f"We flagged {tx_count} recent transaction(s) involving your account totaling ₹{total_amount:,.2f}.",
            f"Payment channel(s) observed: {', '.join(set(tx.channel for tx in transactions))}.",
        ]
        for ev in alert.evidence:
            observations.append(f"Activity detail: {ev.description}")

        if user_prompt:
            observations.append(f"In response to your query regarding '{user_prompt}', we verified the specific records above.")

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
        headline = f"Analyst Intelligence Brief: Case {alert.case_id} [Priority: {alert.risk_score:.0f}/100]{prompt_note}"

        observations = [
            f"Subject entity {alert.customer_id} is associated with {tx_count} flagged transaction(s) with an aggregate volume of ₹{total_amount:,.2f}.",
            f"Triggered detection rules: {', '.join(alert.triggered_rules)}.",
        ]
        for ev in alert.evidence:
            observations.append(f"Empirical evidence [{ev.type}]: {ev.description}")

        if user_prompt:
            observations.append(f"Forensic scope query addressed: '{user_prompt}' against case ledger.")

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
                f"Receiver: {tx.receiver_id}, Amount: ₹{tx.amount:,.2f} {tx.currency}, "
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

        # Query active Gemini model (gemini-3.5-flash-lite)
        gemini_models = ["gemini-3.5-flash-lite", "gemini-flash-latest", "gemini-2.5-pro"]
        response = None
        used_model = "gemini-3.5-flash-lite"

        for mdl in gemini_models:
            try:
                response = client.models.generate_content(
                    model=mdl,
                    contents=user_content,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        response_mime_type="application/json",
                        temperature=0.2,
                    ),
                )
                if response and response.text:
                    used_model = mdl
                    break
            except Exception as model_err:
                logger.warning(f"Gemini model {mdl} invocation failed: {model_err}; trying next...")

        if response and response.text:
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
                engine_used=f"Google Gemini ({used_model} via TRACE Backend)",
                disclaimer=(
                    "TRACE AI provides evidence summarization and decision-support. "
                    "It does not declare guilt, fabricate records, or replace human judgment."
                ),
            )

    except Exception as e:
        logger.warning(f"Gemini API invocation failed ({e}); falling back gracefully.", exc_info=True)

    return deterministic_fallback_explanation(alert, transactions, mode, user_prompt)


def generate_trace_ai_chat(
    message: str,
    case_id: Optional[str] = None,
    mode: str = "investigate",
    history: Optional[List[Dict[str, str]]] = None,
) -> AIChatResponse:
    """
    Conversational TRACE AI assistant supporting both open-ended dialogue and
    case-grounded forensic queries. Seamlessly connects to Gemini API when configured,
    or utilizes an offline evidence-grounded synthesis engine as a reliable fallback.
    """
    msg_lower = message.lower().strip()

    # Retrieve context if case_id provided or inferred
    alert = None
    transactions = []

    if case_id:
        alert = store.get_alert_by_case_id(case_id)
        if alert:
            transactions = store.get_transactions_for_case(alert.case_id)
    else:
        # Check if user mentioned a specific case or account in their prompt
        all_alerts = store.get_all_alerts()
        for a in all_alerts:
            if a.case_id.lower() in msg_lower or a.customer_id.lower() in msg_lower:
                alert = a
                transactions = store.get_transactions_for_case(a.case_id)
                case_id = a.case_id
                break

    # Check for Gemini API key
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        try:
            from dotenv import load_dotenv
            load_dotenv()
            api_key = os.environ.get("GEMINI_API_KEY")
        except Exception:
            pass

    if api_key:
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=api_key)

            # Build rich grounded prompt
            context_blocks = []
            if alert:
                tx_lines = [
                    f"  * Tx {t.id}: ₹{t.amount:,.2f} via {t.channel} from {t.sender_id} -> {t.receiver_id} at {t.timestamp}"
                    for t in transactions[:8]
                ]
                context_blocks.append(
                    f"Selected Case Context: Case Ref: {alert.case_id}, Subject: {alert.customer_id}, "
                    f"Risk Score: {alert.risk_score}/100 ({alert.priority}), Status: {alert.investigation_status}.\n"
                    f"Triggered Rules: {', '.join(alert.triggered_rules)}.\n"
                    f"Evidence Items: {', '.join(e.description for e in alert.evidence)}.\n"
                    f"Transactions in Case ({len(transactions)} items):\n" + "\n".join(tx_lines)
                )
            else:
                total_txs = len(store.get_all_transactions())
                alerts_count = len(store.get_all_alerts())
                context_blocks.append(
                    f"System Ledger Scope: Currently monitoring {total_txs} transactions across {alerts_count} prioritized alert cases."
                )

            system_instruction = (
                "You are TRACE AI, an advanced conversational financial intelligence assistant for TRACE "
                "(Transaction Risk Analysis, Connectivity & Evidence).\n"
                "You assist both financial crime investigators and consumers.\n"
                "RULES:\n"
                "1. If answering about specific cases or transactions, strictly use the provided ledger context.\n"
                "2. When explaining suspicious activity, distinguish factual observations from analytical inferences.\n"
                "3. You can answer general questions about financial crime, money laundering, structuring, smurfing, "
                "mule accounts, SAR filing, phishing scams, chargebacks, and account security.\n"
                "4. Format answers cleanly in markdown with bullet points, bold key terms, and concise paragraphs.\n"
                "5. Never declare someone definitively guilty. Always recommend cautious, compliant verification next steps.\n"
                "6. If in consumer mode (protect_me), use plain, accessible language and practical guidance."
            )

            # Format previous dialogue
            chat_context = "\n".join(context_blocks) + "\n\n"
            if history:
                for turn in history[-6:]:
                    role = turn.get("role", "user")
                    text = turn.get("content", "")
                    chat_context += f"{role.upper()}: {text}\n"

            chat_context += f"USER: {message}\nTRACE AI:"

            gemini_models = ["gemini-3.5-flash-lite", "gemini-flash-latest", "gemini-2.5-pro"]
            response = None
            used_model = "gemini-3.5-flash-lite"

            for mdl in gemini_models:
                try:
                    response = client.models.generate_content(
                        model=mdl,
                        contents=chat_context,
                        config=types.GenerateContentConfig(
                            system_instruction=system_instruction,
                            temperature=0.3,
                        ),
                    )
                    if response and response.text:
                        used_model = mdl
                        break
                except Exception as model_err:
                    logger.warning(f"Conversational model {mdl} failed: {model_err}; trying next...")

            if response and response.text and response.text.strip():
                return AIChatResponse(
                    reply=response.text.strip(),
                    engine_used=f"Google Gemini ({used_model} via TRACE Backend)",
                    case_id=case_id,
                    disclaimer="TRACE AI decision-support. Grounded in actual records; human review required.",
                    suggestions=[
                        "What forensic evidence triggered this alert?",
                        "What are the recommended investigation next steps?",
                        "Explain the counterparty risk connections in this flow.",
                    ],
                )

        except Exception as e:
            logger.warning(f"Conversational Gemini API call failed: {e}; engaging offline engine.", exc_info=True)

    # Contextual, intelligent offline fallback
    total_tx_count = len(store.get_all_transactions())
    total_alert_count = len(store.get_all_alerts())

    # 1. Check for greetings
    is_greeting = any(
        msg_lower == g or msg_lower.startswith(g + " ") or msg_lower.startswith(g + "!") or msg_lower.startswith(g + ",")
        for g in ["hi", "hai", "hello", "hey", "hola", "namaste", "good morning", "good afternoon", "good evening", "howdy", "sup"]
    )

    if is_greeting:
        return AIChatResponse(
            reply=(
                "Hello! I am **TRACE AI**, your financial crime intelligence and digital safety assistant.\n\n"
                "How can I assist your investigation today?\n"
                "- Inquire about a case (e.g., *Explain the evidence for CASE-M2-ACC-101*)\n"
                "- Review fraud typologies like **structuring**, **smurfing**, or **money mules**\n"
                "- Inspect suspicious payment flows in the **Risk Ripple** network\n"
                "- Ask about compliance protocols and regulatory **SAR filing** guidance"
            ),
            engine_used="TRACE Grounded Intelligence Core",
            case_id=case_id,
            suggestions=[
                "Explain the highest priority alert case",
                "What is structuring and how does TRACE detect it?",
                "What are the red flags for mule account networks?",
            ],
        )

    # 1. User is asking about a specific case or active case
    if alert:
        tx_count = len(transactions)
        total_amt = sum(t.amount for t in transactions)
        rules = ", ".join(alert.triggered_rules) or "Automated Velocity Threshold"

        if "evidence" in msg_lower or "rule" in msg_lower or "why" in msg_lower or "flagged" in msg_lower:
            reply = (
                f"### Evidence Analysis for Case **{alert.case_id}** (Subject: `{alert.customer_id}`)\n\n"
                f"**Empirical Observations:**\n"
                f"- **Transaction Count**: {tx_count} transfers totaling **₹{total_amt:,.2f}**.\n"
                f"- **Triggered Forensic Rules**: `{rules}`.\n"
                f"- **Risk Priority Score**: **{alert.risk_score:.0f}/100** ({alert.priority} Priority).\n\n"
                f"**Evidence Chain:**\n"
            )
            for ev in alert.evidence:
                reply += f"- **{ev.type}** ({ev.severity}): {ev.description}\n"

            reply += (
                f"\n**Analytical Inferences:**\n"
                f"- Observed activity shows atypical transfer velocity and counterparty dispersion.\n"
                f"- **Data Limitations**: Historical 90-day baseline is incomplete; legitimate business rationale not yet disproven.\n\n"
                f"**Recommended Action**: Verify beneficiary account ownership and review connected hops in the **Risk Ripple Graph**."
            )

        elif "step" in msg_lower or "recommend" in msg_lower or "action" in msg_lower or "do" in msg_lower:
            reply = (
                f"### Prudent Next Steps for Case **{alert.case_id}**\n\n"
                f"Based on the **{alert.priority}** severity rating ({alert.risk_score:.0f}/100):\n\n"
                f"1. **Out-of-Band Customer Verification**: Contact account holder `{alert.customer_id}` through registered telephone or banking app push.\n"
                f"2. **Risk Ripple Graph Inspection**: Trace fund hops to identify downstream intermediaries or crypto off-ramps.\n"
                f"3. **Beneficiary Counterparty Review**: Verify destination institutions ({', '.join(set(t.receiver_id for t in transactions))}).\n"
                f"4. **Log Findings**: Record observations in SQLite case notes and escalate if counterparty reports match known mules.\n"
                f"5. **Regulatory Escalation**: File a Suspicious Activity Report (SAR) only if human review confirms absence of legitimate rationale."
            )
        else:
            reply = (
                f"### Case Summary: **{alert.case_id}**\n\n"
                f"**Subject Account**: `{alert.customer_id}`\n"
                f"**Investigation Priority**: **{alert.risk_score:.0f}/100** ({alert.priority})\n"
                f"**Status**: `{alert.investigation_status}`\n"
                f"**Volume**: {tx_count} transfers totaling **₹{total_amt:,.2f}**\n\n"
                f"{alert.summary}\n\n"
                f"Triggered detection rules include `{rules}`. You can ask me to explain the evidence, recommend next steps, or analyze specific counterparties."
            )

    # 2. Financial crime typologies
    elif "structuring" in msg_lower or "smurfing" in msg_lower:
        reply = (
            "### Forensic Typology: Structuring & Smurfing\n\n"
            "**Definition**:\n"
            "Structuring (often called *smurfing*) is the practice of executing multiple financial transactions "
            "in specific currency amounts designed to stay just below statutory reporting thresholds (such as statutory ₹10,00,000 reporting limits or regional AML thresholds).\n\n"
            "**Key Indicators in TRACE**:\n"
            "- Repeated transfers between ₹45,000 and ₹49,950 within a 24-48 hour window.\n"
            "- Sudden spikes in velocity across peer-to-peer or cash deposit channels.\n"
            "- Immediate consolidation of fragmented funds into a single outbound wire or cryptocurrency wallet.\n\n"
            "**Compliance Protocol**:\n"
            "Financial institutions are legally required to file a Suspicious Activity Report (SAR) when deliberate structuring patterns are detected."
        )

    elif "mule" in msg_lower:
        reply = (
            "### Forensic Typology: Money Mules & Layering Hubs\n\n"
            "**Definition**:\n"
            "A money mule is an account or individual recruited (often unwittingly via romance, job, or lottery scams) "
            "to receive fraudulent funds and quickly transfer them to other accounts or convert them to crypto/cash.\n\n"
            "**TRACE Risk Ripple Signature**:\n"
            "- **Inbound/Outbound Velocity**: Funds arrive and are dispersed within minutes (Rapid Movement / High In-and-Out).\n"
            "- **Zero Residual Balance**: The account acts purely as a conduit with minimal holding time.\n"
            "- **Fan-Out Topology**: Connected in the Risk Ripple graph to multiple distinct originator accounts and a single consolidated beneficiary."
        )

    elif "velocity" in msg_lower:
        reply = (
            "### Detection Metric: Transaction Velocity Shift\n\n"
            "**How TRACE Analyzes Velocity**:\n"
            "Velocity refers to the frequency, speed, and volume of payments within a given temporal window (e.g., 10 minutes, 1 hour, 24 hours).\n\n"
            "- **Baseline Deviation**: An account that typically executes 2 transactions a month suddenly initiates 15 high-value transfers in 2 hours.\n"
            "- **Channel Shift**: Moving from standard point-of-sale debit card usage to high-frequency rapid wire transfers.\n"
            "- **Bursts**: Multiple micro-transfers followed by rapid capital drain."
        )

    elif "scam" in msg_lower or "phishing" in msg_lower or "call" in msg_lower:
        reply = (
            "### Consumer Protection: Identifying Impersonation Scams\n\n"
            "Common scam patterns observed by the TRACE Safety Shield:\n\n"
            "1. **Urgency & Coercion**: Callers claiming to be from your bank's fraud department instructing you to move money to a 'safe holding account'.\n"
            "2. **Screen Sharing & OTP Requests**: Demanding one-time passwords (OTP) or remote access tools (AnyDesk, TeamViewer).\n"
            "3. **CallShield Defense**: In the Protect Me workspace, you can use **CallShield** to lookup unverified phone numbers and verify threat indicators before taking action."
        )

    else:
        reply = (
            f"### TRACE Financial Crime Intelligence Assistant\n\n"
            f"I am actively monitoring the TRACE ledger comprising **{total_tx_count} verified transaction records** "
            f"across **{total_alert_count} prioritized investigation cases**.\n\n"
            f"**How I can assist you:**\n"
            f"- **Investigate Cases**: Ask about specific case IDs (e.g. `CASE-1`), accounts, or why an alert was triggered.\n"
            f"- **Forensic Analysis**: Ask about structuring, velocity shifts, mule networks, or AML red flags.\n"
            f"- **Consumer Safety**: Ask how to evaluate suspicious SMS/calls, dispute unauthorized payments, or freeze accounts.\n"
            f"- **Evidence Interpretation**: Ask me to break down observations vs inferences for any transaction cluster."
        )

    return AIChatResponse(
        reply=reply,
        engine_used="TRACE Grounded Intelligence Engine (Offline Rule & Evidence Fallback)",
        case_id=case_id,
        disclaimer="TRACE AI provides evidence summarization and decision-support. It does not declare guilt or replace human judgment.",
        suggestions=[
            "What triggered the highest priority case?",
            "How does TRACE detect money mule networks?",
            "What are the red flags for payment velocity spikes?",
        ],
    )
