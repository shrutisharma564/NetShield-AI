from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database.db import get_db
from app.models.models import Alert, Threat, User
from app.schemas.schemas import MLMetrics, PredictRequest, PredictResponse
from app.services.audit_service import log_action
from app.services.ml_service import detector

router = APIRouter(prefix="/api/ml", tags=["AI Detection Engine"])


@router.post("/predict", response_model=PredictResponse)
def predict(
    payload: PredictRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prediction, confidence, risk_score, attack_type, recommended_action = detector.predict(
        payload.packet_size, payload.duration, payload.src_bytes, payload.dst_bytes
    )

    if prediction == "attack":
        threat = Threat(
            attack_type=attack_type,
            confidence=confidence,
            risk_score=risk_score,
        )
        db.add(threat)
        db.commit()
        db.refresh(threat)

        priority = "high" if risk_score > 75 else "medium" if risk_score > 40 else "low"
        alert = Alert(
            threat_id=threat.id,
            priority=priority,
            message=f"{attack_type.replace('_', ' ').title()} detected (risk score {risk_score:.1f})",
        )
        db.add(alert)
        db.commit()
        log_action(db, current_user, "threat_detected", f"{attack_type} risk={risk_score:.1f}")

    return PredictResponse(
        prediction=prediction,
        confidence=confidence,
        risk_score=risk_score,
        attack_type=attack_type,
        recommended_action=recommended_action,
    )


@router.get("/metrics", response_model=MLMetrics)
def ml_metrics(current_user: User = Depends(get_current_user)):
    return MLMetrics(
        model_type="IsolationForest",
        trained_at=detector.trained_at,
        training_samples=detector.training_samples,
        self_check_accuracy=detector.self_check_accuracy,
        note=(
            "Self-check accuracy is measured against synthetic data only — "
            "this model has not been trained or validated on real attack "
            "traffic. Train on CICIDS2017/UNSW-NB15 for a trustworthy figure."
        ),
    )
