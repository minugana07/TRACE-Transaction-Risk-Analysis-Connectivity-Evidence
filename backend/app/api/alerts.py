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
):
    alerts = store.get_all_alerts()

    if customer_id:
        alerts = [a for a in alerts if a.customer_id.lower() == customer_id.lower()]
    if priority:
        alerts = [a for a in alerts if a.priority.upper() == priority.upper()]
    if status:
        alerts = [a for a in alerts if a.investigation_status.upper() == status.upper()]

    return alerts


@router.get("/alerts/{alert_id}", response_model=Alert)
def get_alert(alert_id: str):
    alert = store.get_alert_by_id(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert '{alert_id}' not found")
    return alert
