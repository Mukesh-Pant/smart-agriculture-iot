"use client";
import { useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  T,
  F,
  Card,
  Badge,
  ChartTip,
  fmt,
  Skeleton,
} from "../_components/DashboardComponents";
import { useFetch } from "@/app/hooks/useApi";
import { getWeeklySummary } from "@/app/services/api";

// Define interfaces for type safety
interface DailySummary {
  date: string;
  total_readings: number;
  temperature?: {
    avg: number;
    min: number;
    max: number;
  };
  humidity?: {
    avg: number;
    min: number;
    max: number;
  };
  soil_moisture?: {
    avg: number;
    min: number;
    max: number;
  };
  ph?: {
    avg: number;
    min: number;
    max: number;
  };
}

interface WeeklyData {
  summaries: DailySummary[];
}

interface ChartDataPoint {
  date: string;
  avg: number | undefined;
  min: number | undefined;
  max: number | undefined;
}

export default function AnalyticsPage() {
  const { data: weekly, loading } = useFetch(
    useCallback(() => getWeeklySummary(), [])
  ) as { data: WeeklyData | null; loading: boolean; error: any };
  
  const sums = weekly?.summaries || [];

  const charts = [
    { key: "temperature" as const, label: "Temperature", unit: "°C", color: T.rose, icon: "🌡️" },
    { key: "humidity" as const, label: "Humidity", unit: "%", color: T.blue, icon: "💧" },
    { key: "soil_moisture" as const, label: "Soil Moisture", unit: "%", color: T.accent, icon: "🌱" },
    { key: "ph" as const, label: "Soil pH", unit: "pH", color: T.amber, icon: "⚗️" },
  ];

  // Get current time greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Get today's data or use defaults
  const today = sums.length > 0 ? sums[sums.length - 1] : null;

  const metrics = [
    {
      label: "Temperature",
      value: today?.temperature?.avg,
      min: today?.temperature?.min,
      max: today?.temperature?.max,
      unit: "°C",
      color: T.rose,
      icon: "🌡️",
    },
    {
      label: "Humidity",
      value: today?.humidity?.avg,
      min: today?.humidity?.min,
      max: today?.humidity?.max,
      unit: "%",
      color: T.blue,
      icon: "💧",
    },
    {
      label: "Soil Moisture",
      value: today?.soil_moisture?.avg,
      min: today?.soil_moisture?.min,
      max: today?.soil_moisture?.max,
      unit: "%",
      color: T.accent,
      icon: "🌱",
    },
    {
      label: "Soil pH",
      value: today?.ph?.avg,
      min: today?.ph?.min,
      max: today?.ph?.max,
      unit: "pH",
      color: T.amber,
      icon: "⚗️",
    },
  ];

  return (
    <div style={{ 
      backgroundColor: T.bg, 
      minHeight: "100vh", 
      padding: "24px",
      position: "relative",
      zIndex: 1,
    }}>
      {/* Header Section */}
      <div style={{ 
        marginBottom: "32px",
        position: "relative",
        zIndex: 1,
      }}>
        <div style={{ 
          display: "flex", 
          flexDirection: "row",
          flexWrap: "wrap",
          gap: "16px",
          justifyContent: "space-between", 
          alignItems: "center" 
        }}>
          <div>
            <h1 style={{ 
              fontSize: "clamp(24px, 4vw, 32px)", 
              fontWeight: "600", 
              color: T.text,
              marginBottom: "4px",
              letterSpacing: "-0.02em"
            }}>
              {getGreeting()},
            </h1>
            <p style={{ 
              fontSize: "clamp(12px, 2vw, 14px)", 
              color: T.textMuted,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap"
            }}>
              <span style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: T.accent,
                animation: "pulseDot 2s infinite"
              }} />
              <span>Weekly analytics · Last 7 days from MongoDB</span>
            </p>
          </div>

          {/* Date Range Badge */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            backgroundColor: T.surface,
            borderRadius: "12px",
            border: `1px solid ${T.border}`,
          }}>
            <span style={{ fontSize: "14px", color: T.textMuted }}>📅</span>
            <span style={{ fontSize: "13px", fontWeight: "500", color: T.text }}>
              {sums.length > 0 ? `${sums[0]?.date} - ${sums[sums.length - 1]?.date}` : "No data range"}
            </span>
          </div>
        </div>

        {/* Quick Stats - Only show when data exists */}
        {sums.length > 0 && (
          <div className="stats-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
            marginTop: "20px",
            width: "100%",
          }}>
            <div style={{
              padding: "16px",
              backgroundColor: T.surface,
              borderRadius: "16px",
              border: `1px solid ${T.border}`,
            }}>
              <div style={{ fontSize: "13px", color: T.textMuted, marginBottom: "4px" }}>Total Readings</div>
              <div style={{ fontSize: "24px", fontWeight: "600", color: T.text }}>
                {sums.reduce((acc: number, s: DailySummary) => acc + (s.total_readings || 0), 0)}
              </div>
            </div>
            <div style={{
              padding: "16px",
              backgroundColor: T.surface,
              borderRadius: "16px",
              border: `1px solid ${T.border}`,
            }}>
              <div style={{ fontSize: "13px", color: T.textMuted, marginBottom: "4px" }}>Days of Data</div>
              <div style={{ fontSize: "24px", fontWeight: "600", color: T.accent }}>
                {sums.length}
              </div>
            </div>
            <div style={{
              padding: "16px",
              backgroundColor: T.surface,
              borderRadius: "16px",
              border: `1px solid ${T.border}`,
            }}>
              <div style={{ fontSize: "13px", color: T.textMuted, marginBottom: "4px" }}>Data Freshness</div>
              <div style={{ fontSize: "16px", fontWeight: "500", color: T.text }}>
                {sums.length > 0 ? "Up to date" : "Waiting for data"}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Today's Summary Cards - ALWAYS SHOW (4 cards) */}
      <div style={{ marginBottom: "32px", position: "relative", zIndex: 1 }}>
        <h2 style={{
          fontSize: "18px",
          fontWeight: "600",
          color: T.text,
          marginBottom: "16px",
          letterSpacing: "-0.01em",
        }}>
          Today's Summary
        </h2>
        
        {loading ? (
          <div className="summary-grid" style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(4, 1fr)", 
            gap: "20px" 
          }}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} height={120} radius={16} />
            ))}
          </div>
        ) : (
          <div className="summary-grid" style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(4, 1fr)", 
            gap: "20px" 
          }}>
            {metrics.map((metric, i) => (
              <Card key={i} style={{ 
                padding: "20px",
                background: T.surface,
                borderRadius: "20px",
                width: "100%",
                position: "relative",
                zIndex: 1,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "10px",
                    background: `${metric.color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    flexShrink: 0,
                  }}>
                    {metric.icon}
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: "500", color: T.textSub }}>{metric.label}</span>
                </div>
                
                <div style={{ marginBottom: "8px" }}>
                  <span style={{ fontSize: "clamp(24px, 3vw, 32px)", fontWeight: "600", color: metric.color, fontFamily: F.mono }}>
                    {metric.value !== undefined ? fmt(metric.value) : "—"}
                  </span>
                  {metric.value !== undefined && (
                    <span style={{ fontSize: "14px", color: T.textMuted, marginLeft: "4px" }}>{metric.unit}</span>
                  )}
                </div>
                
                {metric.min !== undefined && metric.max !== undefined ? (
                  <div style={{ fontSize: "12px", color: T.textMuted }}>
                    Range: {fmt(metric.min)} — {fmt(metric.max)} {metric.unit}
                  </div>
                ) : (
                  <div style={{ fontSize: "12px", color: T.textMuted }}>No data available</div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Charts Grid - Only show when data exists */}
      {sums.length > 0 && (
        <div style={{ marginBottom: "32px", position: "relative", zIndex: 1 }}>
          <h2 style={{
            fontSize: "18px",
            fontWeight: "600",
            color: T.text,
            marginBottom: "16px",
            letterSpacing: "-0.01em",
          }}>
            7-Day Trends
          </h2>
          <div className="charts-grid" style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(2, 1fr)", 
            gap: "20px" 
          }}>
            {charts.map((c, idx) => {
              const data: ChartDataPoint[] = sums.map((s: DailySummary) => ({ 
                date: (s.date || "").slice(5), 
                avg: s[c.key]?.avg,
                min: s[c.key]?.min,
                max: s[c.key]?.max,
              }));
              
              return (
                <Card key={idx} style={{ 
                  padding: "20px",
                  background: T.surface,
                  borderRadius: "20px",
                  width: "100%",
                  position: "relative",
                  zIndex: 1,
                }}>
                  {/* Chart Header */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "10px",
                        background: `${c.color}15`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "16px",
                        flexShrink: 0,
                      }}>
                        {c.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: "600", color: T.text }}>{c.label}</div>
                        <div style={{ fontSize: "11px", color: T.textMuted }}>Daily averages</div>
                      </div>
                    </div>
                    <Badge text="7-day trend" color={c.color} size="sm" />
                  </div>

                  {/* Chart */}
                  <div style={{ height: "180px", width: "100%", marginBottom: "12px" }}>
                    <ResponsiveContainer>
                      <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                        <defs>
                          <linearGradient id={`gradient${idx}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={c.color} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={c.color} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} strokeOpacity={0.5} />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fill: T.textDim, fontSize: 10 }} 
                          axisLine={false} 
                          tickLine={false} 
                        />
                        <YAxis 
                          tick={{ fill: T.textDim, fontSize: 10 }} 
                          axisLine={false} 
                          tickLine={false} 
                        />
                        <Tooltip content={<ChartTip />} />
                        <Area
                          type="monotone"
                          dataKey="avg"
                          name={`Avg ${c.label}`}
                          stroke={c.color}
                          fill={`url(#gradient${idx})`}
                          strokeWidth={2}
                          dot={{ fill: c.color, r: 4, strokeWidth: 0 }}
                          activeDot={{ r: 6, fill: c.color, stroke: T.surface, strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Mini Stats */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    background: T.cardHover,
                    borderRadius: "10px",
                    fontSize: "11px",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}>
                    <div>
                      <span style={{ color: T.textMuted }}>Min: </span>
                      <span style={{ color: c.color, fontWeight: "500" }}>
                        {fmt(Math.min(...data.map(d => d.min).filter((v): v is number => v !== undefined)), 1)}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: T.textMuted }}>Avg: </span>
                      <span style={{ color: c.color, fontWeight: "500" }}>
                        {fmt(data.reduce((acc, d) => acc + (d.avg || 0), 0) / data.length, 1)}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: T.textMuted }}>Max: </span>
                      <span style={{ color: c.color, fontWeight: "500" }}>
                        {fmt(Math.max(...data.map(d => d.max).filter((v): v is number => v !== undefined)), 1)}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary Table - Only show when data exists */}
      {sums.length > 0 && (
        <Card style={{ 
          padding: "24px",
          background: T.surface,
          borderRadius: "20px",
          width: "100%",
          position: "relative",
          zIndex: 1,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: `${T.violet}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              flexShrink: 0,
            }}>
              📊
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: T.text, marginBottom: "2px" }}>
                7-Day Summary Table
              </h3>
              <p style={{ fontSize: "12px", color: T.textMuted }}>Daily aggregates from sensor data</p>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
              <thead>
                <tr>
                  {["Date", "Readings", "Temp (avg)", "Humidity (avg)", "Moisture (avg)", "pH (avg)"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: "11px",
                        fontWeight: "500",
                        color: T.textMuted,
                        borderBottom: `1px solid ${T.border}`,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sums.map((s: DailySummary, i: number) => (
                  <tr
                    key={i}
                    style={{ 
                      borderBottom: `1px solid ${T.border}`,
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = T.cardHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "12px 16px", color: T.text, fontWeight: "500", fontFamily: F.mono }}>
                      {s.date}
                    </td>
                    <td style={{ padding: "12px 16px", color: T.textMuted, fontFamily: F.mono }}>
                      {s.total_readings}
                    </td>
                    <td style={{ padding: "12px 16px", color: T.rose, fontFamily: F.mono }}>
                      {s.temperature?.avg !== undefined ? fmt(s.temperature.avg) : "—"}°C
                    </td>
                    <td style={{ padding: "12px 16px", color: T.blue, fontFamily: F.mono }}>
                      {s.humidity?.avg !== undefined ? fmt(s.humidity.avg) : "—"}%
                    </td>
                    <td style={{ padding: "12px 16px", color: T.accent, fontFamily: F.mono }}>
                      {s.soil_moisture?.avg !== undefined ? fmt(s.soil_moisture.avg) : "—"}%
                    </td>
                    <td style={{ padding: "12px 16px", color: T.amber, fontFamily: F.mono }}>
                      {s.ph?.avg !== undefined ? fmt(s.ph.avg, 2) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Empty state for no data - but cards still show with placeholders */}
      {!loading && sums.length === 0 && (
        <div style={{ 
          padding: "32px",
          textAlign: "center", 
          color: T.textMuted,
          backgroundColor: T.surface,
          borderRadius: "16px",
          border: `1px solid ${T.border}`,
          marginTop: "24px",
        }}>
          <p style={{ fontSize: "14px" }}>
            No historical data yet. Data will appear here as sensors collect readings.
          </p>
        </div>
      )}

      {/* Add animations and responsive styles */}
      <style>{`
        @keyframes pulseDot {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        @media (max-width: 1024px) {
          .summary-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .charts-grid {
            grid-template-columns: 1fr !important;
          }
        }
        
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr !important;
          }
        }
        
        @media (max-width: 640px) {
          .summary-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}