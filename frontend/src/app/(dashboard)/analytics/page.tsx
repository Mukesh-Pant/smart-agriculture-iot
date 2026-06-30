"use client";
import { useCallback, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { T, F, Card, Badge, ChartTip, fmt, Skeleton } from "../_components/DashboardComponents";
import { useFetch } from "@/app/hooks/useApi";
import { getTrends } from "@/app/services/api";
import {
  Thermometer, Droplets, Waves, FlaskConical, BarChart3, CalendarDays,
  Clock, TrendingUp, type LucideIcon,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────
interface MetricStat { avg: number | null; min: number | null; max: number | null; }
interface TrendPoint {
  bucket: string;
  total_readings: number;
  temperature?: MetricStat;
  humidity?: MetricStat;
  soil_moisture?: MetricStat;
  ph?: MetricStat;
}
interface TrendResponse {
  range: string;
  granularity: string;
  bucket_unit: string;
  start: string;
  end: string;
  total_readings: number;
  buckets: number;
  summary: {
    temperature: MetricStat; humidity: MetricStat;
    soil_moisture: MetricStat; ph: MetricStat;
  };
  points: TrendPoint[];
}

type MetricKey = "temperature" | "humidity" | "soil_moisture" | "ph";

const RANGES: Array<{ key: string; label: string }> = [
  { key: "48h", label: "48 Hours" },
  { key: "7d",  label: "7 Days" },
  { key: "15d", label: "15 Days" },
  { key: "1m",  label: "1 Month" },
  { key: "3m",  label: "3 Months" },
  { key: "6m",  label: "6 Months" },
];

const METRICS: Array<{ key: MetricKey; label: string; unit: string; color: string; icon: LucideIcon }> = [
  { key: "temperature",   label: "Temperature",   unit: "°C",  color: T.rose,   icon: Thermometer },
  { key: "humidity",      label: "Humidity",      unit: "%",   color: T.blue,   icon: Droplets },
  { key: "soil_moisture", label: "Soil Moisture", unit: "%",   color: T.accent, icon: Waves },
  { key: "ph",            label: "Soil pH",       unit: "pH",  color: T.amber,  icon: FlaskConical },
];

// ── Bucket label formatting (adapts to granularity) ───────────
function fmtLabel(iso: string, granularity: string): string {
  const d = new Date(iso.endsWith("Z") || /[+-]\d{2}:?\d{2}$/.test(iso) ? iso : `${iso}Z`);
  if (isNaN(d.getTime())) return iso;
  if (granularity === "hourly") {
    return `${String(d.getHours()).padStart(2, "0")}:00`;
  }
  // daily / weekly → "Mon DD"
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<string>("7d");

  const { data, loading, error } = useFetch(
    useCallback(() => getTrends(range), [range])
  ) as { data: TrendResponse | null; loading: boolean; error: any };

  const points = data?.points ?? [];
  const summary = data?.summary;
  const granularity = data?.granularity ?? "daily";
  const rangeLabel = RANGES.find(r => r.key === range)?.label ?? range;

  // Access gate: if the backend denied access (no device assigned, etc),
  // show a clear message instead of an empty/zeroed-out analytics UI.
  const noAccess =
    !loading &&
    typeof error === "string" &&
    (error.toLowerCase().includes("device") ||
      error.toLowerCase().includes("access") ||
      error.toLowerCase().includes("login") ||
      error.toLowerCase().includes("auth"));

  if (noAccess) {
    return (
      <div style={{ backgroundColor: T.bg, minHeight: "100vh", padding: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ maxWidth: 460, textAlign: "center", background: T.surface, border: `1px dashed ${T.border}`, borderRadius: 20, padding: "40px 32px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: `${T.amber}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BarChart3 size={26} color={T.amber} />
            </div>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 8 }}>
            No device assigned
          </h2>
          <p style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.6 }}>
            {error}
          </p>
          <p style={{ fontSize: 13, color: T.textMuted, marginTop: 12 }}>
            Analytics become available once an administrator assigns a sensor
            device to your account.
          </p>
        </div>
      </div>
    );
  }

  const metricCards = METRICS.map(m => ({
    ...m,
    value: summary?.[m.key]?.avg ?? undefined,
    min:   summary?.[m.key]?.min ?? undefined,
    max:   summary?.[m.key]?.max ?? undefined,
  }));

  return (
    <div style={{ backgroundColor: T.bg, minHeight: "100vh", padding: "24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 700, color: T.text, marginBottom: "4px", letterSpacing: "-0.02em" }}>
              {getGreeting()},
            </h1>
            <p style={{ fontSize: "clamp(12px, 2vw, 14px)", color: T.textMuted, display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: T.accent, animation: "pulseDot 2s infinite" }} />
              <span>{rangeLabel} trends · {granularity} buckets · from MongoDB</span>
            </p>
          </div>

          {/* Date range badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", backgroundColor: T.surface, borderRadius: "12px", border: `1px solid ${T.border}` }}>
            <CalendarDays size={15} color={T.textMuted} />
            <span style={{ fontSize: "13px", fontWeight: 500, color: T.text }}>
              {data ? `${(data.start || "").slice(0, 10)} — ${(data.end || "").slice(0, 10)}` : "—"}
            </span>
          </div>
        </div>

        {/* Range selector */}
        <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
          {RANGES.map(r => {
            const active = range === r.key;
            return (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 16px", borderRadius: 10,
                  border: `1.5px solid ${active ? T.accent : T.border}`,
                  background: active ? `${T.accent}12` : T.surface,
                  color: active ? T.accent : T.textMuted,
                  fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                }}
              >
                {r.key === "48h" ? <Clock size={14} /> : <TrendingUp size={14} />} {r.label}
              </button>
            );
          })}
        </div>

        {/* Quick stats */}
        <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginTop: "20px", width: "100%" }}>
          {[
            { label: "Total Readings", value: loading ? "…" : (data?.total_readings ?? 0).toLocaleString(), color: T.text },
            { label: granularity === "hourly" ? "Hours of Data" : granularity === "weekly" ? "Weeks of Data" : "Days of Data", value: loading ? "…" : (data?.buckets ?? 0), color: T.accent },
            { label: "Window", value: rangeLabel, color: T.text },
          ].map((s, i) => (
            <div key={i} style={{ padding: "16px", backgroundColor: T.surface, borderRadius: "16px", border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: "13px", color: T.textMuted, marginBottom: "4px" }}>{s.label}</div>
              <div style={{ fontSize: "22px", fontWeight: 600, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: T.text, marginBottom: "16px", letterSpacing: "-0.01em" }}>
          {rangeLabel} Summary
        </h2>
        <div className="summary-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
          {loading
            ? [0, 1, 2, 3].map(i => <Skeleton key={i} height={120} radius={16} />)
            : metricCards.map((m, i) => {
                const Ic = m.icon;
                return (
                  <Card key={i} style={{ padding: "20px", background: T.surface, borderRadius: "20px", width: "100%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: `${m.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Ic size={16} color={m.color} />
                      </div>
                      <span style={{ fontSize: "14px", fontWeight: 500, color: T.textSub }}>{m.label}</span>
                    </div>
                    <div style={{ marginBottom: "8px" }}>
                      <span style={{ fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 600, color: m.color, fontFamily: F.mono }}>
                        {m.value !== undefined ? fmt(m.value) : "—"}
                      </span>
                      {m.value !== undefined && <span style={{ fontSize: "14px", color: T.textMuted, marginLeft: "4px" }}>{m.unit}</span>}
                    </div>
                    {m.min !== undefined && m.max !== undefined ? (
                      <div style={{ fontSize: "12px", color: T.textMuted }}>Range: {fmt(m.min)} — {fmt(m.max)} {m.unit}</div>
                    ) : (
                      <div style={{ fontSize: "12px", color: T.textMuted }}>No data in this window</div>
                    )}
                  </Card>
                );
              })}
        </div>
      </div>

      {/* Charts */}
      {!loading && points.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: T.text, marginBottom: "16px", letterSpacing: "-0.01em" }}>
            {rangeLabel} Trends
          </h2>
          <div className="charts-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
            {METRICS.map((c, idx) => {
              const Ic = c.icon;
              const chartData = points.map((p) => ({
                date: fmtLabel(p.bucket, granularity),
                avg: p[c.key]?.avg ?? undefined,
                min: p[c.key]?.min ?? undefined,
                max: p[c.key]?.max ?? undefined,
              }));
              const avgVals = chartData.map(d => d.avg).filter((v): v is number => v != null);
              const minVals = chartData.map(d => d.min).filter((v): v is number => v != null);
              const maxVals = chartData.map(d => d.max).filter((v): v is number => v != null);

              return (
                <Card key={idx} style={{ padding: "20px", background: T.surface, borderRadius: "20px", width: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: `${c.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Ic size={16} color={c.color} />
                      </div>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: T.text }}>{c.label}</div>
                        <div style={{ fontSize: "11px", color: T.textMuted }}>
                          {granularity === "hourly" ? "Hourly" : granularity === "weekly" ? "Weekly" : "Daily"} averages
                        </div>
                      </div>
                    </div>
                    <Badge text={`${rangeLabel}`} color={c.color} size="sm" />
                  </div>

                  <div style={{ height: "180px", width: "100%", marginBottom: "12px" }}>
                    <ResponsiveContainer>
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                        <defs>
                          <linearGradient id={`grad${idx}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={c.color} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={c.color} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} strokeOpacity={0.5} />
                        <XAxis dataKey="date" tick={{ fill: T.textDim, fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={16} />
                        <YAxis tick={{ fill: T.textDim, fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTip />} />
                        <Area
                          type="monotone" dataKey="avg" name={`Avg ${c.label}`}
                          stroke={c.color} fill={`url(#grad${idx})`} strokeWidth={2}
                          dot={chartData.length <= 40 ? { fill: c.color, r: 3, strokeWidth: 0 } : false}
                          activeDot={{ r: 6, fill: c.color, stroke: T.surface, strokeWidth: 2 }}
                          connectNulls
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: T.cardHover, borderRadius: "10px", fontSize: "11px", flexWrap: "wrap", gap: "8px" }}>
                    <div><span style={{ color: T.textMuted }}>Min: </span><span style={{ color: c.color, fontWeight: 500 }}>{minVals.length ? fmt(Math.min(...minVals), 1) : "—"}</span></div>
                    <div><span style={{ color: T.textMuted }}>Avg: </span><span style={{ color: c.color, fontWeight: 500 }}>{avgVals.length ? fmt(avgVals.reduce((a, b) => a + b, 0) / avgVals.length, 1) : "—"}</span></div>
                    <div><span style={{ color: T.textMuted }}>Max: </span><span style={{ color: c.color, fontWeight: 500 }}>{maxVals.length ? fmt(Math.max(...maxVals), 1) : "—"}</span></div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && points.length > 0 && (
        <Card style={{ padding: "24px", background: T.surface, borderRadius: "20px", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${T.violet}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <BarChart3 size={18} color={T.violet} />
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: T.text, marginBottom: "2px" }}>{rangeLabel} Breakdown</h3>
              <p style={{ fontSize: "12px", color: T.textMuted }}>{granularity[0].toUpperCase() + granularity.slice(1)} aggregates from sensor data</p>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
              <thead>
                <tr>
                  {[granularity === "hourly" ? "Time" : "Date", "Readings", "Temp (avg)", "Humidity (avg)", "Moisture (avg)", "pH (avg)"].map((h) => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 500, color: T.textMuted, borderBottom: `1px solid ${T.border}`, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {points.map((p, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = T.cardHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: "12px 16px", color: T.text, fontWeight: 500, fontFamily: F.mono }}>{fmtLabel(p.bucket, granularity)}</td>
                    <td style={{ padding: "12px 16px", color: T.textMuted, fontFamily: F.mono }}>{p.total_readings}</td>
                    <td style={{ padding: "12px 16px", color: T.rose, fontFamily: F.mono }}>{p.temperature?.avg != null ? fmt(p.temperature.avg) : "—"}°C</td>
                    <td style={{ padding: "12px 16px", color: T.blue, fontFamily: F.mono }}>{p.humidity?.avg != null ? fmt(p.humidity.avg) : "—"}%</td>
                    <td style={{ padding: "12px 16px", color: T.accent, fontFamily: F.mono }}>{p.soil_moisture?.avg != null ? fmt(p.soil_moisture.avg) : "—"}%</td>
                    <td style={{ padding: "12px 16px", color: T.amber, fontFamily: F.mono }}>{p.ph?.avg != null ? fmt(p.ph.avg, 2) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Empty state */}
      {!loading && points.length === 0 && (
        <div style={{ padding: "40px 32px", textAlign: "center", color: T.textMuted, backgroundColor: T.surface, borderRadius: "16px", border: `1px dashed ${T.border}` }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <BarChart3 size={44} color={T.textDim} strokeWidth={1.5} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 6 }}>No data in this window yet</h3>
          <p style={{ fontSize: "14px", maxWidth: 440, margin: "0 auto", lineHeight: 1.6 }}>
            There are no sensor readings for the {rangeLabel.toLowerCase()} range. Try a shorter window, or wait as more readings are collected.
          </p>
        </div>
      )}

      <style>{`
        @keyframes pulseDot { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        @media (max-width: 1024px) {
          .summary-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .charts-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) { .stats-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 640px) { .summary-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
