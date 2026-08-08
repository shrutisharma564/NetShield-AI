import React from "react";

interface ThreatOrigin {
  country: string;
  lat: number;
  lon: number;
  risk_score: number;
  key: string;
}

// Equirectangular-style projection onto a 0-100% box. Not real cartography —
// no coastline data is available in this environment — but the relative
// positions of countries are roughly right, which is enough to make the
// panel readable as "where is traffic coming from" at a glance.
const project = (lat: number, lon: number) => {
  const x = ((lon + 180) / 360) * 100;
  const y = ((90 - lat) / 180) * 100;
  return { x, y };
};

const ThreatMap: React.FC<{ origins: ThreatOrigin[] }> = ({ origins }) => {
  return (
    <div>
      <div className="relative w-full aspect-[2/1] rounded-lg overflow-hidden bg-[var(--color-input)] border border-[var(--color-border)]">
        {/* Simple lat/long grid to suggest a world map without real geodata */}
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 50" preserveAspectRatio="none">
          {Array.from({ length: 9 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 12.5} y1={0} x2={i * 12.5} y2={50} stroke="currentColor" strokeWidth="0.15" />
          ))}
          {Array.from({ length: 5 }).map((_, i) => (
            <line key={`h${i}`} x1={0} y1={i * 12.5} x2={100} y2={i * 12.5} stroke="currentColor" strokeWidth="0.15" />
          ))}
        </svg>

        {origins.map((o) => {
          const { x, y } = project(o.lat, o.lon);
          const color = o.risk_score > 75 ? "#f87171" : o.risk_score > 40 ? "#fbbf24" : "#34d399";
          return (
            <div
              key={o.key}
              className="absolute -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <span
                className="block w-2.5 h-2.5 rounded-full animate-pulse"
                style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
              />
              <div className="hidden group-hover:block absolute z-10 left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap text-xs bg-[var(--color-panel)] border border-[var(--color-border)] rounded px-2 py-1">
                {o.country} · risk {o.risk_score.toFixed(0)}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-slate-500 mt-2">
        Illustrative — origins are simulated for demo traffic, not real GeoIP lookups.
      </p>
    </div>
  );
};

export default ThreatMap;
