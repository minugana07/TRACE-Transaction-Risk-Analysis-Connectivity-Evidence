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


@router.get("/map/transactions")
def get_map_transactions():
    """
    Returns geographical transaction locations and automatically computed
    Impossible Travel velocity anomalies across consecutive sender transactions.
    """
    from app.detection.engine import haversine_km, parse_iso
    from datetime import timezone

    all_txs = store.get_all_transactions()
    alerts_map = {a.case_id: a for a in store.get_all_alerts()}

    locations = []
    anomalies = []

    for t in all_txs:
        g = t.geographic_data
        if not g or g.latitude is None or g.longitude is None:
            continue

        alert = alerts_map.get(f"CASE-{t.sender_id}") or alerts_map.get(f"CASE-GEO-{t.sender_id}")
        risk_score = alert.risk_score if alert else (85.0 if t.amount >= 50000 else 15.0)
        risk_band = alert.priority if alert else ("HIGH" if t.amount >= 50000 else "LOW")

        locations.append({
            "id": t.id,
            "sender_account": t.sender_id,
            "sender_name": t.sender_id,
            "recipient_name": t.receiver_id,
            "amount": t.amount,
            "currency": t.currency or "INR",
            "city": g.city or "Unknown",
            "country": g.country or "",
            "lat": g.latitude,
            "lng": g.longitude,
            "channel": t.channel,
            "timestamp": t.timestamp,
            "status": t.status,
            "risk_score": risk_score,
            "risk_band": risk_band,
            "explanation": alert.summary if alert else "Standard verified payment flow",
        })

    # Group transactions with valid coordinates by sender to detect impossible travel
    by_sender: Dict[str, List[Transaction]] = {}
    for t in all_txs:
        if t.geographic_data and t.geographic_data.latitude is not None and t.geographic_data.longitude is not None:
            by_sender.setdefault(t.sender_id, []).append(t)

    for sender_id, s_txs in by_sender.items():
        if len(s_txs) < 2:
            continue
        sorted_s = sorted(s_txs, key=lambda x: parse_iso(x.timestamp))
        for i in range(len(sorted_s) - 1):
            t1 = sorted_s[i]
            t2 = sorted_s[i + 1]
            g1 = t1.geographic_data
            g2 = t2.geographic_data

            d1 = parse_iso(t1.timestamp)
            d2 = parse_iso(t2.timestamp)
            diff_hours = abs((d2 - d1).total_seconds()) / 3600.0

            dist_km = haversine_km(g1.latitude, g1.longitude, g2.latitude, g2.longitude)
            if diff_hours < 3.0 and dist_km > 300.0:
                speed_kmh = dist_km / max(diff_hours, 0.05)
                if speed_kmh > 800.0:
                    anomalies.append({
                        "id": f"anom_{t1.id}_{t2.id}",
                        "sender_account": sender_id,
                        "sender_name": sender_id,
                        "from_city": g1.city or "Unknown",
                        "from_country": g1.country or "",
                        "from_coords": [g1.latitude, g1.longitude],
                        "to_city": g2.city or "Unknown",
                        "to_country": g2.country or "",
                        "to_coords": [g2.latitude, g2.longitude],
                        "distance_km": round(dist_km, 1),
                        "time_elapsed_minutes": round(diff_hours * 60, 1),
                        "implied_speed_kmh": round(speed_kmh, 1),
                        "t1_id": t1.id,
                        "t2_id": t2.id,
                        "severity": "CRITICAL" if speed_kmh > 1500 else "HIGH",
                    })

    return {
        "locations": locations,
        "anomalies": anomalies,
        "summary": {
            "total_points": len(locations),
            "impossible_travel_count": len(anomalies),
        },
    }


@router.get("/map/anomalies")
def get_map_anomalies():
    """Returns detected impossible travel velocity anomalies."""
    res = get_map_transactions()
    return res["anomalies"]

