from fastapi import APIRouter
from app.api.alerts import router as alerts_router
from app.api.cases import router as cases_router
from app.api.explain import router as explain_router
from app.api.health import router as health_router
from app.api.transactions import router as transactions_router
from app.api.upload import router as upload_router
from app.api.protect_me import router as protect_me_router
from app.api.auth import router as auth_router

api_router = APIRouter(prefix="/api")

api_router.include_router(health_router)
api_router.include_router(upload_router)
api_router.include_router(transactions_router)
api_router.include_router(alerts_router)
api_router.include_router(cases_router)
api_router.include_router(explain_router)
api_router.include_router(protect_me_router)
api_router.include_router(auth_router)

__all__ = ["api_router"]
