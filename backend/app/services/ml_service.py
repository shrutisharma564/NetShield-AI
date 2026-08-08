"""
Anomaly detection + lightweight threat-intelligence service.

On first run this trains a small Isolation Forest on synthetic "normal"
network traffic and caches it to ml/models/isolation_forest.pkl. Replace
generate_training_data() with real Zeek/Wireshark-derived features when
you plug in a real dataset (see ml/training/train_model.py).

Since Isolation Forest is unsupervised (it only knows "normal" vs
"anomalous", not attack categories), attack_type is inferred with a simple
rule-of-thumb over the same features. This is intentionally lightweight —
swap it for a supervised classifier trained on a labeled dataset
(CICIDS2017/UNSW-NB15 both include attack-category labels) for anything
beyond a demo.
"""
import os
from datetime import datetime

import joblib
import numpy as np
from sklearn.ensemble import IsolationForest

MODEL_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "..", "ml", "models", "isolation_forest.pkl"
)
FEATURES = ["packet_size", "duration", "src_bytes", "dst_bytes"]

RECOMMENDED_ACTIONS = {
    "ddos": "Rate-limit or block the source IP; scale mitigation (WAF/CDN) if sustained.",
    "port_scan": "Flag source IP for monitoring; verify firewall rules on scanned ports.",
    "data_exfiltration": "Isolate the host, inspect outbound traffic, rotate credentials.",
    "brute_force": "Lock the targeted account temporarily; enforce MFA.",
    "anomalous_traffic": "Investigate manually; traffic doesn't match a known signature.",
    "normal": "No action needed.",
}


def classify_attack_type(packet_size: float, duration: float, src_bytes: float, dst_bytes: float) -> str:
    """Rule-of-thumb categorization, not a trained classifier — see module docstring."""
    if src_bytes > 20000 and duration < 0.5:
        return "ddos"
    if packet_size < 100 and duration < 0.2 and dst_bytes < 50:
        return "port_scan"
    if dst_bytes > 20000 and src_bytes < 500:
        return "data_exfiltration"
    if duration > 10 and packet_size < 200:
        return "brute_force"
    return "anomalous_traffic"


def generate_training_data(n_samples: int = 2000) -> np.ndarray:
    rng = np.random.default_rng(42)
    packet_size = rng.normal(500, 120, n_samples).clip(40, 1500)
    duration = rng.normal(2.0, 1.0, n_samples).clip(0, 30)
    src_bytes = rng.normal(3000, 800, n_samples).clip(0, None)
    dst_bytes = rng.normal(3000, 800, n_samples).clip(0, None)
    return np.column_stack([packet_size, duration, src_bytes, dst_bytes])


def generate_attack_samples(n_samples: int = 200) -> np.ndarray:
    """A few synthetic attack-shaped samples, used only for the self-check metric."""
    rng = np.random.default_rng(7)
    packet_size = rng.uniform(20, 60, n_samples)
    duration = rng.uniform(0, 0.3, n_samples)
    src_bytes = rng.uniform(30000, 80000, n_samples)
    dst_bytes = rng.uniform(0, 100, n_samples)
    return np.column_stack([packet_size, duration, src_bytes, dst_bytes])


class AnomalyDetector:
    def __init__(self):
        self.model = None
        self.trained_at = None
        self.training_samples = 0
        self.self_check_accuracy = 0.0
        self._load_or_train()

    def _load_or_train(self):
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        if os.path.exists(MODEL_PATH):
            bundle = joblib.load(MODEL_PATH)
            self.model = bundle["model"]
            self.trained_at = bundle["trained_at"]
            self.training_samples = bundle["training_samples"]
            self.self_check_accuracy = bundle["self_check_accuracy"]
        else:
            X_normal = generate_training_data()
            self.model = IsolationForest(
                n_estimators=200, contamination=0.05, random_state=42
            )
            self.model.fit(X_normal)
            self.trained_at = datetime.utcnow()
            self.training_samples = len(X_normal)
            self.self_check_accuracy = self._compute_self_check(X_normal)
            joblib.dump(
                {
                    "model": self.model,
                    "trained_at": self.trained_at,
                    "training_samples": self.training_samples,
                    "self_check_accuracy": self.self_check_accuracy,
                },
                MODEL_PATH,
            )

    def _compute_self_check(self, X_normal: np.ndarray) -> float:
        """
        Rough sanity metric: on held-out synthetic normal + synthetic attack
        samples, what fraction does the model classify correctly? This is
        NOT a real-world accuracy figure (the model has never seen real
        attack traffic) — it only confirms the model separates the two
        synthetic distributions it was given. Replace with a proper
        train/test split + classification_report once trained on a real
        labeled dataset (see ml/training/train_model.py).
        """
        X_attack = generate_attack_samples()
        normal_preds = self.model.predict(X_normal[-200:])  # 1 = normal
        attack_preds = self.model.predict(X_attack)  # -1 = anomaly (correct)
        correct = np.sum(normal_preds == 1) + np.sum(attack_preds == -1)
        total = len(normal_preds) + len(attack_preds)
        return float(correct / total)

    def predict(self, packet_size: float, duration: float, src_bytes: float, dst_bytes: float):
        X = np.array([[packet_size, duration, src_bytes, dst_bytes]])
        raw_score = self.model.decision_function(X)[0]  # higher = more normal
        is_outlier = self.model.predict(X)[0] == -1  # -1 = anomaly, 1 = normal

        # Map decision_function (~ -0.5..0.5) to a 0-100 risk score
        risk_score = float(np.clip((0.5 - raw_score) * 100, 0, 100))
        confidence = float(np.clip(abs(raw_score) * 2, 0, 1))

        prediction = "attack" if is_outlier else "normal"
        attack_type = (
            classify_attack_type(packet_size, duration, src_bytes, dst_bytes)
            if is_outlier
            else "normal"
        )
        recommended_action = RECOMMENDED_ACTIONS.get(
            attack_type, RECOMMENDED_ACTIONS["anomalous_traffic"]
        )
        return prediction, confidence, risk_score, attack_type, recommended_action


detector = AnomalyDetector()
