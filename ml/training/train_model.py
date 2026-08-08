"""
Standalone trainer. Run this after you drop a real dataset (e.g. NSL-KDD,
CICIDS2017) into ml/datasets/. It expects a CSV with at least these columns:
packet_size, duration, src_bytes, dst_bytes, label (0=normal, 1=attack).

Usage:
    python train_model.py --data ../datasets/traffic.csv
"""
import argparse
import os

import joblib
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split

FEATURES = ["packet_size", "duration", "src_bytes", "dst_bytes"]
MODEL_OUT = os.path.join(os.path.dirname(__file__), "..", "models", "isolation_forest.pkl")


def main(data_path: str):
    df = pd.read_csv(data_path)
    missing = [c for c in FEATURES if c not in df.columns]
    if missing:
        raise ValueError(f"Dataset missing required columns: {missing}")

    X = df[FEATURES]
    y = df["label"] if "label" in df.columns else None

    if y is not None:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
    else:
        X_train, X_test = train_test_split(X, test_size=0.2, random_state=42)
        y_test = None

    model = IsolationForest(n_estimators=200, contamination=0.05, random_state=42)
    model.fit(X_train[y_train == 0] if y is not None else X_train)

    if y_test is not None:
        preds = model.predict(X_test)
        preds = [1 if p == -1 else 0 for p in preds]  # map -1/1 -> 1/0
        print(classification_report(y_test, preds, target_names=["normal", "attack"]))

    os.makedirs(os.path.dirname(MODEL_OUT), exist_ok=True)
    joblib.dump(model, MODEL_OUT)
    print(f"Model saved to {MODEL_OUT}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", required=True, help="Path to training CSV")
    args = parser.parse_args()
    main(args.data)
