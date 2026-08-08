# NetShield AI

AI-powered Network Anomaly Detection & Threat Monitoring System built with FastAPI, React + TypeScript, PostgreSQL, and scikit-learn (Isolation Forest).

## What's included

- **JWT authentication** with **role-based access control** — the first person to register becomes `admin`; everyone after starts as `viewer`. Admins can promote users to `analyst` or `admin` from the Admin Panel. `viewer` = read-only, `analyst`/`admin` = can resolve alerts, `admin` = can manage roles and see the audit log.
- **Audit log** — login, logout, registration, role changes, and alert resolutions are all recorded and viewable at `/admin` (admin only).
- **Network log storage** — PostgreSQL via SQLAlchemy
- **AI anomaly detection engine** — Isolation Forest, auto-trains on synthetic traffic on first run so it works out of the box (`backend/app/services/ml_service.py`). Each detected anomaly now also gets a rule-based **attack type** (DDoS / port scan / data exfiltration / brute force) and a **recommended action** — see the module docstring in `ml_service.py` for the honest caveat: this is a heuristic, not a trained classifier.
- **Live traffic simulation over WebSockets** — a background loop (`backend/app/services/traffic_loop.py`) generates a simulated packet every ~2 seconds, runs it through the model, and broadcasts the result to any connected `/ws/traffic` client. The dashboard's "Live Traffic Feed" panel and "Threats Today" stat update from this in real time, no polling needed for that part.
- **Threat map** — plots simulated attack origins on a lightweight SVG map. This uses illustrative coordinates, not real GeoIP lookups (see caveat in `traffic_simulator.py`).
- **React + TypeScript dashboard** with Chart.js visualizations (risk scores, alert priority breakdown), extra summary cards (packets, threats today, high-risk alerts, avg risk, model self-check accuracy), and a light/dark theme toggle
- **Docker Compose** setup for one-command local run

## Roles at a glance

| Role | Can view dashboard | Can resolve alerts | Can manage users / see audit log |
|---|---|---|---|
| viewer | ✅ | ❌ | ❌ |
| analyst | ✅ | ✅ | ❌ |
| admin | ✅ | ✅ | ✅ |

The **first account you register becomes admin automatically** — do that one first, then register a second account to see viewer-mode restrictions in action, and promote it from the Admin Panel.

## Option A: Run with Docker (easiest)

```bash
cd docker
docker compose up --build
```

- Backend: http://localhost:8000 (docs at http://localhost:8000/docs)
- Frontend: http://localhost:5173
- Postgres: localhost:5432 (user/pass: postgres/postgres, db: netshield)

## Option B: Run manually (Windows)

### 1. Backend

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Edit `.env` and set `DATABASE_URL` to match your local PostgreSQL password (the one you set during install), e.g.:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/netshield
```

Create the database (one time):

```powershell
psql -U postgres -c "CREATE DATABASE netshield;"
```

Run the server:

```powershell
uvicorn app.main:app --reload
```

The API is now live at http://localhost:8000/docs (interactive Swagger UI — you can test every endpoint here).

### 2. Frontend

In a **new** terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## First run walkthrough

1. Open http://localhost:5173 → you'll land on the Login page.
2. Click **Register**, create an account. **This first account becomes admin.**
3. You're redirected to the Dashboard. Within ~2 seconds you should see the "Live Traffic Feed" panel start filling in — that's the simulated live stream running.
4. Use **Analyze Traffic Sample** — plug in packet size / duration / bytes and hit Analyze. Values far from typical (e.g. packet_size 9000, duration 0.01) will trigger an "attack" prediction with an attack type and recommended action, and auto-create a Threat + Alert you'll see update live on the dashboard.
5. Open **Admin Panel** (visible only to admins) to see the user list, change roles, and browse the audit log.
6. Register a second account in an incognito window — it'll start as `viewer` and won't be able to resolve alerts until an admin promotes it.
7. Toggle light/dark mode from the sidebar.

## Plugging in a real dataset

The bundled model trains on synthetic "normal" traffic so the app runs standalone. To use a real dataset (NSL-KDD, CICIDS2017, etc.):

1. Drop your CSV into `ml/datasets/` with columns `packet_size, duration, src_bytes, dst_bytes, label`.
2. Run:
   ```bash
   cd ml/training
   python train_model.py --data ../datasets/your_file.csv
   ```
3. Restart the backend — it will load the newly trained `ml/models/isolation_forest.pkl`.

## Project structure

```
NetShield-AI/
├── backend/         FastAPI app (auth, logs, threats, alerts, ML endpoint)
├── frontend/         React + TypeScript dashboard
├── ml/                     training scripts, datasets, saved models
├── docker/       docker-compose.yml
└── docs/                  architecture notes, screenshots
```

## Roadmap for the rest of the internship

This covers all 8 review points from the last check-in: real-dataset training pipeline (needs your own CICIDS2017/UNSW-NB15 download — see above), threat intelligence (attack type + recommended action), live traffic simulation + WebSockets, role-based access, audit logs, threat map, dark mode, and extra summary cards. Testing (pytest) and GitHub Actions CI are the two items from that list not yet added — good candidates for Week 7-8 polish.
