from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.core.security import decode_access_token
from app.database.db import SessionLocal
from app.models.models import User
from app.services.ws_manager import manager

router = APIRouter(tags=["Live Traffic"])


def _authenticate(token: str | None) -> User | None:
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None
    db = SessionLocal()
    try:
        return db.query(User).filter(User.email == payload.get("sub")).first()
    finally:
        db.close()


@router.websocket("/ws/traffic")
async def traffic_stream(websocket: WebSocket, token: str | None = Query(default=None)):
    """
    Live traffic feed. Connect with ?token=<JWT>. Any authenticated role
    (viewer/analyst/admin) can watch; the backend broadcasts a new
    simulated packet + prediction roughly every 2 seconds via the
    background loop in app/main.py.
    """
    user = _authenticate(token)
    if not user:
        await websocket.close(code=4401)
        return

    await manager.connect(websocket)
    try:
        while True:
            # We don't expect the client to send anything meaningful; this
            # just keeps the connection open and lets us detect disconnects.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
