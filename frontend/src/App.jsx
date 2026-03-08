// ─────────────────────────────────────────────────────────────
// AgriSense Dashboard — Phase 6 Enhanced UI
//
// Font:   system-ui / -apple-system (exact Claude.ai stack)
//         + Geist Mono for numbers
// Colour: #090e09 near-black base, #16c181 luminous accent
//         Warm stone neutrals, semantic rose/blue/amber
// Motion: animated counters, page fade, card lift, shimmer
// Extra:  dot-grid CSS texture, top-edge glow on hover
// ─────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect, useRef } from "react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  getLatestReading, getSensorHistory, getCurrentWeather,
  getFullRecommendation, getWeeklySummary, postCropRecommendation
}
  from "./services/api";
import { usePolling, useFetch } from "./hooks/useApi";

// ── Tokens ────────────────────────────────────────────────────
const T = {
  bg: "#F4F9F4",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  cardHover: "#FFFFFF",
  overlay: "#FFFFFF",
  border: "#E2EFE2",
  borderLight: "#EDF4ED",

  accent: "#4A8C5C",
  accentDim: "#4A8C5C",
  accentSubtle: "#E8F3E8",

  secondary: "#7DB88A",
  secondarySubtle: "#E8F3E8",

  blue: "#3B82F6",
  blueSubtle: "rgba(59, 130, 246, 0.1)",
  amber: "#F59E0B",
  amberSubtle: "rgba(245, 158, 11, 0.1)",
  rose: "#EF4444",
  roseSubtle: "rgba(239, 68, 68, 0.1)",
  teal: "#14B8A6",
  tealSubtle: "rgba(20, 184, 166, 0.1)",
  tan: "#D2B48C",
  violet: "#8B5CF6",

  text: "#111111",
  textSub: "#374151",
  textMuted: "#6B7280",
  textDim: "#9CA3AF",
};

const F = {
  body: "'DM Sans', sans-serif",
  display: "'DM Serif Display', serif",
  mono: "'GeistMono', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
};

// ── Helpers ───────────────────────────────────────────────────
const fmt = (v, d = 1) => v == null ? "—" : Number(v).toFixed(d);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v ?? lo));
const ago = (iso) => {
  if (!iso) return "—";
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
};
const hhmm = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

// ── Animated counter ──────────────────────────────────────────
function useCountUp(target, dur = 800) {
  const [val, setVal] = useState(target);
  const prev = useRef(target);
  useEffect(() => {
    if (target == null || isNaN(target)) { setVal(target); return; }
    const start = prev.current ?? 0, diff = target - start;
    if (Math.abs(diff) < 0.01) return;
    const t0 = performance.now();
    const frame = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      setVal(start + diff * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(frame);
      else prev.current = target;
    };
    requestAnimationFrame(frame);
  }, [target, dur]);
  return val;
}

// ── Primitives ────────────────────────────────────────────────

function Card({ children, style = {}, accent, onClick, glow, padding = "20px 22px" }) {
  const [hov, setHov] = useState(false);
  const gc = accent || T.accent;
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? T.cardHover : T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 16, padding,
        transition: "all .2s",
        boxShadow: hov
          ? "0 8px 30px rgba(0,0,0,0.08)"
          : "0 2px 12px rgba(74, 140, 92, 0.08)",
        transform: hov && onClick ? "translateY(-2px)" : "none",
        cursor: onClick ? "pointer" : "default",
        position: "relative", overflow: "hidden", ...style
      }}>
      {children}
    </div>
  );
}

function Metric({ label, value, unit, color = T.accent, icon, sub, decimals = 1 }) {
  const [hov, setHov] = useState(false);
  const num = parseFloat(value);
  const counted = useCountUp(isNaN(num) ? null : num);
  const display = isNaN(num) ? (value ?? "—") : counted != null ? Number(counted).toFixed(decimals) : "—";
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding: "24px", borderRadius: 16,
        background: hov ? T.cardHover : T.card,
        border: `1px solid ${T.border}`,
        transition: "all .2s",
        boxShadow: hov ? "0 8px 30px rgba(0,0,0,0.08)" : "0 2px 12px rgba(74, 140, 92, 0.08)",
        position: "relative", overflow: "hidden"
      }}>
      <div style={{
        position: "absolute", left: 0, top: 0, right: 0, height: 3,
        background: color,
      }} />
      <div style={{
        fontSize: 11, color: T.textMuted, textTransform: "uppercase",
        letterSpacing: "0.12em", fontWeight: 600, marginBottom: 10
      }}>
        {icon && <span style={{ marginRight: 5 }}>{icon}</span>}{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
        <span style={{
          fontFamily: F.display, fontSize: 32, fontWeight: 700, color: T.text,
          lineHeight: 1, letterSpacing: "-.02em"
        }}>{display}</span>
        {unit && <span style={{ fontSize: 13, color: T.textMuted, fontWeight: 400 }}>{unit}</span>}
      </div>
      {sub && <div style={{ marginTop: 7, fontSize: 12, color: T.textMuted }}>{sub}</div>}
    </div>
  );
}

function ProgressBar({ value, max = 100, color = T.accent, height = 8 }) {
  const pct = clamp((value / max) * 100, 0, 100);
  return (
    <div style={{ height, borderRadius: height, background: "#E8F3E8", overflow: "hidden" }}>
      <div style={{
        height: "100%", borderRadius: height, width: `${pct}%`,
        background: T.accent,
        transition: "width .9s cubic-bezier(.4,0,.2,1)"
      }} />
    </div>
  );
}

function ConfRow({ label, value, color }) {
  const pct = Math.round((value || 0) * 100);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        {label && <span style={{ fontSize: 12, color: T.textMuted }}>{label}</span>}
        <span style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: F.mono, marginLeft: "auto" }}>{pct}%</span>
      </div>
      <ProgressBar value={pct} color={T.accent} />
    </div>
  );
}

function Badge({ text, color = T.accent, size = "sm" }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: size === "sm" ? "2px 8px" : "5px 12px", borderRadius: 20,
      background: `${color}15`,
      color, fontSize: size === "sm" ? 11 : 13, fontWeight: 600,
      letterSpacing: ".03em", whiteSpace: "nowrap"
    }}>{text}</span>
  );
}

function LiveDot() {
  return <span style={{
    display: "inline-block", width: 7, height: 7, borderRadius: "50%",
    background: T.accent, animation: "pulseDot 2s infinite",
    verticalAlign: "middle", marginRight: 6
  }} />;
}
function Divider({ style = {} }) {
  return <div style={{ height: 1, background: T.border, margin: "14px 0", ...style }} />;
}
function SHead({ title, sub, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
      <div>
        <h2 style={{
          fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.text,
          margin: 0, letterSpacing: "-.02em", lineHeight: 1.2
        }}>{title}</h2>
        {sub && <p style={{ margin: "5px 0 0", fontSize: 13, color: T.textMuted, lineHeight: 1.5 }}>{sub}</p>}
      </div>
      {right}
    </div>
  );
}
function Err({ msg }) {
  return msg ? <div style={{
    padding: "10px 16px", borderRadius: 10, marginBottom: 14,
    background: T.roseSubtle, border: `1px solid ${T.rose}35`,
    color: T.rose, fontSize: 13
  }}>⚠ {msg}</div> : null;
}
function Skeleton({ height = 80, radius = 12 }) {
  return <div style={{
    height, borderRadius: radius, background: T.card,
    backgroundImage: `linear-gradient(90deg,${T.card} 0%,${T.overlay} 40%,${T.card} 80%)`,
    backgroundSize: "200% 100%", animation: "shimmer 1.8s ease infinite"
  }} />;
}

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 12, padding: "11px 15px", boxShadow: "0 12px 40px rgba(0,0,0,.08)"
    }}>
      <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8, fontFamily: F.mono }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div style={{ width: 6, height: 6, borderRadius: 2, background: p.color }} />
          <span style={{ fontSize: 12, color: T.textSub, minWidth: 80 }}>{p.name}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: p.color, fontFamily: F.mono }}>
            {typeof p.value === "number" ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── Sidebar ───────────────────────────────────────────────────
const NAV = [
  { id: "overview", label: "Overview", icon: "▤" },
  { id: "sensors", label: "Sensor Live", icon: "◎" },
  { id: "ai", label: "AI Advisor", icon: "◈" },
  { id: "analytics", label: "Analytics", icon: "▦" },
  { id: "weather", label: "Weather", icon: "◌" },
];

function Sidebar({ page, setPage, health }) {
  const sys = [
    { label: "MongoDB Atlas", ok: health?.mongodb === "connected" },
    { label: "ML Engine", ok: health?.ml_models === "loaded" },
    { label: "Weather API", ok: health?.weather_api === "configured" },
  ];
  return (
    <aside style={{
      width: 230, flexShrink: 0, background: T.surface,
      borderRight: `1px solid ${T.border}`, display: "flex",
      flexDirection: "column", height: "100vh", position: "sticky", top: 0
    }}>
      <div style={{ padding: "22px 18px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: T.accentSubtle,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18
          }}>🌿</div>
          <div>
            <div style={{
              fontFamily: F.display, fontWeight: 700, fontSize: 17, color: T.text,
              lineHeight: 1.1, letterSpacing: "-.02em"
            }}>Major-Project</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Smart Agriculture</div>
          </div>
        </div>
      </div>
      <Divider style={{ margin: "0 18px 8px" }} />
      <nav style={{ flex: 1, padding: "0 10px" }}>
        {NAV.map(n => {
          const active = page === n.id;
          return (
            <NavBtn key={n.id} active={active} onClick={() => setPage(n.id)}>
              <span style={{
                width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "transparent",
                color: active ? T.surface : T.textMuted, fontSize: 13, transition: "all .2s"
              }}>{n.icon}</span>
              <span style={{
                fontSize: 14, fontWeight: active ? 600 : 400,
                color: active ? T.surface : T.textSub
              }}>{n.label}</span>
            </NavBtn>
          );
        })}
      </nav>
      <div style={{ padding: "14px 18px", borderTop: `1px solid ${T.border}` }}>
        <div style={{
          fontSize: 10, color: T.textDim, marginBottom: 10, textTransform: "uppercase",
          letterSpacing: ".09em", fontWeight: 700
        }}>System Status</div>
        {sys.map(s => (
          <div key={s.label} style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between", marginBottom: 8
          }}>
            <span style={{ fontSize: 12, color: T.textSub }}>{s.label}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                background: s.ok ? T.accent : T.rose,
                boxShadow: s.ok ? `0 0 8px ${T.accent}` : "none",
                animation: s.ok ? "pulseDot 3s infinite" : "none"
              }} />
              <span style={{ fontSize: 11, color: s.ok ? T.accent : T.rose, fontWeight: 500 }}>
                {s.ok ? "Online" : "Offline"}</span>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

function NavBtn({ active, onClick, children }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10,
        padding: "8px 10px", borderRadius: 10, marginBottom: 3,
        background: active ? T.accent : hov ? "#F0F7F1" : "transparent",
        border: "none", transition: "all .15s", cursor: "pointer", textAlign: "left"
      }}>
      {children}
    </button>
  );
}

// ── Overview Page ─────────────────────────────────────────────
function OverviewPage() {
  const { data: sensor, error: sErr } = usePolling(useCallback(() => getLatestReading(), []), 8000);
  const { data: hist } = usePolling(useCallback(() => getSensorHistory(45), []), 15000);
  const { data: weather } = usePolling(useCallback(() => getCurrentWeather(), []), 300000);
  const { data: rec } = usePolling(useCallback(() => getFullRecommendation(), []), 60000);

  const series = (hist?.readings || []).slice().reverse().map(r => ({
    t: hhmm(r.received_at), temp: r.temperature_c,
    hum: r.humidity_pct, mois: r.soil_moisture_pct,
  }));
  const uc = { low: T.accent, medium: T.amber, high: T.rose };
  const wIcon = c => ({
    Clear: "☀️", Clouds: "⛅", Rain: "🌧️", Drizzle: "🌦️",
    Thunderstorm: "⛈️", Mist: "🌫️"
  }[c] || "🌤️");

  return (
    <div>
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", marginBottom: 26
      }}>
        <div>
          <h1 style={{
            fontFamily: F.display, fontSize: 32, fontWeight: 400,
            color: T.text, margin: 0, letterSpacing: "-0.01em"
          }}>Farm Overview</h1>
          <p style={{
            margin: "5px 0 0", fontSize: 13, color: T.textMuted,
            display: "flex", alignItems: "center"
          }}>
            {sensor ? <><LiveDot />Live · updated {ago(sensor?.received_at)}</>
              : "Waiting for sensor data…"}
          </p>
        </div>
        {weather && (
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 16px", borderRadius: 14, background: T.card,
            border: `1px solid ${T.border}`, cursor: "default", transition: "border-color .2s"
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = T.borderLight}
            onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
            <span style={{ fontSize: 28 }}>{wIcon(weather.condition_main)}</span>
            <div>
              <div style={{
                fontFamily: F.mono, fontSize: 20, fontWeight: 700,
                color: T.text, lineHeight: 1
              }}>{fmt(weather.temperature_c)}°C</div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>
                {weather.city} · {weather.condition_desc}</div>
            </div>
          </div>
        )}
      </div>
      <Err msg={sErr} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
        <Metric label="Temperature" value={sensor?.temperature_c} decimals={1}
          unit="°C" color={T.rose} icon="🌡️"
          sub={sensor?.temperature_c > 35 ? "⚠ Heat stress" : "Normal range"} />
        <Metric label="Humidity" value={sensor?.humidity_pct} decimals={1}
          unit="%" color={T.blue} icon="💧"
          sub={`Updated ${ago(sensor?.received_at)}`} />
        <Metric label="Soil Moisture" value={sensor?.soil_moisture_pct} decimals={1}
          unit="%" color={T.accent} icon="🌱"
          sub={sensor?.moisture_level || "—"} />
        <Metric label="Soil pH" value={sensor?.ph_value} decimals={2}
          unit="pH" color={T.amber} icon="⚗️"
          sub={sensor?.ph_category || "—"} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.65fr 1fr", gap: 14, marginBottom: 14 }}>
        <Card>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 16
          }}>
            <div>
              <div style={{
                fontFamily: F.display, fontWeight: 600, fontSize: 15,
                color: T.text, letterSpacing: "-.01em"
              }}>Sensor Trends</div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Last 45 readings</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {[["Temp", T.rose], ["Moisture", T.accent], ["Humidity", T.blue]].map(([l, c]) => (
                <div key={l} style={{
                  display: "flex", alignItems: "center", gap: 4,
                  fontSize: 11, color: T.textSub
                }}>
                  <div style={{ width: 10, height: 2, background: c, borderRadius: 1 }} />{l}
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={195}>
            <AreaChart data={series} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                {[[T.rose, "gR"], [T.accent, "gG"], [T.blue, "gB"]].map(([c, id]) => (
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={c} stopOpacity={0.10} />
                    <stop offset="95%" stopColor={c} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderLight} vertical={false} />
              <XAxis dataKey="t" tick={{ fill: T.textDim, fontSize: 10 }}
                axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: T.textDim, fontSize: 10 }}
                axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="temp" name="Temp °C"
                stroke={T.rose} fill="url(#gR)" strokeWidth={1.8} dot={false} />
              <Area type="monotone" dataKey="mois" name="Moisture %"
                stroke={T.accent} fill="url(#gG)" strokeWidth={1.8} dot={false} />
              <Area type="monotone" dataKey="hum" name="Humidity %"
                stroke={T.blue} fill="url(#gB)" strokeWidth={1.5} dot={false}
                strokeDasharray="5 3" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card glow>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6,
              background: `${T.accent}20`, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 12, color: T.accent
            }}>◈</div>
            <span style={{
              fontFamily: F.display, fontWeight: 600, fontSize: 15,
              color: T.text, letterSpacing: "-.01em"
            }}>AI Snapshot</span>
            <Badge text="LIVE" color={T.accent} />
          </div>
          {rec ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {rec.crop && (
                <AISnip label="Recommended Crop" color={T.accent} icon="🌾">
                  <div style={{
                    fontFamily: F.display, fontSize: 19, fontWeight: 700,
                    color: T.text, textTransform: "capitalize", letterSpacing: "-.01em"
                  }}>
                    {rec.crop.crop}</div>
                  <ConfRow value={rec.crop.confidence} color={T.accent} />
                </AISnip>
              )}
              {rec.irrigation && (() => {
                const c = uc[rec.irrigation.urgency] || T.amber;
                return (
                  <AISnip label="Irrigation" color={c} icon="💧"
                    right={<Badge text={rec.irrigation.urgency} color={c} />}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text, textTransform: "capitalize" }}>
                      {rec.irrigation.action?.replace(/_/g, " ")}
                      {rec.irrigation.water_amount_mm &&
                        <span style={{ color: T.textMuted, fontWeight: 400, marginLeft: 6, fontSize: 12 }}>
                          · {rec.irrigation.water_amount_mm}mm</span>}
                    </div>
                    <ConfRow value={rec.irrigation.confidence} color={c} />
                  </AISnip>
                );
              })()}
              {rec.fertilizer && (
                <AISnip label="Fertilizer" color={T.amber} icon="🧪">
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>
                    {rec.fertilizer.fertilizer}</div>
                  <ConfRow value={rec.fertilizer.confidence} color={T.amber} />
                </AISnip>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Skeleton height={70} /><Skeleton height={70} /><Skeleton height={70} />
            </div>
          )}
        </Card>
      </div>
      <Card>
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 14
        }}>
          <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 15, color: T.text }}>
            Recent Readings</div>
          <Badge text="Auto-refresh 8s" color={T.accent} />
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr>
              {["Time", "Temp (°C)", "Humidity (%)", "Moisture (%)", "pH", "Status"].map(h => (
                <th key={h} style={{
                  padding: "8px 14px", textAlign: "left",
                  color: T.textDim, fontWeight: 600, fontSize: 10,
                  textTransform: "uppercase", letterSpacing: ".06em",
                  borderBottom: `1px solid ${T.border}`
                }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {(hist?.readings || []).slice(0, 8).map((r, i) => <TRow key={i} r={r} />)}
            </tbody>
          </table>
          {(!hist?.readings || hist.readings.length === 0) && (
            <div style={{
              padding: "28px 14px", textAlign: "center",
              color: T.textMuted, fontSize: 13
            }}>
              No readings yet — start your ESP32 to see data</div>
          )}
        </div>
      </Card>
    </div>
  );
}

function AISnip({ label, color, icon, children, right }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding: "16px", borderRadius: 12,
        background: hov ? "#F0F7F1" : "#F7FBF7",
        border: `1px solid ${T.border}`,
        transition: "all .2s"
      }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 7
      }}>
        <div style={{
          fontSize: 11, color: T.textMuted, textTransform: "uppercase",
          letterSpacing: "0.12em", fontWeight: 600
        }}>{icon} {label}</div>
        {right}
      </div>
      {children}
    </div>
  );
}

function TRow({ r }) {
  const [hov, setHov] = useState(false);
  return (
    <tr onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? `${T.accent}07` : "transparent", transition: "background .15s" }}>
      {[
        { v: hhmm(r.received_at), c: T.textSub },
        { v: fmt(r.temperature_c), c: T.rose },
        { v: fmt(r.humidity_pct), c: T.blue },
        { v: fmt(r.soil_moisture_pct), c: T.accent },
        { v: fmt(r.ph_value, 2), c: T.amber },
        { badge: true },
      ].map((cell, i) => (
        <td key={i} style={{
          padding: "9px 14px",
          borderBottom: `1px solid ${T.border}18`,
          color: cell.c, fontFamily: F.mono, fontSize: 13
        }}>
          {cell.badge
            ? <Badge text={r.has_errors ? "Error" : "OK"}
              color={r.has_errors ? T.rose : T.accent} />
            : cell.v}
        </td>
      ))}
    </tr>
  );
}

// ── Sensor Live Page ──────────────────────────────────────────
function SensorsPage() {
  const { data: sensor } = usePolling(useCallback(() => getLatestReading(), []), 8000);
  const { data: hist } = usePolling(useCallback(() => getSensorHistory(60), []), 15000);
  const readings = (hist?.readings || []).slice().reverse();
  const SENSORS = [
    { key: "temperature_c", label: "Temperature", unit: "°C", color: T.rose, icon: "🌡️", lo: 0, hi: 50 },
    { key: "humidity_pct", label: "Humidity", unit: "%", color: T.blue, icon: "💧", lo: 0, hi: 100 },
    { key: "soil_moisture_pct", label: "Soil Moisture", unit: "%", color: T.accent, icon: "🌱", lo: 0, hi: 100 },
    { key: "ph_value", label: "Soil pH", unit: "pH", color: T.amber, icon: "⚗️", lo: 0, hi: 14 },
  ];
  return (
    <div>
      <SHead title="Sensor Live Monitor" sub="ESP32 telemetry · auto-refreshes every 8 seconds" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
        {SENSORS.map(s => {
          const val = sensor?.[s.key];
          const pct = clamp(((val - s.lo) / (s.hi - s.lo)) * 100, 0, 100);
          const warn = s.key === "soil_moisture_pct" && (val || 0) < 30;
          return (
            <Card key={s.key} accent={warn ? T.rose : s.color} glow={warn}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", marginBottom: 10
              }}>
                <div style={{
                  fontSize: 11, color: T.textMuted, textTransform: "uppercase",
                  letterSpacing: ".06em", fontWeight: 600
                }}>{s.icon} {s.label}</div>
                {warn && <Badge text="LOW" color={T.rose} />}
              </div>
              <div style={{
                fontFamily: F.mono, fontSize: 40, fontWeight: 600, color: s.color,
                lineHeight: 1, marginBottom: 14, letterSpacing: "-.03em"
              }}>
                {fmt(val)}<span style={{
                  fontSize: 15, fontWeight: 400,
                  color: T.textMuted
                }}> {s.unit}</span>
              </div>
              <ProgressBar value={pct} color={s.color} height={5} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontSize: 10, color: T.textDim }}>{s.lo}</span>
                <span style={{ fontSize: 10, color: T.textDim }}>{s.hi} {s.unit}</span>
              </div>
            </Card>
          );
        })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {SENSORS.map(s => {
          const data = readings.map(r => ({ t: hhmm(r.received_at), v: r[s.key] }));
          return (
            <Card key={s.key}>
              <div style={{
                marginBottom: 12, display: "flex", justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div style={{
                  fontFamily: F.display, fontWeight: 600, fontSize: 14,
                  color: T.text, letterSpacing: "-.01em"
                }}>{s.icon} {s.label}</div>
                <span style={{ fontFamily: F.mono, fontSize: 19, fontWeight: 600, color: s.color }}>
                  {fmt(sensor?.[s.key])} <span style={{
                    fontSize: 12, fontWeight: 400,
                    color: T.textMuted
                  }}>{s.unit}</span>
                </span>
              </div>
              <ResponsiveContainer width="100%" height={130}>
                <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                  <XAxis dataKey="t" tick={{ fill: T.textDim, fontSize: 9 }}
                    axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: T.textDim, fontSize: 9 }}
                    axisLine={false} tickLine={false} domain={[s.lo, s.hi]} />
                  <Tooltip content={<ChartTip />} />
                  <Line type="monotone" dataKey="v" name={`${s.label} (${s.unit})`}
                    stroke={s.color} strokeWidth={2} dot={false}
                    activeDot={{ r: 5, fill: s.color, stroke: T.card, strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── AI Advisor Page ───────────────────────────────────────────
function AIPage() {
  const { data: rec, loading, error, refetch } =
    usePolling(useCallback(() => getFullRecommendation(), []), 0);
  const [form, setForm] = useState({ nitrogen: 60, phosphorus: 40, potassium: 40, ph: 6.5 });
  const [custom, setCustom] = useState(null);
  const [busy, setBusy] = useState(false);
  const uc = { low: T.accent, medium: T.amber, high: T.rose };
  const runCustom = async () => {
    setBusy(true);
    try { setCustom(await postCropRecommendation(form)); }
    catch (e) { alert(e.message); }
    finally { setBusy(false); }
  };

  function CHead({ label, color, badge }) {
    return (
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", marginBottom: 14
      }}>
        <div style={{
          fontSize: 11, color, textTransform: "uppercase",
          letterSpacing: ".08em", fontWeight: 700
        }}>{label}</div>
        <Badge text={badge} color={color} />
      </div>
    );
  }
  function TopM({ rank, label, pct, color }) {
    const [hov, setHov] = useState(false);
    return (
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "6px 0", paddingLeft: hov ? 4 : 0,
          borderBottom: `1px solid ${T.border}18`,
          transition: "padding-left .15s"
        }}>
        <span style={{ color: T.textSub, fontSize: 13, textTransform: "capitalize" }}>
          {["🥇", "🥈", "🥉"][rank]} {label}</span>
        <span style={{ color, fontFamily: F.mono, fontSize: 13, fontWeight: 700 }}>{pct}%</span>
      </div>
    );
  }

  return (
    <div>
      <SHead title="AI Advisor"
        sub="ML-powered crop, fertilizer & irrigation recommendations"
        right={
          <button onClick={refetch}
            style={{
              padding: "8px 16px", borderRadius: 9,
              background: T.accentSubtle, border: `1px solid ${T.accent}35`,
              color: T.accent, fontSize: 13, fontWeight: 600, cursor: "pointer",
              fontFamily: F.body, transition: "all .2s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = T.accent + "22"}
            onMouseLeave={e => e.currentTarget.style.background = T.accentSubtle}>
            ↺ Refresh</button>
        } />
      <Err msg={error} />
      {rec?.warnings?.map((w, i) => (
        <div key={i} style={{
          padding: "9px 14px", borderRadius: 9, marginBottom: 8,
          background: T.amberSubtle, border: `1px solid ${T.amber}30`,
          color: T.amber, fontSize: 12
        }}>💡 {w}</div>
      ))}
      {loading && !rec ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {[0, 1, 2].map(i => <Skeleton key={i} height={300} />)}
        </div>
      ) : rec && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 14 }}>
            {rec.crop && (
              <Card accent={T.accent}>
                <CHead label="🌾 Recommended Crop" color={T.accent} badge={rec.crop.confidence_pct} />
                <div style={{
                  fontFamily: F.display, fontSize: 28, fontWeight: 700, color: T.text,
                  textTransform: "capitalize", letterSpacing: "-.02em", lineHeight: 1.1, marginBottom: 14
                }}>
                  {rec.crop.crop}</div>
                <ConfRow label="Model confidence" value={rec.crop.confidence} color={T.accent} />
                <p style={{ color: T.textSub, fontSize: 13, lineHeight: 1.7, margin: "12px 0 14px" }}>
                  {rec.crop.advice}</p>
                <Divider />
                <div style={{
                  fontSize: 10, color: T.textDim, marginBottom: 8, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: ".07em"
                }}>Top 3 Matches</div>
                {rec.crop.top_3_crops?.map((c, i) =>
                  <TopM key={i} rank={i} label={c.label}
                    pct={Math.round(c.probability * 100)} color={T.accent} />)}
              </Card>
            )}
            {rec.irrigation && (() => {
              const c = uc[rec.irrigation.urgency] || T.teal;
              return (
                <Card accent={c}>
                  <CHead label="💧 Irrigation" color={c}
                    badge={rec.irrigation.urgency?.toUpperCase()} />
                  <div style={{
                    fontFamily: F.display, fontSize: 24, fontWeight: 700, color: T.text,
                    textTransform: "capitalize", letterSpacing: "-.02em", lineHeight: 1.2, marginBottom: 14
                  }}>
                    {rec.irrigation.action?.replace(/_/g, " ")}</div>
                  <ConfRow label="Model confidence" value={rec.irrigation.confidence} color={c} />
                  {rec.irrigation.water_amount_mm && (
                    <div style={{
                      margin: "14px 0", padding: "14px", borderRadius: 11,
                      background: `${c}12`, border: `1px solid ${c}25`, textAlign: "center"
                    }}>
                      <div style={{
                        fontFamily: F.mono, fontSize: 38, fontWeight: 600, color: c,
                        lineHeight: 1, letterSpacing: "-.03em"
                      }}>
                        {rec.irrigation.water_amount_mm}
                        <span style={{ fontSize: 14, fontWeight: 400, color: T.textMuted }}> mm</span>
                      </div>
                      <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>Recommended water</div>
                    </div>
                  )}
                  <p style={{ color: T.textSub, fontSize: 13, lineHeight: 1.7 }}>{rec.irrigation.advice}</p>
                </Card>
              );
            })()}
            {rec.fertilizer && (
              <Card accent={T.amber}>
                <CHead label="🧪 Fertilizer" color={T.amber} badge={rec.fertilizer.confidence_pct} />
                <div style={{
                  fontFamily: F.display, fontSize: 26, fontWeight: 700, color: T.text,
                  letterSpacing: "-.02em", lineHeight: 1.1, marginBottom: 14
                }}>
                  {rec.fertilizer.fertilizer}</div>
                <ConfRow label="Model confidence" value={rec.fertilizer.confidence} color={T.amber} />
                <p style={{ color: T.textSub, fontSize: 13, lineHeight: 1.7, margin: "12px 0 14px" }}>
                  {rec.fertilizer.advice}</p>
                {rec.fertilizer.npk_status && (<>
                  <Divider />
                  <div style={{
                    fontSize: 10, color: T.textDim, marginBottom: 8, fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: ".07em"
                  }}>NPK Status</div>
                  {Object.entries(rec.fertilizer.npk_status).map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
                      <span style={{ color: T.textSub, fontSize: 13, textTransform: "capitalize" }}>{k}</span>
                      <Badge text={v} color={v === "optimal" ? T.accent : v === "low" ? T.rose : T.amber} />
                    </div>
                  ))}
                </>)}
                <Divider />
                <div style={{
                  fontSize: 10, color: T.textDim, marginBottom: 8, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: ".07em"
                }}>Top 3</div>
                {rec.fertilizer.top_3_fertilizers?.map((f, i) =>
                  <TopM key={i} rank={i} label={f.label}
                    pct={Math.round(f.probability * 100)} color={T.amber} />)}
              </Card>
            )}
          </div>
          {(rec.sensor_data_used || rec.weather_data_used) && (
            <Card style={{ marginBottom: 14 }}>
              <div style={{
                fontWeight: 600, fontSize: 14, color: T.text, marginBottom: 12,
                letterSpacing: "-.01em"
              }}>Data Used for This Recommendation</div>
              <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
                {rec.sensor_data_used && Object.entries(rec.sensor_data_used).map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 3 }}>
                      {k.replace(/_/g, " ")}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.accent, fontFamily: F.mono }}>
                      {fmt(v, 2)}</div>
                  </div>
                ))}
                {rec.weather_data_used && <>
                  <div><div style={{ fontSize: 11, color: T.textMuted, marginBottom: 3 }}>weather temp</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.teal, fontFamily: F.mono }}>
                      {fmt(rec.weather_data_used.temperature_c, 1)}°C</div></div>
                  <div><div style={{ fontSize: 11, color: T.textMuted, marginBottom: 3 }}>est. rainfall</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.teal, fontFamily: F.mono }}>
                      {fmt(rec.weather_data_used.rainfall_monthly_mm, 0)}mm</div></div>
                </>}
              </div>
            </Card>
          )}
        </>
      )}
      <Card accent={T.violet}>
        <div style={{ marginBottom: 18 }}>
          <div style={{
            fontFamily: F.display, fontWeight: 700, fontSize: 16, color: T.text,
            marginBottom: 4, letterSpacing: "-.01em"
          }}>🔬 Custom Crop Advisor</div>
          <div style={{ fontSize: 13, color: T.textMuted }}>
            Enter soil NPK values manually for a tailored recommendation</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
          {[{ key: "nitrogen", label: "Nitrogen (N)", max: 200 },
          { key: "phosphorus", label: "Phosphorus (P)", max: 200 },
          { key: "potassium", label: "Potassium (K)", max: 200 },
          { key: "ph", label: "Soil pH", max: 14 }].map(f => (
            <div key={f.key}>
              <label style={{
                fontSize: 12, color: T.textMuted, display: "block",
                marginBottom: 6, fontWeight: 500
              }}>{f.label}</label>
              <input type="number" min={0} max={f.max} step="0.1"
                value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: parseFloat(e.target.value) || 0 }))}
                style={{
                  width: "100%", padding: "9px 12px", borderRadius: 9, boxSizing: "border-box",
                  background: T.surface, border: `1px solid ${T.border}`, color: T.text,
                  fontSize: 14, outline: "none", fontFamily: F.mono,
                  transition: "border-color .2s,box-shadow .2s"
                }}
                onFocus={e => {
                  e.target.style.borderColor = T.violet;
                  e.target.style.boxShadow = `0 0 0 3px ${T.violet}18`;
                }}
                onBlur={e => {
                  e.target.style.borderColor = T.border;
                  e.target.style.boxShadow = "none";
                }} />
            </div>
          ))}
        </div>
        <button onClick={runCustom} disabled={busy}
          style={{
            padding: "10px 24px", borderRadius: 9,
            background: busy ? T.surface : `${T.violet}20`,
            border: `1px solid ${busy ? T.border : T.violet + "50"}`,
            color: busy ? T.textMuted : T.violet, fontWeight: 600, fontSize: 14,
            cursor: busy ? "default" : "pointer", fontFamily: F.body, transition: "all .2s"
          }}
          onMouseEnter={e => !busy && (e.currentTarget.style.background = `${T.violet}30`)}
          onMouseLeave={e => !busy && (e.currentTarget.style.background = `${T.violet}20`)}>
          {busy ? "⟳ Analysing…" : "🌱 Get Crop Recommendation"}
        </button>
        {custom && (
          <div style={{
            marginTop: 16, padding: "16px", borderRadius: 11,
            background: T.accentSubtle, border: `1px solid ${T.accent}30`
          }}>
            <div style={{
              fontSize: 10, color: T.textMuted, textTransform: "uppercase",
              letterSpacing: ".08em", fontWeight: 700, marginBottom: 8
            }}>Result</div>
            <div style={{
              fontFamily: F.display, fontSize: 22, fontWeight: 700, color: T.text,
              textTransform: "capitalize", letterSpacing: "-.01em", marginBottom: 10
            }}>
              {custom.crop}</div>
            <ConfRow label="Confidence" value={custom.confidence} color={T.accent} />
            {custom.advice &&
              <p style={{ color: T.textSub, fontSize: 13, lineHeight: 1.7, marginTop: 8 }}>
                {custom.advice}</p>}
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Analytics Page ────────────────────────────────────────────
function AnalyticsPage() {
  const { data: weekly, loading } = useFetch(useCallback(() => getWeeklySummary(), []));
  const sums = weekly?.summaries || [];
  const charts = [
    { key: "temperature", label: "Temperature (°C)", color: T.rose },
    { key: "humidity", label: "Humidity (%)", color: T.blue },
    { key: "soil_moisture", label: "Soil Moisture (%)", color: T.accent },
    { key: "ph", label: "Soil pH", color: T.amber },
  ];
  return (
    <div>
      <SHead title="Weekly Analytics" sub="Daily min/avg/max from MongoDB Atlas — last 7 days" />
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
          {[0, 1, 2, 3].map(i => <Skeleton key={i} height={100} />)}
        </div>
      ) : sums.length > 0 && (() => {
        const l = sums[sums.length - 1];
        return (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
            {[
              {
                label: "Today Avg Temp", v: `${fmt(l.temperature?.avg)}°C`,
                lo: `${fmt(l.temperature?.min)}°`, hi: `${fmt(l.temperature?.max)}°`, color: T.rose
              },
              {
                label: "Humidity Avg", v: `${fmt(l.humidity?.avg)}%`,
                lo: `${fmt(l.humidity?.min)}%`, hi: `${fmt(l.humidity?.max)}%`, color: T.blue
              },
              {
                label: "Soil Moisture Avg", v: `${fmt(l.soil_moisture?.avg)}%`,
                lo: `${fmt(l.soil_moisture?.min)}%`, hi: `${fmt(l.soil_moisture?.max)}%`, color: T.accent
              },
              {
                label: "Average pH", v: `${fmt(l.ph?.avg, 2)}`,
                lo: `${fmt(l.ph?.min, 2)}`, hi: `${fmt(l.ph?.max, 2)}`, color: T.amber
              },
            ].map((s, i) => (
              <Card key={i} accent={s.color}>
                <div style={{
                  fontSize: 10, color: T.textMuted, textTransform: "uppercase",
                  letterSpacing: ".06em", fontWeight: 600, marginBottom: 8
                }}>{s.label}</div>
                <div style={{
                  fontFamily: F.mono, fontSize: 28, fontWeight: 600, color: s.color,
                  letterSpacing: "-.02em"
                }}>{s.v}</div>
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 6 }}>{s.lo} — {s.hi} range</div>
              </Card>
            ))}
          </div>
        );
      })()}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        {charts.map((c, idx) => {
          const data = sums.map(s => ({ date: (s.date || "").slice(5), avg: s[c.key]?.avg }));
          return (
            <Card key={idx}>
              <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{
                  fontFamily: F.display, fontWeight: 600, fontSize: 14,
                  color: T.text, letterSpacing: "-.01em"
                }}>{c.label}</div>
                <Badge text="7-day" color={c.color} />
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                  <defs>
                    <linearGradient id={`ga${idx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c.color} stopOpacity={0.10} />
                      <stop offset="95%" stopColor={c.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderLight} vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: T.textDim, fontSize: 10 }}
                    axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: T.textDim, fontSize: 10 }}
                    axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip />} />
                  <Area type="monotone" dataKey="avg" name={c.label}
                    stroke={c.color} fill={`url(#ga${idx})`} strokeWidth={2}
                    dot={{ fill: c.color, r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: c.color, stroke: T.card, strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          );
        })}
      </div>
      <Card>
        <div style={{
          fontFamily: F.display, fontWeight: 600, fontSize: 15, color: T.text,
          marginBottom: 14, letterSpacing: "-.01em"
        }}>7-Day Summary Table</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr>
              {["Date", "Readings", "Temp avg", "Humidity avg", "Moisture avg", "pH avg"].map(h => (
                <th key={h} style={{
                  padding: "8px 14px", textAlign: "left", color: T.textDim,
                  fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em",
                  borderBottom: `1px solid ${T.border}`
                }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {sums.map((s, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}18`, transition: "background .15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = `${T.accent}06`}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "9px 14px", color: T.text, fontWeight: 500, fontFamily: F.mono }}>{s.date}</td>
                  <td style={{ padding: "9px 14px", color: T.textMuted, fontFamily: F.mono }}>{s.total_readings}</td>
                  <td style={{ padding: "9px 14px", color: T.rose, fontFamily: F.mono }}>{fmt(s.temperature?.avg)}°C</td>
                  <td style={{ padding: "9px 14px", color: T.blue, fontFamily: F.mono }}>{fmt(s.humidity?.avg)}%</td>
                  <td style={{ padding: "9px 14px", color: T.accent, fontFamily: F.mono }}>{fmt(s.soil_moisture?.avg)}%</td>
                  <td style={{ padding: "9px 14px", color: T.amber, fontFamily: F.mono }}>{fmt(s.ph?.avg, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {sums.length === 0 && <div style={{
            padding: "28px 14px", textAlign: "center",
            color: T.textMuted, fontSize: 13
          }}>
            No weekly data yet — data accumulates as sensors collect readings</div>}
        </div>
      </Card>
    </div>
  );
}

// ── Weather Page ──────────────────────────────────────────────
function WeatherPage() {
  const { data: w, loading, error } =
    usePolling(useCallback(() => getCurrentWeather(), []), 300000);
  const wIcon = c => ({
    Clear: "☀️", Clouds: "☁️", Rain: "🌧️", Drizzle: "🌦️",
    Thunderstorm: "⛈️", Mist: "🌫️", Haze: "🌫️", Fog: "🌁"
  }[c] || "🌤️");
  return (
    <div>
      <SHead title="Weather Conditions"
        sub={`Live data for ${w?.city || "your city"} · refreshes every 5 minutes`} />
      <Err msg={error} />
      {loading && !w ? <Skeleton height={200} /> : w ? (
        <>
          <Card style={{ marginBottom: 14, background: `linear-gradient(135deg,${T.card},${T.overlay})` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 58, marginBottom: 12 }}>{wIcon(w.condition_main)}</div>
                <div style={{
                  fontFamily: F.mono, fontSize: 52, fontWeight: 600, color: T.text,
                  lineHeight: 1, letterSpacing: "-.04em"
                }}>{fmt(w.temperature_c)}°C</div>
                <div style={{ fontSize: 16, color: T.textSub, marginTop: 8, textTransform: "capitalize" }}>
                  {w.condition_desc}</div>
                <div style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>
                  {w.city}, {w.country} · Feels like {fmt(w.feels_like_c)}°C</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ marginBottom: 18 }}>
                  <div style={{
                    fontSize: 11, color: T.textMuted, marginBottom: 4,
                    textTransform: "uppercase", letterSpacing: ".06em"
                  }}>High</div>
                  <div style={{ fontFamily: F.mono, fontSize: 26, fontWeight: 600, color: T.rose }}>
                    {fmt(w.temp_max_c)}°</div>
                </div>
                <div>
                  <div style={{
                    fontSize: 11, color: T.textMuted, marginBottom: 4,
                    textTransform: "uppercase", letterSpacing: ".06em"
                  }}>Low</div>
                  <div style={{ fontFamily: F.mono, fontSize: 26, fontWeight: 600, color: T.blue }}>
                    {fmt(w.temp_min_c)}°</div>
                </div>
              </div>
            </div>
          </Card>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 14 }}>
            <Metric label="Humidity" value={w.humidity_pct} decimals={0} unit="%" color={T.blue} icon="💧" />
            <Metric label="Wind Speed" value={w.wind_speed_ms} decimals={1} unit="m/s" color={T.accent} icon="💨" />
            <Metric label="Pressure" value={w.pressure_hpa} decimals={0} unit="hPa" color={T.textSub} icon="🔵" />
            <Metric label="Cloud Cover" value={w.cloudiness_pct} decimals={0} unit="%" color={T.textSub} icon="☁️" />
            <Metric label="Rain (1h)" value={w.rainfall_1h_mm} decimals={1} unit="mm" color={T.teal} icon="🌧️" />
            <Metric label="Monthly Est." value={w.rainfall_monthly_mm} decimals={0} unit="mm" color={T.rose} icon="📅" />
          </div>
          <Card>
            <div style={{
              fontFamily: F.display, fontWeight: 600, fontSize: 15, color: T.text,
              marginBottom: 14, letterSpacing: "-.01em"
            }}>🌿 Agricultural Impact Assessment</div>
            {[
              {
                label: "Irrigation Need",
                value: w.rainfall_3h_mm > 5 ? "Low — recent rainfall sufficient" :
                  w.humidity_pct > 80 ? "Moderate — high humidity" : "High — dry conditions",
                color: w.rainfall_3h_mm > 5 ? T.accent : w.humidity_pct > 80 ? T.amber : T.rose
              },
              {
                label: "Crop Stress Risk",
                value: w.temperature_c > 35 ? "Heat stress — monitor crops" :
                  w.temperature_c < 10 ? "Cold stress — protect from frost" :
                    "Optimal temperature range",
                color: (w.temperature_c > 35 || w.temperature_c < 10) ? T.rose : T.accent
              },
              {
                label: "Disease Risk",
                value: w.humidity_pct > 85 ? "Elevated — fungal disease risk" :
                  "Low — routine monitoring",
                color: w.humidity_pct > 85 ? T.amber : T.accent
              },
            ].map((item, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", padding: "12px 14px", borderRadius: 10, marginBottom: 8,
                background: T.surface, border: `1px solid ${T.border}`,
                transition: "border-color .2s,background .2s", cursor: "default"
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = item.color + "45";
                  e.currentTarget.style.background = T.card;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = T.border;
                  e.currentTarget.style.background = T.surface;
                }}>
                <span style={{ color: T.textSub, fontSize: 13, fontWeight: 500 }}>{item.label}</span>
                <span style={{ color: item.color, fontSize: 13, fontWeight: 600 }}>{item.value}</span>
              </div>
            ))}
          </Card>
        </>
      ) : (
        <Card>
          <div style={{ textAlign: "center", padding: 52 }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>🌦️</div>
            <div style={{
              fontFamily: F.display, fontSize: 18, fontWeight: 600,
              color: T.text, marginBottom: 8
            }}>Weather API Not Configured</div>
            <div style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.7 }}>
              Add <code style={{
                background: T.surface, padding: "2px 7px", borderRadius: 6,
                color: T.accent, fontSize: 12
              }}>WEATHER_API_KEY</code> to your .env file</div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("overview");
  const { data: health } = usePolling(useCallback(() =>
    fetch("http://localhost:8000/health").then(r => r.json()).catch(() => null)
    , []), 30000);

  const PAGES = {
    overview: <OverviewPage />, sensors: <SensorsPage />,
    ai: <AIPage />, analytics: <AnalyticsPage />, weather: <WeatherPage />,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{font-size:16px;-webkit-font-smoothing:antialiased;
          -moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility}
        body{background:${T.bg};color:${T.text};font-family:${F.body};line-height:1.5}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:${T.surface}}
        ::-webkit-scrollbar-thumb{background:${T.border};border-radius:2px}
        ::-webkit-scrollbar-thumb:hover{background:${T.borderLight}}
        input,button{font-family:${F.body}}
        input:focus{outline:none}
        @keyframes pulseDot{
          0%  {box-shadow:0 0 0 0 ${T.accent}80}
          70% {box-shadow:0 0 0 6px ${T.accent}00}
          100%{box-shadow:0 0 0 0 ${T.accent}00}
        }
        @keyframes shimmer{
          0%  {background-position:-200% 0}
          100%{background-position:200% 0}
        }
        @keyframes fadeSlide{
          from{opacity:0;transform:translateY(8px)}
          to  {opacity:1;transform:translateY(0)}
        }
        .page-enter{animation:fadeSlide .22s cubic-bezier(.4,0,.2,1) both}
        main::before{
          content:"";position:fixed;inset:0;
          background-image:radial-gradient(${T.border} 1px,transparent 1px);
          background-size:28px 28px;opacity:.5;pointer-events:none;z-index:0;
        }
        main>*{position:relative;z-index:1}
      `}</style>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar page={page} setPage={setPage} health={health} />
        <main style={{
          flex: 1, padding: "30px 34px", overflowY: "auto",
          maxHeight: "100vh", background: T.bg, position: "relative"
        }}>
          <div className="page-enter" key={page}>
            {PAGES[page] || <OverviewPage />}
          </div>
        </main>
      </div>
    </>
  );
}
