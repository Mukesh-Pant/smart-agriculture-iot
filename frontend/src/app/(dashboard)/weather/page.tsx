"use client";
import { useCallback } from "react";
import {
  T,
  F,
  Card,
  Err,
  Metric,
  Skeleton,
  fmt,
  Badge,
} from "../_components/DashboardComponents";
import { usePolling } from "@/app/hooks/useApi";
import { getCurrentWeather } from "@/app/services/api";

// Define interface for weather data
interface WeatherData {
  temperature_c: number;
  feels_like_c: number;
  humidity_pct: number;
  pressure_hpa: number;
  wind_speed_ms: number;
  wind_direction?: string;
  condition_main: string;
  condition_desc: string;
  city: string;
  country: string;
  rainfall_1h_mm: number;
  rainfall_3h_mm: number;
  cloudiness_pct: number;
  temp_max_c: number;
  temp_min_c: number;
  rainfall_monthly_mm: number;
}

export default function WeatherPage() {
  const { data: w, loading, error } = usePolling(
    useCallback(() => getCurrentWeather(), []), 
    300000
  ) as { data: WeatherData | null; loading: boolean; error: any };

  const wIcon = (c: string): string =>
    ({
      Clear: "☀️",
      Clouds: "☁️",
      Rain: "🌧️",
      Drizzle: "🌦️",
      Thunderstorm: "⛈️",
      Mist: "🌫️",
      Haze: "🌫️",
      Fog: "🌁",
    }[c] || "🌤️");

  // Get current time greeting
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

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
                background: T.blue,
                animation: "pulseDot 2s infinite"
              }} />
              <span>Live weather · Auto-refreshes every 5 minutes</span>
            </p>
          </div>

          {/* Location Badge */}
          {w && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              backgroundColor: T.surface,
              borderRadius: "12px",
              border: `1px solid ${T.border}`,
              flexWrap: "wrap",
            }}>
              <span style={{ fontSize: "16px" }}>📍</span>
              <span style={{ fontSize: "clamp(12px, 2vw, 14px)", fontWeight: "500", color: T.text }}>
                {w.city}, {w.country}
              </span>
            </div>
          )}
        </div>
      </div>

      <Err msg={error} />

      {loading && !w ? (
        <div style={{ marginBottom: "24px" }}>
          <Skeleton height={300} radius={20} />
        </div>
      ) : w ? (
        <>
          {/* Main Weather Card */}
          <Card style={{ 
            padding: "clamp(20px, 3vw, 32px)",
            background: `linear-gradient(135deg, ${T.surface}, ${T.cardHover})`,
            borderRadius: "24px",
            marginBottom: "24px",
            border: `1px solid ${T.border}`,
          }}>
            <div style={{ 
              display: "flex", 
              flexDirection: "row",
              flexWrap: "wrap",
              gap: "20px",
              justifyContent: "space-between", 
              alignItems: "flex-start" 
            }}>
              <div style={{ flex: "1 1 300px" }}>
                <div style={{ 
                  fontSize: "clamp(60px, 10vw, 80px)", 
                  marginBottom: "16px",
                  filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.1))"
                }}>
                  {wIcon(w.condition_main)}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                  <span style={{
                    fontFamily: F.mono,
                    fontSize: "clamp(48px, 8vw, 64px)",
                    fontWeight: "600",
                    color: T.text,
                    lineHeight: 1,
                    letterSpacing: "-0.03em",
                  }}>
                    {fmt(w.temperature_c)}°
                  </span>
                  <span style={{ fontSize: "clamp(16px, 3vw, 20px)", color: T.textMuted }}>C</span>
                </div>
                <div style={{ fontSize: "clamp(16px, 2.5vw, 18px)", color: T.textSub, textTransform: "capitalize", marginBottom: "4px" }}>
                  {w.condition_desc}
                </div>
                <div style={{ fontSize: "clamp(12px, 1.8vw, 14px)", color: T.textMuted }}>
                  Feels like {fmt(w.feels_like_c)}°C
                </div>
              </div>
              
              <div style={{ 
                display: "flex", 
                gap: "clamp(16px, 4vw, 32px)",
                flexWrap: "wrap",
                justifyContent: "flex-start",
              }}>
                <div style={{ textAlign: "center", minWidth: "80px" }}>
                  <div style={{
                    fontSize: "13px",
                    color: T.textMuted,
                    marginBottom: "8px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    fontWeight: "500",
                  }}>
                    High
                  </div>
                  <div style={{ 
                    fontFamily: F.mono, 
                    fontSize: "clamp(24px, 4vw, 32px)", 
                    fontWeight: "600", 
                    color: T.rose,
                    lineHeight: 1,
                  }}>
                    {fmt(w.temp_max_c)}°
                  </div>
                </div>
                <div style={{ textAlign: "center", minWidth: "80px" }}>
                  <div style={{
                    fontSize: "13px",
                    color: T.textMuted,
                    marginBottom: "8px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    fontWeight: "500",
                  }}>
                    Low
                  </div>
                  <div style={{ 
                    fontFamily: F.mono, 
                    fontSize: "clamp(24px, 4vw, 32px)", 
                    fontWeight: "600", 
                    color: T.blue,
                    lineHeight: 1,
                  }}>
                    {fmt(w.temp_min_c)}°
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Row */}
            <div style={{
              display: "flex",
              gap: "clamp(12px, 3vw, 24px)",
              marginTop: "32px",
              paddingTop: "24px",
              borderTop: `1px solid ${T.border}`,
              flexWrap: "wrap",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "120px" }}>
                <span style={{ fontSize: "20px" }}>💧</span>
                <div>
                  <div style={{ fontSize: "11px", color: T.textMuted }}>Humidity</div>
                  <div style={{ fontSize: "16px", fontWeight: "600", color: T.blue }}>{w.humidity_pct}%</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "120px" }}>
                <span style={{ fontSize: "20px" }}>💨</span>
                <div>
                  <div style={{ fontSize: "11px", color: T.textMuted }}>Wind</div>
                  <div style={{ fontSize: "16px", fontWeight: "600", color: T.accent }}>{fmt(w.wind_speed_ms)} m/s</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "120px" }}>
                <span style={{ fontSize: "20px" }}>🔵</span>
                <div>
                  <div style={{ fontSize: "11px", color: T.textMuted }}>Pressure</div>
                  <div style={{ fontSize: "16px", fontWeight: "600", color: T.textSub }}>{w.pressure_hpa} hPa</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Weather Metrics Grid */}
          <h2 style={{
            fontSize: "18px",
            fontWeight: "600",
            color: T.text,
            marginBottom: "16px",
            letterSpacing: "-0.01em",
          }}>
            Detailed Weather Data
          </h2>
          <div className="metrics-grid" style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(3, 1fr)", 
            gap: "20px", 
            marginBottom: "24px" 
          }}>
            <Metric 
              label="Humidity" 
              value={w.humidity_pct} 
              decimals={0} 
              unit="%" 
              color={T.blue} 
              icon="💧"
              sub="Relative humidity"
            />
            <Metric 
              label="Wind Speed" 
              value={w.wind_speed_ms} 
              decimals={1} 
              unit="m/s" 
              color={T.accent} 
              icon="💨"
              sub={`Direction: ${w.wind_direction || 'N/A'}`}
            />
            <Metric 
              label="Pressure" 
              value={w.pressure_hpa} 
              decimals={0} 
              unit="hPa" 
              color={T.textSub} 
              icon="🔵"
              sub="Atmospheric"
            />
            <Metric 
              label="Cloud Cover" 
              value={w.cloudiness_pct} 
              decimals={0} 
              unit="%" 
              color={T.textSub} 
              icon="☁️"
              sub="Sky coverage"
            />
            <Metric 
              label="Rain (Last Hour)" 
              value={w.rainfall_1h_mm} 
              decimals={1} 
              unit="mm" 
              color={T.teal} 
              icon="🌧️"
              sub={w.rainfall_1h_mm > 0 ? "Recent precipitation" : "No recent rain"}
            />
            <Metric 
              label="Monthly Estimate" 
              value={w.rainfall_monthly_mm} 
              decimals={0} 
              unit="mm" 
              color={T.rose} 
              icon="📅"
              sub="Projected total"
            />
          </div>

          {/* Agricultural Impact Assessment */}
          <Card style={{ 
            padding: "24px",
            background: T.surface,
            borderRadius: "20px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: `${T.accent}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                flexShrink: 0,
              }}>
                🌿
              </div>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "600", color: T.text, marginBottom: "2px" }}>
                  Agricultural Impact Assessment
                </h3>
                <p style={{ fontSize: "12px", color: T.textMuted }}>
                  How weather affects your farm operations
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gap: "12px" }}>
              {[
                {
                  label: "Irrigation Need",
                  value:
                    w.rainfall_3h_mm > 5
                      ? "Low — recent rainfall sufficient"
                      : w.humidity_pct > 80
                      ? "Moderate — high humidity"
                      : "High — dry conditions",
                  color: w.rainfall_3h_mm > 5 ? T.accent : w.humidity_pct > 80 ? T.amber : T.rose,
                  icon: "💧",
                },
                {
                  label: "Crop Stress Risk",
                  value:
                    w.temperature_c > 35
                      ? "Heat stress — monitor crops"
                      : w.temperature_c < 10
                      ? "Cold stress — protect from frost"
                      : "Optimal temperature range",
                  color: w.temperature_c > 35 || w.temperature_c < 10 ? T.rose : T.accent,
                  icon: "🌡️",
                },
                {
                  label: "Disease Risk",
                  value: w.humidity_pct > 85 ? "Elevated — fungal disease risk" : "Low — routine monitoring",
                  color: w.humidity_pct > 85 ? T.amber : T.accent,
                  icon: "🦠",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "16px",
                    borderRadius: "12px",
                    background: T.cardHover,
                    border: `1px solid ${T.border}`,
                    transition: "all 0.2s ease",
                    flexWrap: "wrap",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = item.color + "40";
                    e.currentTarget.style.transform = "translateX(4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = T.border;
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: `${item.color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    flexShrink: 0,
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: "1 1 200px" }}>
                    <div style={{ fontSize: "13px", color: T.textSub, marginBottom: "4px" }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: "clamp(12px, 2vw, 14px)", fontWeight: "500", color: item.color }}>
                      {item.value}
                    </div>
                  </div>
                  <Badge 
                    text={item.value.split(' — ')[0]} 
                    color={item.color} 
                    size="sm"
                  />
                </div>
              ))}
            </div>

            {/* Additional Weather Note */}
            <div style={{
              marginTop: "20px",
              padding: "12px 16px",
              background: `${T.blue}08`,
              borderRadius: "10px",
              border: `1px solid ${T.blue}20`,
              fontSize: "13px",
              color: T.textSub,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}>
              <span style={{ fontSize: "16px" }}>⏱️</span>
              <span>
                Last updated: {new Date().toLocaleTimeString()} · Next update in 5 minutes
              </span>
            </div>
          </Card>
        </>
      ) : (
        // Empty State - Weather API Not Configured
        <Card style={{ 
          padding: "clamp(40px, 6vw, 60px) clamp(20px, 4vw, 32px)",
          background: T.surface,
          borderRadius: "24px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "clamp(60px, 10vw, 80px)", marginBottom: "24px", opacity: 0.8 }}>🌦️</div>
          <h2 style={{ 
            fontSize: "clamp(20px, 3vw, 24px)", 
            fontWeight: "600", 
            color: T.text, 
            marginBottom: "12px",
            letterSpacing: "-0.02em",
          }}>
            Weather API Not Configured
          </h2>
          <p style={{ 
            fontSize: "clamp(13px, 2vw, 15px)", 
            color: T.textMuted, 
            maxWidth: "400px", 
            margin: "0 auto 24px",
            lineHeight: 1.6,
            padding: "0 16px",
          }}>
            To enable weather data, add your API key to the environment variables.
          </p>
          <div style={{
            display: "inline-block",
            padding: "12px 20px",
            background: T.cardHover,
            borderRadius: "12px",
            border: `1px solid ${T.border}`,
            fontFamily: F.mono,
            fontSize: "clamp(12px, 1.8vw, 13px)",
            color: T.accent,
            maxWidth: "100%",
            overflowX: "auto",
            whiteSpace: "nowrap" as const,
          }}>
            WEATHER_API_KEY=your_api_key_here
          </div>
          <p style={{ fontSize: "13px", color: T.textMuted, marginTop: "20px" }}>
            Get a free API key from{' '}
            <a href="#" style={{ color: T.accent, textDecoration: "none" }}>
              OpenWeatherMap
            </a>
          </p>
        </Card>
      )}

      {/* Add animations and responsive styles */}
      <style>{`
        @keyframes pulseDot {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        @media (max-width: 1024px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        
        @media (max-width: 640px) {
          .metrics-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}