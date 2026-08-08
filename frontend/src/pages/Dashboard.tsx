import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import Sidebar from "../components/Sidebar";
import ThreatMap from "../components/ThreatMap";
import { useAuth } from "../context/AuthContext";
import { useTrafficSocket } from "../hooks/useTrafficSocket";
import {
  Alert,
  MLMetrics,
  Threat,
  getAlerts,
  getMlMetrics,
  getThreats,
  predict,
  resolveAlert,
} from "../services/api";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const CAN_RESOLVE = ["admin", "analyst"];

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { feed, connected } = useTrafficSocket();

  const [threats, setThreats] = useState<Threat[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [metrics, setMetrics] = useState<MLMetrics | null>(null);
  const [form, setForm] = useState({
    packet_size: 500,
    duration: 2,
    src_bytes: 3000,
    dst_bytes: 3000,
  });
  const [result, setResult] = useState<{
    prediction: string;
    confidence: number;
    risk_score: number;
    attack_type?: string;
    recommended_action?: string;
  } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const loadData = async () => {
    const [t, a, m] = await Promise.all([getThreats(), getAlerts(), getMlMetrics()]);
    setThreats(t.data);
    setAlerts(a.data);
    setMetrics(m.data);
  };

  useEffect(() => {
    loadData();
    // Live feed pushes new threats/alerts via WebSocket, but we still poll
    // periodically to stay in sync in case a broadcast is missed.
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await predict(form);
      setResult(res.data);
      await loadData();
    } finally {
      setAnalyzing(false);
    }
  };

  const handleResolve = async (id: number) => {
    await resolveAlert(id);
    await loadData();
  };

  const openAlerts = alerts.filter((a) => a.status === "open");
  const priorityCounts = {
    high: openAlerts.filter((a) => a.priority === "high").length,
    medium: openAlerts.filter((a) => a.priority === "medium").length,
    low: openAlerts.filter((a) => a.priority === "low").length,
  };

  const today = new Date().toDateString();
  const threatsToday = threats.filter(
    (t) => new Date(t.detected_at).toDateString() === today
  ).length;
  const highRiskAlerts = alerts.filter((a) => a.priority === "high" && a.status === "open").length;
  const avgRisk = threats.length
    ? Math.round(threats.reduce((s, t) => s + t.risk_score, 0) / threats.length)
    : 0;

  const mapOrigins = feed
    .filter((f) => f.prediction === "attack")
    .slice(0, 15)
    .map((f, i) => ({
      key: `${f.source_ip}-${i}`,
      country: f.origin_country,
      lat: f.origin_lat,
      lon: f.origin_lon,
      risk_score: f.risk_score,
    }));

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8 space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Security Overview</h1>
            <p className="text-slate-400 text-sm">
              Real-time network anomaly detection & threat monitoring
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`w-2 h-2 rounded-full ${connected ? "bg-shield-ok" : "bg-shield-danger"}`}
            />
            {connected ? "Live feed connected" : "Reconnecting..."}
          </div>
        </header>

        {/* Stat cards */}
        <div className="grid grid-cols-5 gap-4">
          <StatCard label="Total Packets (live)" value={feed.length} color="text-shield-accent" />
          <StatCard label="Threats Today" value={threatsToday} color="text-shield-danger" />
          <StatCard label="High Risk Alerts" value={highRiskAlerts} color="text-shield-warn" />
          <StatCard label="Avg Risk Score" value={avgRisk} color="text-shield-accent" />
          <StatCard
            label="Self-Check Accuracy"
            value={metrics ? Math.round(metrics.self_check_accuracy * 100) : 0}
            suffix="%"
            color="text-shield-ok"
          />
        </div>
        {metrics && (
          <p className="text-xs text-slate-500 -mt-4">{metrics.note}</p>
        )}

        <div className="grid grid-cols-2 gap-6">
          {/* Analyze traffic panel */}
          <div className="bg-[var(--color-panel)] border border-[var(--color-border)] rounded-xl p-6">
            <h2 className="font-semibold mb-4">Analyze Traffic Sample</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {(
                [
                  ["packet_size", "Packet Size"],
                  ["duration", "Duration (s)"],
                  ["src_bytes", "Src Bytes"],
                  ["dst_bytes", "Dst Bytes"],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs text-slate-400 mb-1">{label}</label>
                  <input
                    type="number"
                    className="w-full bg-[var(--color-input)] border border-[var(--color-border)] rounded px-2 py-1 text-sm"
                    value={form[key]}
                    onChange={(e) =>
                      setForm({ ...form, [key]: Number(e.target.value) })
                    }
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="bg-shield-accent text-slate-900 font-semibold px-4 py-2 rounded text-sm disabled:opacity-50"
            >
              {analyzing ? "Analyzing..." : "Analyze"}
            </button>

            {result && (
              <div className="mt-4 p-4 rounded bg-[var(--color-input)] border border-[var(--color-border)]">
                <p>
                  Prediction:{" "}
                  <span
                    className={
                      result.prediction === "attack"
                        ? "text-shield-danger font-bold"
                        : "text-shield-ok font-bold"
                    }
                  >
                    {result.prediction.toUpperCase()}
                  </span>
                  {result.attack_type && result.attack_type !== "normal" && (
                    <span className="text-slate-400"> · {result.attack_type.replace(/_/g, " ")}</span>
                  )}
                </p>
                <p className="text-sm text-slate-400">
                  Confidence: {(result.confidence * 100).toFixed(1)}% · Risk score:{" "}
                  {result.risk_score.toFixed(1)}
                </p>
                {result.recommended_action && (
                  <p className="text-sm text-shield-accent mt-2">
                    → {result.recommended_action}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Alert priority chart */}
          <div className="bg-[var(--color-panel)] border border-[var(--color-border)] rounded-xl p-6">
            <h2 className="font-semibold mb-4">Open Alerts by Priority</h2>
            <Doughnut
              data={{
                labels: ["High", "Medium", "Low"],
                datasets: [
                  {
                    data: [priorityCounts.high, priorityCounts.medium, priorityCounts.low],
                    backgroundColor: ["#f87171", "#fbbf24", "#34d399"],
                  },
                ],
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Live traffic feed */}
          <div className="bg-[var(--color-panel)] border border-[var(--color-border)] rounded-xl p-6">
            <h2 className="font-semibold mb-4">Live Traffic Feed</h2>
            <div className="max-h-80 overflow-y-auto space-y-1 text-xs font-mono">
              {feed.length === 0 && (
                <p className="text-slate-500 text-sm font-sans">
                  Waiting for the first simulated packet (~every 2s)...
                </p>
              )}
              {feed.map((f, i) => (
                <div
                  key={i}
                  className={`flex justify-between px-2 py-1 rounded ${
                    f.prediction === "attack" ? "bg-shield-danger/10 text-shield-danger" : "text-slate-400"
                  }`}
                >
                  <span>
                    {f.source_ip} → {f.destination_ip} [{f.protocol}]
                  </span>
                  <span>{f.prediction === "attack" ? f.attack_type : "normal"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Threat map */}
          <div className="bg-[var(--color-panel)] border border-[var(--color-border)] rounded-xl p-6">
            <h2 className="font-semibold mb-4">Threat Origins</h2>
            <ThreatMap origins={mapOrigins} />
          </div>
        </div>

        {/* Risk score bar chart */}
        <div className="bg-[var(--color-panel)] border border-[var(--color-border)] rounded-xl p-6">
          <h2 className="font-semibold mb-4">Recent Threat Risk Scores</h2>
          <Bar
            data={{
              labels: threats.slice(0, 10).map((t) => `#${t.id}`),
              datasets: [
                {
                  label: "Risk score",
                  data: threats.slice(0, 10).map((t) => t.risk_score),
                  backgroundColor: "#22d3ee",
                },
              ],
            }}
            options={{ scales: { y: { beginAtZero: true, max: 100 } } }}
          />
        </div>

        {/* Recent alerts table */}
        <div className="bg-[var(--color-panel)] border border-[var(--color-border)] rounded-xl p-6">
          <h2 className="font-semibold mb-4">Recent Alerts</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-[var(--color-border)]">
                <th className="pb-2">Message</th>
                <th className="pb-2">Priority</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Created</th>
                {CAN_RESOLVE.includes(user?.role || "") && <th className="pb-2">Action</th>}
              </tr>
            </thead>
            <tbody>
              {alerts.slice(0, 10).map((a) => (
                <tr key={a.id} className="border-b border-[var(--color-border)]/50">
                  <td className="py-2">{a.message}</td>
                  <td className="py-2 capitalize">{a.priority}</td>
                  <td className="py-2 capitalize">{a.status}</td>
                  <td className="py-2 text-slate-400">
                    {new Date(a.created_at).toLocaleString()}
                  </td>
                  {CAN_RESOLVE.includes(user?.role || "") && (
                    <td className="py-2">
                      {a.status === "open" && (
                        <button
                          onClick={() => handleResolve(a.id)}
                          className="text-shield-accent text-xs hover:underline"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {alerts.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-500">
                    No alerts yet — analyze a traffic sample to generate one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number; color: string; suffix?: string }> = ({
  label,
  value,
  color,
  suffix,
}) => (
  <div className="bg-[var(--color-panel)] border border-[var(--color-border)] rounded-xl p-6">
    <p className="text-slate-400 text-sm mb-1">{label}</p>
    <p className={`text-3xl font-bold ${color}`}>
      {value}
      {suffix}
    </p>
  </div>
);

export default Dashboard;
