from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException
from app.database import (
    add_investigation_note,
    get_case_history,
    get_investigation_notes,
    update_case_status,
)
from app.models.contracts import (
    Alert,
    CaseStatusUpdate,
    InvestigationNote,
    InvestigationNoteCreate,
    Transaction,
)
from app.store import store

router = APIRouter(tags=["Cases"])


@router.get("/cases/{case_id}")
def get_case_detail(case_id: str) -> Dict[str, Any]:
    alert = store.get_alert_by_case_id(case_id)
    if not alert:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found")

    transactions = store.get_transactions_for_case(case_id)
    notes = get_investigation_notes(case_id)
    history = get_case_history(case_id)

    return {
        "case_id": case_id,
        "alert": alert,
        "transactions": transactions,
        "notes": notes,
        "history": history,
    }


@router.get("/cases/{case_id}/notes", response_model=List[InvestigationNote])
def list_case_notes(case_id: str):
    return get_investigation_notes(case_id)


@router.post("/cases/{case_id}/notes", response_model=InvestigationNote)
def create_case_note(case_id: str, payload: InvestigationNoteCreate):
    if payload.case_id != case_id:
        payload.case_id = case_id
    note = add_investigation_note(payload)

    # Sync in-memory alert status if changed
    if payload.status_change:
        alert = store.get_alert_by_case_id(case_id)
        if alert:
            alert.investigation_status = payload.status_change

    return note


@router.post("/cases/{case_id}/status")
def change_case_status(case_id: str, payload: CaseStatusUpdate):
    if payload.case_id != case_id:
        payload.case_id = case_id

    result = update_case_status(payload)

    # Sync in-memory alert status
    alert = store.get_alert_by_case_id(case_id)
    if alert:
        alert.investigation_status = payload.status

    return result


@router.get("/cases/{case_id}/history")
def get_history(case_id: str):
    return get_case_history(case_id)
