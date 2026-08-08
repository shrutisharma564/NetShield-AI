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