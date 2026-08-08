from sqlalchemy.orm import Session

from app.models.models import AuditLog, User


def log_action(db: Session, user: User | None, action: str, detail: str | None = None):
    entry = AuditLog(
        user_id=user.id if user else None,
        user_email=user.email if user else None,
        action=action,
        detail=detail,
    )
    db.add(entry)
    db.commit()
