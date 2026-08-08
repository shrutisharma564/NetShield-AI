import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("netshield_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

export interface NetworkLog {
  id: number;
  source_ip: string;
  destination_ip: string;
  protocol: string;
  packet_size: number;
  duration: number;
  src_bytes: number;
  dst_bytes: number;
  status: string;
  timestamp: string;
}

export interface Threat {
  id: number;
  log_id: number | null;
  attack_type: string;
  confidence: number;
  risk_score: number;
  detected_at: string;
}

export interface Alert {
  id: number;
  threat_id: number;
  priority: string;
  message: string;
  status: string;
  created_at: string;
}

export interface PredictResult {
  prediction: string;
  confidence: number;
  risk_score: number;
  attack_type?: string;
  recommended_action?: string;
}

export interface MLMetrics {
  model_type: string;
  trained_at: string;
  training_samples: number;
  self_check_accuracy: number;
  note: string;
}

export interface UserAccount {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface AuditLogEntry {
  id: number;
  user_id: number | null;
  user_email: string | null;
  action: string;
  detail: string | null;
  timestamp: string;
}

export const login = (email: string, password: string) =>
  api.post("/api/auth/login", { email, password });

export const register = (name: string, email: string, password: string) =>
  api.post("/api/auth/register", { name, email, password });

export const getMe = () => api.get("/api/auth/me");

export const logoutApi = () => api.post("/api/auth/logout");

export const getMlMetrics = () => api.get<MLMetrics>("/api/ml/metrics");

export const listUsers = () => api.get<UserAccount[]>("/api/users/");

export const updateUserRole = (userId: number, role: string) =>
  api.patch<UserAccount>(`/api/users/${userId}/role`, { role });

export const getAuditLogs = () => api.get<AuditLogEntry[]>("/api/audit/");

export const getLogs = () => api.get<NetworkLog[]>("/api/logs/");

export const createLog = (payload: Omit<NetworkLog, "id" | "status" | "timestamp">) =>
  api.post<NetworkLog>("/api/logs/", payload);

export const getThreats = () => api.get<Threat[]>("/api/threats/");

export const getAlerts = () => api.get<Alert[]>("/api/alerts/");

export const resolveAlert = (id: number) =>
  api.patch<Alert>(`/api/alerts/${id}/resolve`);

export const predict = (payload: {
  packet_size: number;
  duration: number;
  src_bytes: number;
  dst_bytes: number;
}) => api.post<PredictResult>("/api/ml/predict", payload);
