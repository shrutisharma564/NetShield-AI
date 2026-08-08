from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import require_roles
from app.database.db import get_db
from app.models.models import ROLE_ADMIN, AuditLog, User
from app.schemas.schemas import AuditLogOut

router = APIRouter(prefix="/api/audit", tags=["Audit Log"])


@router.get("/", response_model=List[AuditLogOut])
def list_audit_logs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(ROLE_ADMIN)),
):
    return (
        db.query(AuditLog)
        .order_by(AuditLog.timestamp.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
