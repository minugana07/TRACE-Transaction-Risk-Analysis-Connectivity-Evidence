from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.models.contracts import Account, DetectionResult, Transaction
from app.store import store

router = APIRouter(tags=["Transactions"])


@router.get("/transactions", response_model=List[Transaction])
def list_transactions(
    account_id: Optional[str] = Query(None, description="Filter by sender or receiver ID"),
    channel: Optional[str] = Query(None, description="Filter by channel"),
    ids: Optional[str] = Query(None, description="Comma-separated transaction IDs"),
    limit: int = Query(100, ge=1, le=1000),
):
    txs = store.get_all_transactions()
    if ids:
        id_set = {i.strip() for i in ids.split(",") if i.strip()}
        return [tx for tx in txs if tx.id in id_set or tx.transactionId in id_set]
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


@router.get("/accounts/{account_id}", response_model=Account)
def get_account_detail(account_id: str):
    account = store.get_account(account_id)
    if not account:
        raise HTTPException(status_code=404, detail=f"Account '{account_id}' not found")
    return account


@router.get("/graph/connectivity/{root_account_id}")
def get_connectivity_graph(root_account_id: str, hops: int = Query(2, ge=1, le=5)) -> Dict[str, Any]:
    """Builds a real transaction connectivity graph centered on root_account_id."""
    all_txs = store.get_all_transactions()
    visited_accounts = {root_account_id}
    current_frontier = {root_account_id}
    graph_edges: List[Transaction] = []

    for _ in range(hops):
        next_frontier = set()
        for tx in all_txs:
            if tx.sender_id in current_frontier or tx.receiver_id in current_frontier:
                if tx not in graph_edges:
                    graph_edges.append(tx)
                next_frontier.add(tx.sender_id)
                next_frontier.add(tx.receiver_id)
        visited_accounts.update(next_frontier)
        current_frontier = next_frontier - visited_accounts

    nodes = [store.get_account(acc_id) for acc_id in visited_accounts if store.get_account(acc_id)]
    return {
        "nodes": nodes,
        "edges": graph_edges,
        "focusAccountId": root_account_id,
    }


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
