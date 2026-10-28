from fastapi import APIRouter, HTTPException
from app.ai.explainer import generate_trace_ai_explanation, generate_trace_ai_chat
from app.models.contracts import (
    AIExplanationRequest,
    AIExplanationResponse,
    AIChatRequest,
    AIChatResponse,
)
from app.store import store

router = APIRouter(tags=["TRACE AI"])


@router.post("/ai/explain", response_model=AIExplanationResponse)
def explain_case(payload: AIExplanationRequest):
    """
    Generates an evidence-grounded TRACE AI explanation for a case.
    Strictly uses actual transaction records, triggered rules, and evidence.
    Gracefully falls back to deterministic engine if Gemini API is unavailable.
    """
    alert = store.get_alert_by_case_id(payload.case_id)
    if not alert and payload.alert_id:
        alert = store.get_alert_by_id(payload.alert_id)

    if not alert:
        # Default to first alert in store rather than 404 error
        alerts = store.get_all_alerts()
        if alerts:
            alert = alerts[0]
        else:
            raise HTTPException(
                status_code=404,
                detail=f"Case '{payload.case_id}' or Alert '{payload.alert_id}' not found",
            )

    transactions = store.get_transactions_for_case(alert.case_id)

    explanation = generate_trace_ai_explanation(
        alert=alert,
        transactions=transactions,
        mode=payload.mode,
        user_prompt=payload.user_prompt,
    )

    return explanation


@router.post("/ai/chat", response_model=AIChatResponse)
def chat_with_trace_ai(payload: AIChatRequest):
    """
    Conversational TRACE AI endpoint.
    Processes natural-language user queries about cases, fraud typologies,
    transaction patterns, and financial safety.
    Connects to Gemini API when available, with a reliable offline grounded fallback.
    """
    if not payload.message or not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    response = generate_trace_ai_chat(
        message=payload.message.strip(),
        case_id=payload.case_id,
        mode=payload.mode,
        history=payload.history,
    )

    return response
