from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


# ---------- Auth ----------
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class RoleUpdateRequest(BaseModel):
    role: str


class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int]
    user_email: Optional[str]
    action: str
    detail: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ---------- Network Logs ----------
class NetworkLogCreate(BaseModel):
    source_ip: str
    destination_ip: str
    protocol: str
    packet_size: float
    duration: float = 0.0
    src_bytes: float = 0.0
    dst_bytes: float = 0.0


class NetworkLogOut(NetworkLogCreate):
    id: int
    status: str
    timestamp: datetime

    class Config:
        from_attributes = True


# ---------- Threats ----------
class ThreatOut(BaseModel):
    id: int
    log_id: Optional[int]
    attack_type: str
    confidence: float
    risk_score: float
    detected_at: datetime

    class Config:
        from_attributes = True


class ThreatOrigin(BaseModel):
    """Simulated geolocation for the threat map, not a real GeoIP lookup."""
    ip: str
    country: str
    lat: float
    lon: float


# ---------- Alerts ----------
class AlertOut(BaseModel):
    id: int
    threat_id: int
    priority: str
    message: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- ML ----------
class PredictRequest(BaseModel):
    packet_size: float
    duration: float
    src_bytes: float
    dst_bytes: float


class PredictResponse(BaseModel):
    prediction: str
    confidence: float
    risk_score: float
    attack_type: Optional[str] = None
    recommended_action: Optional[str] = None


class MLMetrics(BaseModel):
    model_config = {"protected_namespaces": ()}

    model_type: str
    trained_at: datetime
    training_samples: int
    self_check_accuracy: float
    note: str
