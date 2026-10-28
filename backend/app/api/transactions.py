from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.models.contracts import DetectionResult, Transaction
from app.store import store

router = APIRouter(tags=["Transactions"])


@router.get("/transactions", response_model=List[Transaction])
def list_transactions(
    account_id: Optional[str] = Query(None, description="Filter by sender or receiver ID"),
    channel: Optional[str] = Query(None, description="Filter by channel"),
    limit: int = Query(100, ge=1, le=1000),
):
    txs = store.get_all_transactions()
    if account_id:
        txs = [tx for tx in txs if tx.sender_id == account_id or tx.receiver_id == account_id]
    if channel:
        txs = [tx for tx in txs if tx.channel.upper() == channel.upper()]
    return txs[:limit]


@router.get("/transactions/{tx_id}", response_model=Transaction)
def get_transaction(tx_id: str):
    tx = store.get_transaction(tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail=f"Transaction '{tx_id}' not found")
    return tx


@router.post("/detection/run", response_model=DetectionResult)
def run_detection():
    """Forces re-evaluation of detection rules over currently loaded transactions."""
    from app.detection.engine import default_detection_engine
    txs = store.get_all_transactions()
    res = default_detection_engine.run(txs)
    store.detection_result = res
    store.alerts_by_id = {a.id: a for a in res.alerts}
    store.alerts_by_case_id = {a.case_id: a for a in res.alerts}
    return res
