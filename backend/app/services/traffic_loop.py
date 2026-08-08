import asyncio

from app.database.db import SessionLocal
from app.models.models import Alert, NetworkLog, Threat
from app.services.ml_service import detector
from app.services.traffic_simulator import generate_traffic_sample
from app.services.ws_manager import manager


async def traffic_loop(interval_seconds: float = 2.0):
    """
    Runs for the lifetime of the app. Every `interval_seconds` it:
      1. generates a simulated traffic sample
      2. runs it through the anomaly detector
      3. persists a NetworkLog row (and Threat/Alert rows if anomalous)
      4. broadcasts the result to every connected /ws/traffic client
    """
    while True:
        await asyncio.sleep(interval_seconds)
        sample = generate_traffic_sample()

        prediction, confidence, risk_score, attack_type, recommended_action = detector.predict(
            sample["packet_size"], sample["duration"], sample["src_bytes"], sample["dst_bytes"]
        )

        db = SessionLocal()
        try:
            log = NetworkLog(
                source_ip=sample["source_ip"],
                destination_ip=sample["destination_ip"],
                protocol=sample["protocol"],
                packet_size=sample["packet_size"],
                duration=sample["duration"],
                src_bytes=sample["src_bytes"],
                dst_bytes=sample["dst_bytes"],
                status=prediction,
            )
            db.add(log)
            db.commit()
            db.refresh(log)

            threat_payload = None
            alert_payload = None

            if prediction == "attack":
                threat = Threat(
                    log_id=log.id,
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
                    message=f"{attack_type.replace('_', ' ').title()} from {sample['source_ip']} "
                    f"({sample['origin_country']}), risk {risk_score:.1f}",
                )
                db.add(alert)
                db.commit()
                db.refresh(alert)

                threat_payload = {
                    "id": threat.id,
                    "attack_type": threat.attack_type,
                    "confidence": threat.confidence,
                    "risk_score": threat.risk_score,
                    "detected_at": threat.detected_at,
                }
                alert_payload = {
                    "id": alert.id,
                    "priority": alert.priority,
                    "message": alert.message,
                    "status": alert.status,
                    "created_at": alert.created_at,
                }
        finally:
            db.close()

        await manager.broadcast(
            {
                "type": "traffic",
                "traffic": {
                    **sample,
                    "prediction": prediction,
                    "risk_score": risk_score,
                    "attack_type": attack_type,
                    "recommended_action": recommended_action,
                },
                "threat": threat_payload,
                "alert": alert_payload,
            }
        )
