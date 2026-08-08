from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database.db import get_db
from app.models.models import Threat, User
from app.schemas.schemas import ThreatOut

router = APIRouter(prefix="/api/threats", tags=["Threats"])


@router.get("/", response_model=List[ThreatOut])
def list_threats(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return db.query(Threat).order_by(Threat.detected_at.desc()).all()
