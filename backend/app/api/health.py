from datetime import datetime, timezone
from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/health")
def get_health():
    return {
        "status": "healthy",
        "service": "TRACE Platform API",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
    }
