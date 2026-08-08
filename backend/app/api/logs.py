from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database.db import get_db
from app.models.models import NetworkLog, User
from app.schemas.schemas import NetworkLogCreate, NetworkLogOut

router = APIRouter(prefix="/api/logs", tags=["Network Logs"])


@router.get("/", response_model=List[NetworkLogOut])
def list_logs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(NetworkLog)
        .order_by(NetworkLog.timestamp.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.post("/", response_model=NetworkLogOut)
def create_log(
    log_in: NetworkLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log = NetworkLog(**log_in.dict())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
