from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_roles
from app.database.db import get_db
from app.models.models import ROLE_ADMIN, ROLE_ANALYST, Alert, User
from app.schemas.schemas import AlertOut
from app.services.audit_service import log_action

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@router.get("/", response_model=List[AlertOut])
def list_alerts(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    # All roles (including viewer) can see alerts, just not resolve them.
    return db.query(Alert).order_by(Alert.created_at.desc()).all()


@router.patch("/{alert_id}/resolve", response_model=AlertOut)
def resolve_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ROLE_ADMIN, ROLE_ANALYST)),
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = "resolved"
    db.commit()
    db.refresh(alert)
    log_action(db, current_user, "alert_resolved", f"alert #{alert.id}")
    return alert
