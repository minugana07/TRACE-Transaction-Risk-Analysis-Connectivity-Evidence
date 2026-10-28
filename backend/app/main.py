import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import api_router
from app.database import init_db
from app.store import store

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("trace.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize SQLite tables and preload baseline dataset
    logger.info("Initializing TRACE SQLite database...")
    init_db()
    logger.info("Pre-loading default synthetic transaction dataset...")
    store.load_default_dataset()
    logger.info("TRACE Backend startup sequence complete.")
    yield
    logger.info("TRACE Backend shutting down.")


app = FastAPI(
    title="TRACE - Transaction Risk Analysis, Connectivity & Evidence",
    description="Unified fraud detection, case investigation, and consumer safety platform API.",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(api_router)


@app.get("/")
def root():
    return {
        "product": "TRACE",
        "description": "Transaction Risk Analysis, Connectivity & Evidence",
        "status": "online",
        "docs_url": "/docs",
        "api_prefix": "/api",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
