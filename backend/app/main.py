import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import alerts, audit, auth, logs, ml, threats, users, ws
from app.database.db import Base, engine
from app.services.traffic_loop import traffic_loop

Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(traffic_loop())
    yield
    task.cancel()


app = FastAPI(
    title="NetShield AI",
    description="AI-powered Network Anomaly Detection & Threat Monitoring System",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(logs.router)
app.include_router(threats.router)
app.include_router(alerts.router)
app.include_router(ml.router)
app.include_router(audit.router)
app.include_router(ws.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "NetShield AI backend"}


@app.get("/health")
def health():
    return {"status": "healthy"}
