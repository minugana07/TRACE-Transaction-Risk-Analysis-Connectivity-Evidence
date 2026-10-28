from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.models.contracts import Alert
from app.store import store

router = APIRouter(tags=["Alerts"])


@router.get("/alerts", response_model=List[Alert])
def list_alerts(
    customer_id: Optional[str] = Query(None, description="Filter alerts by affected customer ID"),
    priority: Optional[str] = Query(None, description="Filter alerts by priority"),
    status: Optional[str] = Query(None, description="Filter alerts by investigation status"),
    search: Optional[str] = Query(None, description="Search filter for title, description, or accounts"),
    minRisk: Optional[float] = Query(None, description="Minimum risk score threshold"),
    maxRisk: Optional[float] = Query(None, description="Maximum risk score threshold"),
    sortBy: Optional[str] = Query(None, description="Sort field: riskScore, priority, createdAt, status"),
    sortDirection: Optional[str] = Query("desc", description="Sort direction: asc or desc"),
):
    alerts = store.get_all_alerts()

    if customer_id:
        alerts = [a for a in alerts if a.customer_id.lower() == customer_id.lower()]
    if priority:
        alerts = [a for a in alerts if a.priority.upper() == priority.upper()]
    if status:
        alerts = [a for a in alerts if (a.investigation_status.upper() == status.upper() or (a.status and a.status.upper() == status.upper()))]
    if search:
        s = search.lower()
        alerts = [
            a for a in alerts
            if s in a.title.lower() or s in a.summary.lower() or s in a.customer_id.lower() or s in a.case_id.lower()
        ]
    if minRisk is not None:
        alerts = [a for a in alerts if a.risk_score >= minRisk]
    if maxRisk is not None:
        alerts = [a for a in alerts if a.risk_score <= maxRisk]

    if sortBy:
        reverse = (sortDirection or "desc").lower() == "desc"
        if sortBy in ("riskScore", "risk_score"):
            alerts = sorted(alerts, key=lambda a: a.risk_score, reverse=reverse)
        elif sortBy in ("createdAt", "created_at"):
            alerts = sorted(alerts, key=lambda a: a.created_at, reverse=reverse)

    return alerts


@router.get("/alerts/{alert_id}", response_model=Alert)
def get_alert(alert_id: str):
    alert = store.get_alert_by_id(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert '{alert_id}' not found")
    return alert
