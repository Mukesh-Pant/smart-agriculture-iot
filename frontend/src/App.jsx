import { useState, useCallback, useEffect } from "react";
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis
} from "recharts";
import {
  getLatestReading, getSensorHistory, getCurrentWeather,
  getFullRecommendation, getWeeklySummary, getSystemStatus,
  postCropRecommendation, postFertilizerRecommendation
} from "./services/api";
import { usePolling, useFetch } from "./hooks/useApi";

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
const C = {
  bg:        "#0d1a12",
  surface:   "#132019",
  card:      "#1a2d20",
  border:    "#2a4030",
  green:     "#4ade80",
  greenDim:  "#166534",
  amber:     "#fbbf24",
  amberDim:  "#78350f",
  teal:      "#2dd4bf",
  rose:      "#fb7185",
  muted:     "#6b8c75",
  text:      "#e2f0e8",
  textDim:   "#8fac97",
};

// ─────────────────────────────────────────────────────────────
// UTILITY HELPERS
// ─────────────────────────────────────────────────────────────
const fmt  = (v, d = 1) => v == null ? "—" : Number(v).toFixed(d);
const pct  = (v)        => v == null ? "—" : `${Number(v).toFixed(1)}%`;
const ago  = (iso)      => {
  if (!iso) return "—";
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60)  return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  return `${Math.floor(s/3600)}h ago`;
};
const timeLabel = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
};

// ─────────────────────────────────────────────────────────────
// REUSABLE COMPONENTS
// ─────────────────────────────────────────────────────────────

function LiveDot() {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5 }}>
      <span style={{
        width:8, height:8, borderRadius:"50%",
        background: C.green,
        boxShadow: `0 0 0 0 ${C.green}`,
        animation: "pulse 2s infinite",
        display:"inline-block"
      }}/>
    </span>
  );
}

function SectionTitle({ icon, title, sub }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:20 }}>{icon}</span>
        <h2 style={{
          fontFamily:"'Playfair Display', serif",
          fontSize:22, fontWeight:700,
          color: C.text, margin:0, letterSpacing:"0.02em"
        }}>{title}</h2>
      </div>
      {sub && <p style={{ margin:"4px 0 0 30px", color:C.muted, fontSize:13 }}>{sub}</p>}
    </div>
  );
}

function Card({ children, style = {}, glow }) {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${glow ? C.green : C.border}`,
      borderRadius: 16,
      padding: "20px 22px",
      boxShadow: glow ? `0 0 24px ${C.greenDim}` : "0 2px 12px rgba(0,0,0,0.4)",
      transition: "box-shadow 0.3s",
      ...style
    }}>
      {children}
    </div>
  );
}

function StatPill({ label, value, unit, color = C.green, icon }) {
  return (
    <div style={{
      display:"flex", flexDirection:"column", gap:4,
      padding:"14px 18px", borderRadius:12,
      background: C.surface, border:`1px solid ${C.border}`,
    }}>
      <span style={{ fontSize:12, color:C.muted, textTransform:"uppercase", letterSpacing:"0.08em" }}>
        {icon} {label}
      </span>
      <span style={{ fontFamily:"'Playfair Display', serif", fontSize:28, fontWeight:700, color, lineHeight:1 }}>
        {value}
        <span style={{ fontSize:13, fontWeight:400, color:C.muted, marginLeft:4 }}>{unit}</span>
      </span>
    </div>
  );
}

function Badge({ text, color = C.green }) {
  return (
    <span style={{
      padding:"3px 10px", borderRadius:20,
      background: `${color}22`, border:`1px solid ${color}55`,
      color, fontSize:12, fontWeight:600, letterSpacing:"0.04em"
    }}>{text}</span>
  );
}

function ErrorBanner({ msg }) {
  return (
    <div style={{
      background:"#2d0f0f", border:"1px solid #7f1d1d",
      borderRadius:10, padding:"10px 16px",
      color:"#fca5a5", fontSize:13, marginBottom:10
    }}>⚠️ {msg}</div>
  );
}

function Spinner() {
  return (
    <div style={{ textAlign:"center", padding:40, color:C.muted }}>
      <div style={{ fontSize:24, animation:"spin 1s linear infinite", display:"inline-block" }}>⟳</div>
      <div style={{ marginTop:8, fontSize:13 }}>Loading…</div>
    </div>
  );
}

function ConfidenceBar({ value, color = C.green }) {
  const pctVal = Math.round((value || 0) * 100);
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ fontSize:12, color:C.muted }}>Confidence</span>
        <span style={{ fontSize:13, color, fontWeight:700 }}>{pctVal}%</span>
      </div>
      <div style={{ height:6, borderRadius:3, background:C.surface, overflow:"hidden" }}>
        <div style={{
          height:"100%", borderRadius:3,
          width:`${pctVal}%`,
          background:`linear-gradient(90deg, ${color}88, ${color})`,
          transition:"width 0.8s ease"
        }}/>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SENSOR GAUGES (Radial)
// ─────────────────────────────────────────────────────────────
function RadialGauge({ value, max, label, unit, color }) {
  const pctValue = Math.min(100, Math.round(((value || 0) / max) * 100));
  const data = [{ value: pctValue, fill: color }];
  return (
    <div style={{ textAlign:"center" }}>
      <div style={{ position:"relative", width:110, height:110, margin:"0 auto" }}>
        <RadialBarChart
          width={110} height={110}
          cx={55} cy={55}
          innerRadius={36} outerRadius={50}
          barSize={10} data={data}
          startAngle={225} endAngle={-45}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar background={{ fill:"#1a2d20" }} dataKey="value" cornerRadius={5} />
        </RadialBarChart>
        <div style={{
          position:"absolute", top:"50%", left:"50%",
          transform:"translate(-50%,-50%)",
          textAlign:"center"
        }}>
          <div style={{
            fontFamily:"'Playfair Display', serif",
            fontSize:16, fontWeight:700, color, lineHeight:1
          }}>{fmt(value, 1)}</div>
          <div style={{ fontSize:9, color:C.muted, marginTop:2 }}>{unit}</div>
        </div>
      </div>
      <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// NAV
// ─────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id:"dashboard", label:"Dashboard",       icon:"🌿" },
  { id:"sensors",   label:"Sensor Monitor",  icon:"📡" },
  { id:"recommend", label:"AI Advisor",      icon:"🤖" },
  { id:"analytics", label:"Analytics",       icon:"📊" },
  { id:"weather",   label:"Weather",         icon:"🌦️" },
];

function Sidebar({ active, onNav, status }) {
  const mlOk      = status?.ml_models === "loaded";
  const weatherOk = status?.weather_api === "configured";
  const dbOk      = status?.mongodb === "connected";

  return (
    <div style={{
      width:220, minHeight:"100vh", flexShrink:0,
      background: C.surface,
      borderRight:`1px solid ${C.border}`,
      display:"flex", flexDirection:"column",
      padding:"28px 0"
    }}>
      {/* Logo */}
      <div style={{ padding:"0 20px 28px" }}>
        <div style={{
          fontFamily:"'Playfair Display', serif",
          fontSize:20, fontWeight:700, color:C.green,
          lineHeight:1.2
        }}>🌾 AgriSense</div>
        <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>
          Smart Agriculture System
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1 }}>
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => onNav(item.id)}
            style={{
              width:"100%", display:"flex", alignItems:"center",
              gap:10, padding:"11px 20px",
              background: active === item.id ? `${C.green}18` : "transparent",
              borderLeft: active === item.id ? `3px solid ${C.green}` : "3px solid transparent",
              border:"none", cursor:"pointer",
              color: active === item.id ? C.green : C.textDim,
              fontSize:14, fontWeight: active === item.id ? 600 : 400,
              transition:"all 0.2s", textAlign:"left"
            }}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* System Status */}
      <div style={{ padding:"16px 20px", borderTop:`1px solid ${C.border}` }}>
        <div style={{ fontSize:11, color:C.muted, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.06em" }}>
          System
        </div>
        {[
          { label:"MongoDB",   ok:dbOk,      icon:"🍃" },
          { label:"ML Models", ok:mlOk,      icon:"🤖" },
          { label:"Weather",   ok:weatherOk, icon:"🌦️" },
        ].map(s => (
          <div key={s.label} style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            marginBottom:5
          }}>
            <span style={{ fontSize:12, color:C.textDim }}>{s.icon} {s.label}</span>
            <span style={{
              width:7, height:7, borderRadius:"50%",
              background: s.ok ? C.green : "#ef4444",
              boxShadow: s.ok ? `0 0 6px ${C.green}` : "none"
            }}/>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE: DASHBOARD
// ─────────────────────────────────────────────────────────────
function DashboardPage() {
  const { data: sensor, loading: sLoad, error: sErr } =
    usePolling(useCallback(() => getLatestReading(), []), 8000);
  const { data: history } =
    usePolling(useCallback(() => getSensorHistory(30), []), 15000);
  const { data: weather } =
    usePolling(useCallback(() => getCurrentWeather(), []), 300000);
  const { data: recommend } =
    usePolling(useCallback(() => getFullRecommendation(), []), 60000);

  const chartData = (history?.readings || [])
    .slice().reverse()
    .map((r, i) => ({
      t:        timeLabel(r.received_at),
      temp:     r.temperature_c,
      humidity: r.humidity_pct,
      moisture: r.soil_moisture_pct,
      ph:       r.ph_value,
    }));

  const urgencyColor = {
    low:    C.green,
    medium: C.amber,
    high:   C.rose,
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
        <div>
          <h1 style={{
            fontFamily:"'Playfair Display', serif",
            fontSize:32, fontWeight:700, color:C.text,
            margin:0, letterSpacing:"-0.01em"
          }}>
            Farm Overview
          </h1>
          <p style={{ color:C.muted, margin:"6px 0 0", fontSize:14 }}>
            Real-time monitoring · {sensor ? <><LiveDot/> Live</> : "Waiting for data"}
          </p>
        </div>
        {weather && (
          <div style={{
            background:C.surface, border:`1px solid ${C.border}`,
            borderRadius:12, padding:"10px 16px",
            textAlign:"right"
          }}>
            <div style={{ fontSize:22 }}>
              {weather.condition_main === "Rain" ? "🌧️" :
               weather.condition_main === "Clouds" ? "⛅" :
               weather.condition_main === "Clear" ? "☀️" : "🌤️"}
            </div>
            <div style={{ color:C.text, fontSize:16, fontWeight:600 }}>
              {fmt(weather.temperature_c)}°C
            </div>
            <div style={{ color:C.muted, fontSize:12 }}>{weather.city}</div>
          </div>
        )}
      </div>

      {sErr && <ErrorBanner msg={sErr} />}

      {/* Gauges Row */}
      {sLoad && !sensor ? <Spinner /> : (
        <Card style={{ marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
            <span style={{ fontSize:13, color:C.muted }}>
              SENSOR READINGS · Updated {ago(sensor?.received_at)}
            </span>
            {sensor && <Badge text={sensor.status === "ok" ? "All Sensors OK" : "Sensor Error"} color={sensor.status === "ok" ? C.green : C.rose}/>}
          </div>
          <div style={{ display:"flex", justifyContent:"space-around", flexWrap:"wrap", gap:20 }}>
            <RadialGauge value={sensor?.temperature_c}  max={50}  label="Temperature"    unit="°C"  color={C.rose}  />
            <RadialGauge value={sensor?.humidity_pct}   max={100} label="Humidity"       unit="%"   color={C.teal}  />
            <RadialGauge value={sensor?.soil_moisture_pct} max={100} label="Soil Moisture" unit="%" color={C.green} />
            <RadialGauge value={sensor?.ph_value}       max={14}  label="Soil pH"        unit="pH"  color={C.amber} />
          </div>
        </Card>
      )}

      {/* Stats Row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        <StatPill label="Temperature" value={fmt(sensor?.temperature_c)} unit="°C"  color={C.rose}  icon="🌡️" />
        <StatPill label="Humidity"    value={pct(sensor?.humidity_pct)}  unit=""    color={C.teal}  icon="💧" />
        <StatPill label="Soil Moisture" value={pct(sensor?.soil_moisture_pct)} unit="" color={C.green} icon="🌱" />
        <StatPill label="Soil pH"     value={fmt(sensor?.ph_value)}      unit="pH"  color={C.amber} icon="⚗️" />
      </div>

      {/* Chart + Recommendations */}
      <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:16 }}>
        {/* Chart */}
        <Card>
          <div style={{ marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:600, color:C.text }}>
              Sensor Trends
            </span>
            <Badge text="Last 30 readings" color={C.teal}/>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.rose}  stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={C.rose}  stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gMoisture" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.green} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={C.green} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="t" tick={{ fill:C.muted, fontSize:10 }} />
              <YAxis tick={{ fill:C.muted, fontSize:10 }} />
              <Tooltip
                contentStyle={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8 }}
                labelStyle={{ color:C.text }}
                itemStyle={{ color:C.textDim }}
              />
              <Area type="monotone" dataKey="temp"     name="Temp °C"   stroke={C.rose}  fill="url(#gTemp)"     strokeWidth={2} dot={false}/>
              <Area type="monotone" dataKey="moisture" name="Moisture %" stroke={C.green} fill="url(#gMoisture)" strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="humidity" name="Humidity %" stroke={C.teal}  strokeWidth={1.5} dot={false} strokeDasharray="4 2"/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Quick Recommendations */}
        <Card>
          <div style={{ marginBottom:14 }}>
            <span style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:600, color:C.text }}>
              AI Recommendations
            </span>
          </div>
          {recommend ? (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {recommend.crop && (
                <div style={{ padding:"12px 14px", borderRadius:10, background:C.surface, border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>🌾 RECOMMENDED CROP</div>
                  <div style={{ color:C.green, fontSize:18, fontFamily:"'Playfair Display',serif", fontWeight:700, textTransform:"capitalize" }}>
                    {recommend.crop.crop}
                  </div>
                  <ConfidenceBar value={recommend.crop.confidence} color={C.green}/>
                </div>
              )}
              {recommend.irrigation && (
                <div style={{ padding:"12px 14px", borderRadius:10, background:C.surface, border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>💧 IRRIGATION</div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{
                      color: urgencyColor[recommend.irrigation.urgency] || C.amber,
                      fontSize:15, fontWeight:600, textTransform:"capitalize"
                    }}>
                      {recommend.irrigation.action?.replace(/_/g," ")}
                    </span>
                    <Badge
                      text={recommend.irrigation.urgency?.toUpperCase()}
                      color={urgencyColor[recommend.irrigation.urgency] || C.amber}
                    />
                  </div>
                  {recommend.irrigation.water_amount_mm && (
                    <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>
                      Apply {recommend.irrigation.water_amount_mm}mm
                    </div>
                  )}
                </div>
              )}
              {recommend.fertilizer && (
                <div style={{ padding:"12px 14px", borderRadius:10, background:C.surface, border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>🧪 FERTILIZER</div>
                  <div style={{ color:C.amber, fontSize:15, fontWeight:600 }}>
                    {recommend.fertilizer.fertilizer}
                  </div>
                  <ConfidenceBar value={recommend.fertilizer.confidence} color={C.amber}/>
                </div>
              )}
            </div>
          ) : <div style={{ color:C.muted, fontSize:13, textAlign:"center", padding:20 }}>Loading recommendations…</div>}
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE: SENSOR MONITOR
// ─────────────────────────────────────────────────────────────
function SensorsPage() {
  const { data: sensor, loading } =
    usePolling(useCallback(() => getLatestReading(), []), 8000);
  const { data: histData } =
    usePolling(useCallback(() => getSensorHistory(50), []), 15000);

  const readings = (histData?.readings || []).slice().reverse();

  const charts = [
    { key:"temperature_c",     label:"Temperature",   unit:"°C",  color:C.rose,  icon:"🌡️" },
    { key:"humidity_pct",      label:"Humidity",      unit:"%",   color:C.teal,  icon:"💧" },
    { key:"soil_moisture_pct", label:"Soil Moisture", unit:"%",   color:C.green, icon:"🌱" },
    { key:"ph_value",          label:"Soil pH",       unit:"pH",  color:C.amber, icon:"⚗️" },
  ];

  return (
    <div>
      <SectionTitle icon="📡" title="Sensor Monitor" sub="Live readings from ESP32 — auto-refreshes every 8 seconds"/>

      {loading && !sensor ? <Spinner/> : (
        <>
          {/* Current values */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
            {charts.map(c => (
              <Card key={c.key} glow={c.key==="soil_moisture_pct" && (sensor?.[c.key] || 0) < 30}>
                <div style={{ fontSize:11, color:C.muted, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.06em" }}>
                  {c.icon} {c.label}
                </div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:36, fontWeight:700, color:c.color, lineHeight:1 }}>
                  {fmt(sensor?.[c.key], 1)}
                  <span style={{ fontSize:14, color:C.muted, fontWeight:400 }}> {c.unit}</span>
                </div>
                {sensor && (
                  <div style={{ marginTop:10, fontSize:12, color:C.muted }}>
                    Updated {ago(sensor.received_at)}
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Individual sensor history charts */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            {charts.map(c => {
              const chartData = readings.map(r => ({
                t:     timeLabel(r.received_at),
                value: r[c.key],
              }));
              return (
                <Card key={c.key}>
                  <div style={{ marginBottom:12, fontSize:14, fontWeight:600, color:C.text }}>
                    {c.icon} {c.label} History
                  </div>
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                      <XAxis dataKey="t" tick={{ fill:C.muted, fontSize:9 }} interval="preserveStartEnd"/>
                      <YAxis tick={{ fill:C.muted, fontSize:9 }}/>
                      <Tooltip
                        contentStyle={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:6 }}
                        itemStyle={{ color:c.color }}
                        labelStyle={{ color:C.text, fontSize:11 }}
                      />
                      <Line type="monotone" dataKey="value" name={`${c.label} (${c.unit})`}
                        stroke={c.color} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              );
            })}
          </div>

          {/* Latest readings table */}
          <Card style={{ marginTop:16 }}>
            <div style={{ marginBottom:14, fontSize:14, fontWeight:600, color:C.text }}>
              📋 Recent Readings
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                    {["Time","Temp (°C)","Humidity (%)","Moisture (%)","pH","Status"].map(h => (
                      <th key={h} style={{ padding:"8px 12px", textAlign:"left", color:C.muted, fontWeight:500, fontSize:11 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {readings.slice(0,15).map((r, i) => (
                    <tr key={i} style={{ borderBottom:`1px solid ${C.border}22` }}>
                      <td style={{ padding:"8px 12px", color:C.textDim }}>{timeLabel(r.received_at)}</td>
                      <td style={{ padding:"8px 12px", color:C.rose   }}>{fmt(r.temperature_c)}</td>
                      <td style={{ padding:"8px 12px", color:C.teal   }}>{fmt(r.humidity_pct)}</td>
                      <td style={{ padding:"8px 12px", color:C.green  }}>{fmt(r.soil_moisture_pct)}</td>
                      <td style={{ padding:"8px 12px", color:C.amber  }}>{fmt(r.ph_value)}</td>
                      <td style={{ padding:"8px 12px" }}>
                        <Badge
                          text={r.has_errors ? "Error" : "OK"}
                          color={r.has_errors ? C.rose : C.green}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE: AI ADVISOR
// ─────────────────────────────────────────────────────────────
function RecommendPage() {
  const { data: full, loading, error, refetch } =
    usePolling(useCallback(() => getFullRecommendation(), []), 0);

  // Custom crop form state
  const [cropForm, setCropForm] = useState({ nitrogen:60, phosphorus:40, potassium:40, ph:6.5 });
  const [cropResult, setCropResult] = useState(null);
  const [cropLoading, setCropLoading] = useState(false);

  const handleCropSubmit = async () => {
    setCropLoading(true);
    try {
      const r = await postCropRecommendation(cropForm);
      setCropResult(r);
    } catch(e) { alert(e.message); }
    finally { setCropLoading(false); }
  };

  const urgencyColor = { low:C.green, medium:C.amber, high:C.rose };

  return (
    <div>
      <SectionTitle icon="🤖" title="AI Advisor" sub="ML-powered recommendations from your live sensor and weather data"/>

      {error && <ErrorBanner msg={error}/>}

      {/* Full recommendation cards */}
      {loading && !full ? <Spinner/> : full && (
        <>
          {full.warnings?.length > 0 && (
            <div style={{ marginBottom:16 }}>
              {full.warnings.map((w,i) => (
                <div key={i} style={{
                  background:"#1c1a0a", border:`1px solid ${C.amberDim}`,
                  borderRadius:8, padding:"8px 14px",
                  color:C.amber, fontSize:12, marginBottom:6
                }}>💡 {w}</div>
              ))}
            </div>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:20 }}>
            {/* Crop */}
            {full.crop && (
              <Card glow>
                <div style={{ fontSize:11, color:C.muted, marginBottom:10, textTransform:"uppercase", letterSpacing:"0.06em" }}>
                  🌾 Crop Recommendation
                </div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, color:C.green, textTransform:"capitalize", lineHeight:1.1 }}>
                  {full.crop.crop}
                </div>
                <div style={{ margin:"12px 0" }}>
                  <ConfidenceBar value={full.crop.confidence} color={C.green}/>
                </div>
                <p style={{ color:C.textDim, fontSize:13, lineHeight:1.6, margin:"10px 0" }}>
                  {full.crop.advice}
                </p>
                <div style={{ marginTop:12 }}>
                  <div style={{ fontSize:11, color:C.muted, marginBottom:8 }}>Top 3 Matches</div>
                  {full.crop.top_3_crops?.map((c,i) => (
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:`1px solid ${C.border}22` }}>
                      <span style={{ color:C.textDim, fontSize:13, textTransform:"capitalize" }}>
                        {i===0?"🥇":i===1?"🥈":"🥉"} {c.label}
                      </span>
                      <span style={{ color:C.green, fontSize:13 }}>{Math.round(c.probability*100)}%</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Irrigation */}
            {full.irrigation && (
              <Card>
                <div style={{ fontSize:11, color:C.muted, marginBottom:10, textTransform:"uppercase", letterSpacing:"0.06em" }}>
                  💧 Irrigation Decision
                </div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, lineHeight:1.2,
                  color: urgencyColor[full.irrigation.urgency] || C.teal,
                  textTransform:"capitalize"
                }}>
                  {full.irrigation.action?.replace(/_/g," ")}
                </div>
                <div style={{ margin:"10px 0" }}>
                  <ConfidenceBar value={full.irrigation.confidence} color={urgencyColor[full.irrigation.urgency]}/>
                </div>
                <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                  <Badge text={`Urgency: ${full.irrigation.urgency?.toUpperCase()}`} color={urgencyColor[full.irrigation.urgency]}/>
                </div>
                {full.irrigation.water_amount_mm && (
                  <div style={{
                    padding:"10px 14px", borderRadius:8,
                    background:C.surface, border:`1px solid ${C.border}`,
                    textAlign:"center", marginBottom:10
                  }}>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, color:C.teal, fontWeight:700 }}>
                      {full.irrigation.water_amount_mm}
                      <span style={{ fontSize:14, color:C.muted }}> mm</span>
                    </div>
                    <div style={{ fontSize:11, color:C.muted }}>recommended water</div>
                  </div>
                )}
                <p style={{ color:C.textDim, fontSize:13, lineHeight:1.6 }}>
                  {full.irrigation.advice}
                </p>
              </Card>
            )}

            {/* Fertilizer */}
            {full.fertilizer && (
              <Card>
                <div style={{ fontSize:11, color:C.muted, marginBottom:10, textTransform:"uppercase", letterSpacing:"0.06em" }}>
                  🧪 Fertilizer Recommendation
                </div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:700, color:C.amber, lineHeight:1.1 }}>
                  {full.fertilizer.fertilizer}
                </div>
                <div style={{ margin:"10px 0" }}>
                  <ConfidenceBar value={full.fertilizer.confidence} color={C.amber}/>
                </div>
                <p style={{ color:C.textDim, fontSize:13, lineHeight:1.6, margin:"10px 0" }}>
                  {full.fertilizer.advice}
                </p>
                {full.fertilizer.npk_status && (
                  <div style={{ marginTop:12 }}>
                    <div style={{ fontSize:11, color:C.muted, marginBottom:8 }}>NPK Status</div>
                    {Object.entries(full.fertilizer.npk_status).map(([k,v]) => (
                      <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0" }}>
                        <span style={{ color:C.textDim, fontSize:12, textTransform:"capitalize" }}>{k}</span>
                        <Badge
                          text={v}
                          color={v==="optimal"?C.green:v==="low"?C.rose:C.amber}
                        />
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ marginTop:12 }}>
                  <div style={{ fontSize:11, color:C.muted, marginBottom:8 }}>Top 3</div>
                  {full.fertilizer.top_3_fertilizers?.map((f,i) => (
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:`1px solid ${C.border}22` }}>
                      <span style={{ color:C.textDim, fontSize:12 }}>
                        {i===0?"🥇":i===1?"🥈":"🥉"} {f.label}
                      </span>
                      <span style={{ color:C.amber, fontSize:12 }}>{Math.round(f.probability*100)}%</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Data used */}
          {(full.sensor_data_used || full.weather_data_used) && (
            <Card style={{ marginBottom:20 }}>
              <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:12 }}>
                📊 Data Used for This Recommendation
              </div>
              <div style={{ display:"flex", gap:24, flexWrap:"wrap" }}>
                {full.sensor_data_used && Object.entries(full.sensor_data_used).map(([k,v]) => (
                  <div key={k}>
                    <div style={{ fontSize:11, color:C.muted }}>{k.replace(/_/g," ")}</div>
                    <div style={{ fontSize:15, color:C.green, fontWeight:600 }}>{fmt(v,2)}</div>
                  </div>
                ))}
                {full.weather_data_used && (
                  <>
                    <div>
                      <div style={{ fontSize:11, color:C.muted }}>weather temp</div>
                      <div style={{ fontSize:15, color:C.teal, fontWeight:600 }}>{fmt(full.weather_data_used.temperature_c,1)}°C</div>
                    </div>
                    <div>
                      <div style={{ fontSize:11, color:C.muted }}>rainfall est.</div>
                      <div style={{ fontSize:15, color:C.teal, fontWeight:600 }}>{fmt(full.weather_data_used.rainfall_monthly_mm,0)}mm</div>
                    </div>
                  </>
                )}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Manual Crop Tool */}
      <Card>
        <SectionTitle icon="🔬" title="Custom Crop Advisor" sub="Enter your soil NPK values manually for a tailored recommendation"/>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
          {[
            { key:"nitrogen",   label:"Nitrogen (N)",   min:0, max:200 },
            { key:"phosphorus", label:"Phosphorus (P)", min:0, max:200 },
            { key:"potassium",  label:"Potassium (K)",  min:0, max:200 },
            { key:"ph",         label:"Soil pH",        min:0, max:14  },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize:12, color:C.muted, display:"block", marginBottom:6 }}>{f.label}</label>
              <input
                type="number" min={f.min} max={f.max} step="0.1"
                value={cropForm[f.key]}
                onChange={e => setCropForm(p => ({...p, [f.key]: parseFloat(e.target.value)}))}
                style={{
                  width:"100%", padding:"9px 12px", borderRadius:8, boxSizing:"border-box",
                  background:C.surface, border:`1px solid ${C.border}`,
                  color:C.text, fontSize:15, outline:"none",
                }}
              />
            </div>
          ))}
        </div>
        <button onClick={handleCropSubmit} disabled={cropLoading}
          style={{
            padding:"10px 24px", borderRadius:8,
            background: cropLoading ? C.greenDim : C.green,
            border:"none", color:"#0d1a12",
            fontWeight:700, fontSize:14, cursor:"pointer",
            transition:"all 0.2s"
          }}>
          {cropLoading ? "Analysing…" : "🌱 Get Crop Recommendation"}
        </button>

        {cropResult && (
          <div style={{ marginTop:16, padding:"16px", borderRadius:10, background:C.surface, border:`1px solid ${C.greenDim}` }}>
            <div style={{ fontSize:11, color:C.muted, marginBottom:6 }}>RESULT</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:700, color:C.green, textTransform:"capitalize" }}>
              {cropResult.crop}
            </div>
            <div style={{ margin:"8px 0" }}><ConfidenceBar value={cropResult.confidence} color={C.green}/></div>
            <p style={{ color:C.textDim, fontSize:13, margin:"8px 0 0" }}>{cropResult.advice}</p>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE: ANALYTICS
// ─────────────────────────────────────────────────────────────
function AnalyticsPage() {
  const { data: weekly, loading } =
    useFetch(useCallback(() => getWeeklySummary(), []));

  const summaries = weekly?.summaries || [];

  const tempData     = summaries.map(s => ({ date:s.date?.slice(5), avg:s.temperature?.avg, min:s.temperature?.min, max:s.temperature?.max }));
  const humData      = summaries.map(s => ({ date:s.date?.slice(5), avg:s.humidity?.avg    }));
  const moistureData = summaries.map(s => ({ date:s.date?.slice(5), avg:s.soil_moisture?.avg }));
  const phData       = summaries.map(s => ({ date:s.date?.slice(5), avg:s.ph?.avg          }));

  return (
    <div>
      <SectionTitle icon="📊" title="Weekly Analytics" sub="Daily min/avg/max aggregations from MongoDB — last 7 days"/>

      {loading ? <Spinner/> : (
        <>
          {/* Summary stat cards */}
          {summaries.length > 0 && (() => {
            const latest = summaries[summaries.length-1];
            return (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
                <Card>
                  <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>🌡️ TODAY AVG TEMP</div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, color:C.rose, fontWeight:700 }}>
                    {fmt(latest.temperature?.avg)}°C
                  </div>
                  <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>
                    {fmt(latest.temperature?.min)}° – {fmt(latest.temperature?.max)}°
                  </div>
                </Card>
                <Card>
                  <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>💧 TODAY AVG HUMIDITY</div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, color:C.teal, fontWeight:700 }}>
                    {fmt(latest.humidity?.avg)}%
                  </div>
                  <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>
                    {fmt(latest.humidity?.min)}% – {fmt(latest.humidity?.max)}%
                  </div>
                </Card>
                <Card>
                  <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>🌱 TODAY AVG MOISTURE</div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, color:C.green, fontWeight:700 }}>
                    {fmt(latest.soil_moisture?.avg)}%
                  </div>
                  <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>
                    {fmt(latest.soil_moisture?.min)}% – {fmt(latest.soil_moisture?.max)}%
                  </div>
                </Card>
                <Card>
                  <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>⚗️ TODAY AVG pH</div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, color:C.amber, fontWeight:700 }}>
                    {fmt(latest.ph?.avg)}
                  </div>
                  <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>
                    {fmt(latest.ph?.min)} – {fmt(latest.ph?.max)}
                  </div>
                </Card>
              </div>
            );
          })()}

          {/* Weekly charts */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            {[
              { data:tempData,     key:"avg", label:"Temperature (°C)",   color:C.rose  },
              { data:humData,      key:"avg", label:"Humidity (%)",        color:C.teal  },
              { data:moistureData, key:"avg", label:"Soil Moisture (%)",   color:C.green },
              { data:phData,       key:"avg", label:"Soil pH",             color:C.amber },
            ].map((c, i) => (
              <Card key={i}>
                <div style={{ marginBottom:12, fontSize:14, fontWeight:600, color:C.text }}>
                  {c.label} — 7-Day Average
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={c.data}>
                    <defs>
                      <linearGradient id={`g${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={c.color} stopOpacity={0.35}/>
                        <stop offset="95%" stopColor={c.color} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                    <XAxis dataKey="date" tick={{ fill:C.muted, fontSize:10 }}/>
                    <YAxis tick={{ fill:C.muted, fontSize:10 }}/>
                    <Tooltip contentStyle={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:6 }} itemStyle={{ color:c.color }} labelStyle={{ color:C.text }}/>
                    <Area type="monotone" dataKey={c.key} name={c.label} stroke={c.color} fill={`url(#g${i})`} strokeWidth={2} dot={{ fill:c.color, r:3 }}/>
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            ))}
          </div>

          {/* Weekly table */}
          <Card style={{ marginTop:16 }}>
            <div style={{ marginBottom:14, fontSize:14, fontWeight:600, color:C.text }}>
              📋 7-Day Summary Table
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                    {["Date","Readings","Temp avg","Humidity avg","Moisture avg","pH avg"].map(h => (
                      <th key={h} style={{ padding:"8px 12px", textAlign:"left", color:C.muted, fontWeight:500, fontSize:11 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {summaries.map((s,i) => (
                    <tr key={i} style={{ borderBottom:`1px solid ${C.border}22` }}>
                      <td style={{ padding:"9px 12px", color:C.text, fontWeight:500 }}>{s.date}</td>
                      <td style={{ padding:"9px 12px", color:C.muted }}>{s.total_readings}</td>
                      <td style={{ padding:"9px 12px", color:C.rose  }}>{fmt(s.temperature?.avg)}°C</td>
                      <td style={{ padding:"9px 12px", color:C.teal  }}>{fmt(s.humidity?.avg)}%</td>
                      <td style={{ padding:"9px 12px", color:C.green }}>{fmt(s.soil_moisture?.avg)}%</td>
                      <td style={{ padding:"9px 12px", color:C.amber }}>{fmt(s.ph?.avg)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE: WEATHER
// ─────────────────────────────────────────────────────────────
function WeatherPage() {
  const { data: w, loading, error } =
    usePolling(useCallback(() => getCurrentWeather(), []), 300000);

  const weatherIcon = (main) => ({
    Rain:"🌧️", Drizzle:"🌦️", Thunderstorm:"⛈️",
    Snow:"❄️", Clear:"☀️", Clouds:"☁️",
    Mist:"🌫️", Haze:"🌫️", Fog:"🌁",
  }[main] || "🌤️");

  return (
    <div>
      <SectionTitle icon="🌦️" title="Weather Conditions" sub={`Live data for ${w?.city || "your city"} — cached 10 minutes`}/>

      {error && <ErrorBanner msg={error}/>}
      {loading && !w ? <Spinner/> : w ? (
        <>
          {/* Hero card */}
          <Card style={{ marginBottom:20, background:"linear-gradient(135deg,#1a2d20,#0f2318)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:60 }}>{weatherIcon(w.condition_main)}</div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:52, fontWeight:700, color:C.text, lineHeight:1 }}>
                  {fmt(w.temperature_c)}°C
                </div>
                <div style={{ fontSize:16, color:C.muted, marginTop:6, textTransform:"capitalize" }}>
                  {w.condition_desc}
                </div>
                <div style={{ fontSize:14, color:C.textDim, marginTop:4 }}>
                  {w.city}, {w.country} · Feels like {fmt(w.feels_like_c)}°C
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ color:C.muted, fontSize:12, marginBottom:4 }}>RANGE TODAY</div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:C.rose }}>
                  {fmt(w.temp_max_c)}°
                </div>
                <div style={{ color:C.muted, fontSize:13 }}>High</div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:C.teal, marginTop:8 }}>
                  {fmt(w.temp_min_c)}°
                </div>
                <div style={{ color:C.muted, fontSize:13 }}>Low</div>
              </div>
            </div>
          </Card>

          {/* Detail grid */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:16 }}>
            <StatPill label="Humidity"       value={fmt(w.humidity_pct,0)}    unit="%"    color={C.teal}  icon="💧"/>
            <StatPill label="Wind Speed"     value={fmt(w.wind_speed_ms,1)}   unit="m/s"  color={C.green} icon="💨"/>
            <StatPill label="Pressure"       value={fmt(w.pressure_hpa,0)}    unit="hPa"  color={C.amber} icon="🔵"/>
            <StatPill label="Cloud Cover"    value={w.cloudiness_pct}         unit="%"    color={C.textDim} icon="☁️"/>
            <StatPill label="Rain (1h)"      value={fmt(w.rainfall_1h_mm,1)}  unit="mm"   color={C.teal}  icon="🌧️"/>
            <StatPill label="Rain Est./mo"   value={fmt(w.rainfall_monthly_mm,0)} unit="mm" color={C.rose} icon="📅"/>
          </div>

          {/* Agriculture impact */}
          <Card>
            <div style={{ marginBottom:14, fontSize:14, fontWeight:600, color:C.text }}>
              🌿 Agricultural Impact Assessment
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[
                {
                  label:"Irrigation Need",
                  value: w.rainfall_3h_mm > 5 ? "Low — recent rainfall sufficient" :
                         w.humidity_pct > 80  ? "Moderate — high humidity" : "High — dry conditions",
                  color: w.rainfall_3h_mm > 5 ? C.green : w.humidity_pct > 80 ? C.amber : C.rose
                },
                {
                  label:"Crop Growth Conditions",
                  value: w.temperature_c > 35 ? "Heat stress risk — monitor sensitive crops" :
                         w.temperature_c < 10 ? "Cold stress risk — protect crops" :
                         "Favourable temperature range",
                  color: (w.temperature_c > 35 || w.temperature_c < 10) ? C.rose : C.green
                },
                {
                  label:"Disease Risk",
                  value: w.humidity_pct > 85 ? "High humidity — fungal disease risk elevated" :
                         "Normal — maintain regular monitoring",
                  color: w.humidity_pct > 85 ? C.amber : C.green
                }
              ].map((item,i) => (
                <div key={i} style={{
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"11px 14px", borderRadius:8,
                  background:C.surface, border:`1px solid ${C.border}`
                }}>
                  <span style={{ color:C.textDim, fontSize:13 }}>{item.label}</span>
                  <span style={{ color:item.color, fontSize:13, fontWeight:500 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      ) : (
        <Card>
          <div style={{ textAlign:"center", padding:40, color:C.muted }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🌦️</div>
            <div style={{ fontSize:16, color:C.text, marginBottom:8 }}>Weather API Not Configured</div>
            <div style={{ fontSize:13 }}>Add <code style={{ color:C.green }}>WEATHER_API_KEY</code> to your .env file</div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("dashboard");
  const { data: status } = usePolling(useCallback(() => {
    return fetch("http://localhost:8000/health").then(r => r.json()).catch(() => null);
  }, []), 30000);

  const pages = {
    dashboard: <DashboardPage/>,
    sensors:   <SensorsPage/>,
    recommend: <RecommendPage/>,
    analytics: <AnalyticsPage/>,
    weather:   <WeatherPage/>,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body { background:${C.bg}; color:${C.text}; font-family:'DM Sans',sans-serif; }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:${C.surface}; }
        ::-webkit-scrollbar-thumb { background:${C.border}; border-radius:3px; }
        @keyframes pulse {
          0%   { box-shadow:0 0 0 0 ${C.green}88; }
          70%  { box-shadow:0 0 0 8px ${C.green}00; }
          100% { box-shadow:0 0 0 0 ${C.green}00; }
        }
        @keyframes spin { to { transform:rotate(360deg); } }
        input:focus { border-color:${C.green} !important; }
        button:hover:not(:disabled) { opacity:0.9; transform:translateY(-1px); }
      `}</style>

      <div style={{ display:"flex", minHeight:"100vh" }}>
        <Sidebar active={page} onNav={setPage} status={status}/>

        <main style={{
          flex:1, padding:"32px 36px",
          overflowY:"auto", maxHeight:"100vh"
        }}>
          {pages[page] || <DashboardPage/>}
        </main>
      </div>
    </>
  );
}
