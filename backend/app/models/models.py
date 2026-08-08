from datetime import datetime

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database.db import Base

# Role hierarchy, weakest to strongest. Kept as plain strings (not a DB enum)
# so new roles can be added without a migration.
ROLE_VIEWER = "viewer"
ROLE_ANALYST = "analyst"
ROLE_ADMIN = "admin"
VALID_ROLES = [ROLE_VIEWER, ROLE_ANALYST, ROLE_ADMIN]


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    # The very first user to register becomes admin (see api/auth.py);
    # everyone after that starts as viewer and gets promoted by an admin.
    role = Column(String, default=ROLE_VIEWER)
    created_at = Column(DateTime, default=datetime.utcnow)


class NetworkLog(Base):
    __tablename__ = "network_logs"

    id = Column(Integer, primary_key=True, index=True)
    source_ip = Column(String, nullable=False)
    destination_ip = Column(String, nullable=False)
    protocol = Column(String, nullable=False)
    packet_size = Column(Float, nullable=False)
    duration = Column(Float, default=0.0)
    src_bytes = Column(Float, default=0.0)
    dst_bytes = Column(Float, default=0.0)
    status = Column(String, default="normal")
    timestamp = Column(DateTime, default=datetime.utcnow)


class Threat(Base):
    __tablename__ = "threats"

    id = Column(Integer, primary_key=True, index=True)
    log_id = Column(Integer, ForeignKey("network_logs.id"), nullable=True)
    attack_type = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    risk_score = Column(Float, nullable=False)
    detected_at = Column(DateTime, default=datetime.utcnow)

    alerts = relationship("Alert", back_populates="threat")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    threat_id = Column(Integer, ForeignKey("threats.id"))
    priority = Column(String, default="medium")
    message = Column(String, nullable=False)
    status = Column(String, default="open")
    created_at = Column(DateTime, default=datetime.utcnow)

    threat = relationship("Threat", back_populates="alerts")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_email = Column(String, nullable=True)
    action = Column(String, nullable=False)  # e.g. "login", "alert_resolved"
    detail = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
