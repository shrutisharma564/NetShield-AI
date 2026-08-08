# 🛡️ NetShield AI

### AI-Powered Network Anomaly Detection & Threat Monitoring System

NetShield AI is a full-stack cybersecurity platform that monitors network traffic, detects anomalous activity using Machine Learning, classifies detected threats using rule-based analysis, and provides real-time security monitoring through an interactive dashboard.

Built as part of the **Infosys Springboard 8-Week Internship Project**.

## 🚀 Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, Chart.js |
| Backend | FastAPI, Python, SQLAlchemy |
| Database | PostgreSQL |
| Machine Learning | Scikit-learn, Isolation Forest |
| Authentication | JWT, Role-Based Access Control |
| Real-Time Communication | WebSockets |
| Deployment | Docker, Docker Compose |

## ✨ Key Features

- 🔐 JWT authentication and role-based access control
- 🤖 ML-based network anomaly detection using Isolation Forest
- 🚨 Threat detection with attack-type classification
- ⚡ Real-time traffic monitoring using WebSockets
- 📊 Interactive security dashboard
- 🗺️ Threat visualization using a network threat map
- 📝 Audit logging for security-related activities
- 👥 Admin panel with user-role management
- 🌓 Light/Dark theme support
- 🐳 Docker Compose setup for local deployment


## 🔍 How It Works

NetShield AI follows a complete traffic-monitoring and threat-detection workflow:

1. **User Authentication**  
   Users authenticate using JWT-based authentication with role-based access control.

2. **Network Traffic Generation**  
   The system receives or generates network traffic samples containing features such as packet size, duration, source bytes, and destination bytes.

3. **Anomaly Detection**  
   The Machine Learning engine uses an **Isolation Forest** model to identify traffic that deviates from normal patterns.

4. **Threat Classification**  
   Detected anomalies are further analyzed using rule-based heuristics to identify possible attack categories such as:
   - DDoS
   - Port Scan
   - Data Exfiltration
   - Brute Force

5. **Alert Generation**  
   Suspicious traffic can generate threats and alerts with associated risk information and recommended actions.

6. **Real-Time Monitoring**  
   WebSockets continuously stream simulated traffic and detection results to the React dashboard without requiring constant polling.

7. **Security Administration**  
   Administrators can manage user roles and review security-related activities through the Admin Panel and audit logs.

> **ML Note:** The current Isolation Forest model is trained on synthetic normal traffic for standalone operation. The attack-type classification is heuristic/rule-based and should not be considered a trained multi-class attack classifier.


## 👥 Roles & Permissions

| Role | View Dashboard | Resolve Alerts | Manage Users | View Audit Log |
|---|---|---|---|---|
| Viewer | ✅ | ❌ | ❌ | ❌ |
| Analyst | ✅ | ✅ | ❌ | ❌ |
| Admin | ✅ | ✅ | ✅ | ✅ |

### Default Role Behavior

- The **first registered account** automatically becomes an `admin`.
- All subsequent accounts start as `viewer`.
- Admins can promote users to `analyst` or `admin`.
- Viewers have read-only access to the dashboard.
- Analysts and admins can resolve alerts.
- Only admins can manage user roles and access the audit log.

> **Tip:** Register the first account as the administrator, then create a second account to test viewer restrictions and role-based access control.


## 🐳 Installation & Setup

### Option A — Docker Compose (Recommended)

The easiest way to run the complete application locally is with Docker Compose.

```bash
cd docker
docker compose up --build

## 🚀 First Run Walkthrough

After starting the application, follow these steps to explore the main features.

### 1. Register the Administrator

Open:

```text
http://localhost:5173

## 🧠 Machine Learning Pipeline

NetShield AI currently uses an **Isolation Forest** anomaly detection model.

### Current Approach

The application is designed to work out of the box using synthetic normal network traffic. During the first run, the model can train on this baseline traffic and identify observations that significantly deviate from the learned pattern.

The model uses network traffic features including:

- `packet_size`
- `duration`
- `src_bytes`
- `dst_bytes`

### Real Dataset Training

The training pipeline can also be used with a real network intrusion-detection dataset.

Compatible datasets can be prepared with the following columns:

```text
packet_size
duration
src_bytes
dst_bytes
label


## 📂 Project Structure

```text
NetShield-AI/
├── backend/
│   ├── app/
│   │   ├── api/              # API routes
│   │   ├── core/             # Configuration and security
│   │   ├── database/         # Database connection
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   └── services/         # ML, traffic and WebSocket services
│   ├── .env.example          # Environment variable template
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── context/          # Authentication and theme state
│   │   ├── hooks/            # Custom React hooks
│   │   ├── pages/            # Application pages
│   │   └── services/         # API communication
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.ts
│
├── ml/
│   └── training/
│       └── train_model.py    # Model training pipeline
│
├── docker/
│   └── docker-compose.yml    # Multi-container local setup
│
├── docs/                     # Project documentation
├── .gitignore
└── README.md


## 🗺️ Project Roadmap

The project will continue to evolve throughout the 8-week internship.

### Completed

- [x] JWT authentication
- [x] Role-based access control
- [x] PostgreSQL network-log storage
- [x] Isolation Forest anomaly detection
- [x] Rule-based attack-type identification
- [x] Recommended security actions
- [x] Real-time traffic simulation
- [x] WebSocket-based live monitoring
- [x] Threat and alert management
- [x] Audit logging
- [x] Admin panel
- [x] Threat map visualization
- [x] Light/Dark theme
- [x] Docker Compose setup
- [x] Dashboard analytics

### Planned Improvements

- [ ] Train and evaluate the model using a real intrusion-detection dataset
- [ ] Add automated ML evaluation and benchmarking
- [ ] Add comprehensive backend and frontend tests
- [ ] Add GitHub Actions CI pipeline
- [ ] Improve threat intelligence and attack classification
- [ ] Add architecture and database diagrams
- [ ] Add application screenshots and demo documentation
- [ ] Improve deployment and production configuration

## ⚠️ Current Limitations

NetShield AI is currently designed as an internship/project prototype rather than a production network-security appliance.

Key limitations include:

- Traffic generation is simulated rather than collected from a live network.
- The bundled ML model uses synthetic normal traffic for standalone operation.
- Attack-type identification currently uses rule-based heuristics.
- Threat-map coordinates are illustrative and are not based on real GeoIP lookups.
- Production deployment would require additional security hardening, monitoring, scalability, and infrastructure configuration.

## 🧪 Testing

Automated testing is planned as part of the later internship phases.

The target testing stack includes:

- `pytest` for backend/API testing
- Frontend component testing
- Authentication and authorization tests
- ML pipeline validation
- WebSocket functionality tests

## 🤝 Contributing

This project is being developed as part of an academic/internship project.

Suggestions, bug reports, and improvements are welcome through GitHub Issues and Pull Requests.

## 📄 License

This project is currently intended for educational and internship purposes.