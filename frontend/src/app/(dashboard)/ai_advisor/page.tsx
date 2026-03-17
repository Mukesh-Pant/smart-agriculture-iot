"use client";
import { useCallback, useState } from "react";
import {
  T,
  F,
  Card,
  Err,
  ConfRow,
  Badge,
  Divider,
  Skeleton,
  fmt,
} from "../_components/DashboardComponents";
import { usePolling } from "@/app/hooks/useApi";
import { getFullRecommendation, postCropRecommendation } from "@/app/services/api";

// Define the interface for recommendation data
interface IRecommendationData {
  crop?: {
    crop: string;
    confidence: number;
    confidence_pct: number;
    advice: string;
    top_3_crops?: Array<{ label: string; probability: number }>;
  };
  irrigation?: {
    urgency: 'low' | 'medium' | 'high';
    action: string;
    confidence: number;
    water_amount_mm?: number;
    advice: string;
  };
  fertilizer?: {
    fertilizer: string;
    confidence: number;
    confidence_pct: number;
    advice: string;
    npk_status?: Record<string, string>;
    top_3_fertilizers?: Array<{ label: string; probability: number }>;
  };
  warnings?: string[];
  sensor_data_used?: Record<string, number>;
  weather_data_used?: {
    temperature_c: number;
    rainfall_monthly_mm: number;
  };
  
}


export default function AIAdvisorPage() {
  // Cast the returned data to our interface
  const { data: rec, loading, error, refetch } = usePolling(
    useCallback(() => getFullRecommendation(), []),
    0
  ) as { 
    data: IRecommendationData | null; 
    loading: boolean; 
    error: any; 
    refetch: () => void 
  };
  
  const [form, setForm] = useState({ nitrogen: 60, phosphorus: 40, potassium: 40, ph: 6.5 });
  const [custom, setCustom] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const uc = { low: T.accent, medium: T.amber, high: T.rose };

  const runCustom = async () => {
    setBusy(true);
    try {
       console.log("the user input is:", form)
      const response = setCustom(await postCropRecommendation(form));
      
    } catch (e: any) {
      alert(e.message);
    } finally {

      setBusy(false);
    }
  };

  function CHead({ label, color, badge }: any) {
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 12, color, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
          {label}
        </div>
        <Badge text={badge} color={color} size="sm" />
      </div>
    );
  }

  function TopM({ rank, label, pct, color }: any) {
    const [hov, setHov] = useState(false);
    return (
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 0",
          paddingLeft: hov ? 8 : 0,
          borderBottom: `1px solid ${T.border}`,
          transition: "all 0.2s ease",
          cursor: "default",
        }}
      >
        <span style={{ color: T.textSub, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>{["🥇", "🥈", "🥉"][rank]}</span>
          <span style={{ textTransform: "capitalize" }}>{label}</span>
        </span>
        <span style={{ color, fontFamily: F.mono, fontSize: 14, fontWeight: 600 }}>{pct}%</span>
      </div>
    );
  }

  // Get current time greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div style={{ backgroundColor: T.bg, minHeight: "100vh", padding: "24px" }}>
      {/* Header Section */}
      <div style={{ marginBottom: "32px" }}>
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
                background: T.violet,
                animation: "pulseDot 2s infinite"
              }} />
              <span>AI-powered recommendations · Refresh for latest insights</span>
            </p>
          </div>

          {/* Refresh Button */}
          <button
            onClick={refetch}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: "12px",
              color: T.text,
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = T.cardHover;
              e.currentTarget.style.borderColor = T.violet + "40";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = T.surface;
              e.currentTarget.style.borderColor = T.border;
            }}
          >
            <span style={{ fontSize: "16px" }}>↺</span>
            Refresh Recommendations
          </button>
        </div>

        {/* Stats Summary */}
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
            <div style={{ fontSize: "13px", color: T.textMuted, marginBottom: "4px" }}>AI Model Status</div>
            <div style={{ fontSize: "24px", fontWeight: "600", color: T.accent }}>
              {rec ? "Active" : "Ready"}
            </div>
          </div>
          <div style={{
            padding: "16px",
            backgroundColor: T.surface,
            borderRadius: "16px",
            border: `1px solid ${T.border}`,
          }}>
            <div style={{ fontSize: "13px", color: T.textMuted, marginBottom: "4px" }}>Crops Analyzed</div>
            <div style={{ fontSize: "24px", fontWeight: "600", color: T.violet }}>
              {rec?.crop?.top_3_crops?.length || 3}
            </div>
          </div>
          <div style={{
            padding: "16px",
            backgroundColor: T.surface,
            borderRadius: "16px",
            border: `1px solid ${T.border}`,
          }}>
            <div style={{ fontSize: "13px", color: T.textMuted, marginBottom: "4px" }}>Last Updated</div>
            <div style={{ fontSize: "16px", fontWeight: "500", color: T.text }}>
              {rec ? new Date().toLocaleTimeString() : '—'}
            </div>
          </div>
        </div>
      </div>

      <Err msg={error} />

      {/* No Data Message */}
      {!loading && !rec && !error && (
        <Card style={{ 
          padding: "48px 32px",
          background: T.surface,
          borderRadius: "20px",
          marginBottom: "24px",
          textAlign: "center",
          border: `1px solid ${T.border}`,
        }}>
          <div style={{ fontSize: "64px", marginBottom: "16px", opacity: 0.8 }}>🤖</div>
          <h3 style={{ fontSize: "20px", fontWeight: "600", color: T.text, marginBottom: "8px" }}>
            No recommendations available
          </h3>
          <p style={{ fontSize: "15px", color: T.textMuted, maxWidth: "500px", margin: "0 auto 16px", lineHeight: 1.6 }}>
            Click refresh to get the latest AI-powered recommendations for your farm.
          </p>
          <button
            onClick={refetch}
            style={{
              padding: "12px 24px",
              background: T.violet,
              border: "none",
              borderRadius: "12px",
              color: "white",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Get Recommendations
          </button>
        </Card>
      )}

      {/* Warnings */}
      {rec?.warnings?.map((w: string, i: number) => (
        <div
          key={i}
          style={{
            padding: "12px 16px",
            borderRadius: "12px",
            marginBottom: "16px",
            background: T.amberSubtle,
            border: `1px solid ${T.amber}30`,
            color: T.amber,
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "16px" }}>💡</span>
          {w}
        </div>
      ))}

      {/* Main Recommendations Grid */}
      {loading && !rec ? (
        <div className="recommendations-grid" style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(3, 1fr)", 
          gap: "20px",
          marginBottom: "24px",
        }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={400} radius={16} />
          ))}
        </div>
      ) : (
        rec && (
          <>
            <div className="recommendations-grid" style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(3, 1fr)", 
              gap: "20px", 
              marginBottom: "24px",
              width: "100%",
            }}>
              {/* Crop Recommendation Card */}
              {rec.crop && (
                <Card style={{ 
                  padding: "24px",
                  background: T.surface,
                  borderRadius: "20px",
                  height: "100%",
                  width: "100%",
                }}>
                  <div style={{ marginBottom: "20px" }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "16px",
                      flexWrap: "wrap",
                    }}>
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
                        🌾
                      </div>
                      <div>
                        <h3 style={{ fontSize: "16px", fontWeight: "600", color: T.text, marginBottom: "2px" }}>
                          Crop Recommendation
                        </h3>
                        <p style={{ fontSize: "12px", color: T.textMuted }}>Top picks for your soil</p>
                      </div>
                    </div>
                    <CHead label="Recommended Crop" color={T.accent} badge={`${rec.crop.confidence_pct}% Match`} />
                  </div>

                  <div
                    style={{
                      fontSize: "clamp(24px, 3vw, 32px)",
                      fontWeight: "700",
                      color: T.accent,
                      textTransform: "capitalize",
                      marginBottom: "16px",
                      lineHeight: 1.2,
                      wordBreak: "break-word",
                    }}
                  >
                    {rec.crop.crop}
                  </div>

                  <ConfRow label="Model confidence" value={rec.crop.confidence} color={T.accent} />

                  <p style={{ color: T.textSub, fontSize: "13px", lineHeight: 1.6, margin: "16px 0" }}>
                    {rec.crop.advice}
                  </p>

                  <Divider />

                  <div style={{ marginTop: "16px" }}>
                    <div style={{ fontSize: "11px", color: T.textMuted, marginBottom: "12px", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Top 3 Matches
                    </div>
                    {rec.crop.top_3_crops?.map((c: any, i: number) => (
                      <TopM key={i} rank={i} label={c.label} pct={Math.round(c.probability * 100)} color={T.accent} />
                    ))}
                  </div>
                </Card>
              )}

              {/* Irrigation Card */}
              {rec.irrigation &&
                (() => {
                  const c = uc[rec.irrigation.urgency as keyof typeof uc] || T.teal;
                  return (
                    <Card style={{ 
                      padding: "24px",
                      background: T.surface,
                      borderRadius: "20px",
                      height: "100%",
                      width: "100%",
                    }}>
                      <div style={{ marginBottom: "20px" }}>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          marginBottom: "16px",
                          flexWrap: "wrap",
                        }}>
                          <div style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "12px",
                            background: `${c}15`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "20px",
                            flexShrink: 0,
                          }}>
                            💧
                          </div>
                          <div>
                            <h3 style={{ fontSize: "16px", fontWeight: "600", color: T.text, marginBottom: "2px" }}>
                              Irrigation
                            </h3>
                            <p style={{ fontSize: "12px", color: T.textMuted }}>Water management</p>
                          </div>
                        </div>
                        <CHead 
                          label="Irrigation Advisory" 
                          color={c} 
                          badge={rec.irrigation.urgency?.toUpperCase()} 
                        />
                      </div>

                      <div
                        style={{
                          fontSize: "clamp(20px, 2.5vw, 24px)",
                          fontWeight: "600",
                          color: c,
                          textTransform: "capitalize",
                          marginBottom: "16px",
                          wordBreak: "break-word",
                        }}
                      >
                        {rec.irrigation.action?.replace(/_/g, " ")}
                      </div>

                      <ConfRow label="Model confidence" value={rec.irrigation.confidence} color={c} />

                      {rec.irrigation.water_amount_mm && (
                        <div
                          style={{
                            margin: "16px 0",
                            padding: "16px",
                            borderRadius: "12px",
                            background: `${c}08`,
                            border: `1px solid ${c}20`,
                            textAlign: "center",
                          }}
                        >
                          <div
                            style={{
                              fontFamily: F.mono,
                              fontSize: "clamp(28px, 3vw, 36px)",
                              fontWeight: "600",
                              color: c,
                              lineHeight: 1,
                            }}
                          >
                            {rec.irrigation.water_amount_mm}
                            <span style={{ fontSize: "14px", fontWeight: "400", color: T.textMuted, marginLeft: "4px" }}>
                              mm
                            </span>
                          </div>
                          <div style={{ fontSize: "11px", color: T.textMuted, marginTop: "4px" }}>
                            Recommended water volume
                          </div>
                        </div>
                      )}

                      <p style={{ color: T.textSub, fontSize: "13px", lineHeight: 1.6 }}>
                        {rec.irrigation.advice}
                      </p>
                    </Card>
                  );
                })()}

              {/* Fertilizer Card */}
              {rec.fertilizer && (
                <Card style={{ 
                  padding: "24px",
                  background: T.surface,
                  borderRadius: "20px",
                  height: "100%",
                  width: "100%",
                }}>
                  <div style={{ marginBottom: "20px" }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "16px",
                      flexWrap: "wrap",
                    }}>
                      <div style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "12px",
                        background: `${T.amber}15`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                        flexShrink: 0,
                      }}>
                        🧪
                      </div>
                      <div>
                        <h3 style={{ fontSize: "16px", fontWeight: "600", color: T.text, marginBottom: "2px" }}>
                          Fertilizer
                        </h3>
                        <p style={{ fontSize: "12px", color: T.textMuted }}>NPK recommendations</p>
                      </div>
                    </div>
                    <CHead label="Fertilizer Advisory" color={T.amber} badge={`${rec.fertilizer.confidence_pct}% Match`} />
                  </div>

                  <div
                    style={{
                      fontSize: "clamp(20px, 2.5vw, 24px)",
                      fontWeight: "600",
                      color: T.amber,
                      marginBottom: "16px",
                      wordBreak: "break-word",
                    }}
                  >
                    {rec.fertilizer.fertilizer}
                  </div>

                  <ConfRow label="Model confidence" value={rec.fertilizer.confidence} color={T.amber} />

                  <p style={{ color: T.textSub, fontSize: "13px", lineHeight: 1.6, margin: "16px 0" }}>
                    {rec.fertilizer.advice}
                  </p>

                  {rec.fertilizer.npk_status && (
                    <>
                      <Divider />
                      <div style={{ marginTop: "16px" }}>
                        <div style={{ fontSize: "11px", color: T.textMuted, marginBottom: "12px", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          NPK Status
                        </div>
                        {Object.entries(rec.fertilizer.npk_status).map(([k, v]) => (
                          <div key={k} style={{ 
                            display: "flex", 
                            justifyContent: "space-between", 
                            alignItems: "center",
                            padding: "8px 0",
                            borderBottom: `1px solid ${T.border}`,
                            flexWrap: "wrap",
                            gap: "8px",
                          }}>
                            <span style={{ color: T.textSub, fontSize: "13px", textTransform: "capitalize" }}>{k}</span>
                            <Badge
                              text={v as string}
                              color={v === "optimal" ? T.accent : v === "low" ? T.rose : T.amber}
                              size="sm"
                            />
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <Divider />

                  <div style={{ marginTop: "16px" }}>
                    <div style={{ fontSize: "11px", color: T.textMuted, marginBottom: "12px", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Top 3 Fertilizers
                    </div>
                    {rec.fertilizer.top_3_fertilizers?.map((f: any, i: number) => (
                      <TopM key={i} rank={i} label={f.label} pct={Math.round(f.probability * 100)} color={T.amber} />
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Data Used Card */}
            {(rec.sensor_data_used || rec.weather_data_used) && (
              <Card style={{ 
                padding: "24px",
                background: T.surface,
                borderRadius: "20px",
                marginBottom: "24px",
                width: "100%",
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
                  <h3 style={{ fontSize: "16px", fontWeight: "600", color: T.text }}>
                    Data Used for This Recommendation
                  </h3>
                </div>

                <div className="data-grid" style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
                  gap: "20px",
                }}>
                  {rec.sensor_data_used &&
                    Object.entries(rec.sensor_data_used).map(([k, v]) => (
                      <div key={k} style={{
                        padding: "12px",
                        background: T.cardHover,
                        borderRadius: "12px",
                      }}>
                        <div style={{ fontSize: "11px", color: T.textMuted, marginBottom: "4px", textTransform: "capitalize" }}>
                          {k.replace(/_/g, " ")}
                        </div>
                        <div style={{ fontSize: "18px", fontWeight: "600", color: T.accent, fontFamily: F.mono }}>
                          {fmt(v as number, 2)}
                        </div>
                      </div>
                    ))}
                  {rec.weather_data_used && (
                    <>
                      <div style={{
                        padding: "12px",
                        background: T.cardHover,
                        borderRadius: "12px",
                      }}>
                        <div style={{ fontSize: "11px", color: T.textMuted, marginBottom: "4px" }}>Weather Temp</div>
                        <div style={{ fontSize: "18px", fontWeight: "600", color: T.teal, fontFamily: F.mono }}>
                          {fmt(rec.weather_data_used.temperature_c, 1)}°C
                        </div>
                      </div>
                      <div style={{
                        padding: "12px",
                        background: T.cardHover,
                        borderRadius: "12px",
                      }}>
                        <div style={{ fontSize: "11px", color: T.textMuted, marginBottom: "4px" }}>Est. Rainfall</div>
                        <div style={{ fontSize: "18px", fontWeight: "600", color: T.teal, fontFamily: F.mono }}>
                          {fmt(rec.weather_data_used.rainfall_monthly_mm, 0)}mm
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            )}
          </>
        )
      )}

      {/* Custom Crop Advisor */}
      <Card style={{ 
        padding: "24px",
        background: T.surface,
        borderRadius: "20px",
        width: "100%",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: `${T.violet}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            flexShrink: 0,
          }}>
            🔬
          </div>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: "600", color: T.text, marginBottom: "2px" }}>
              Custom Crop Advisor
            </h3>
            <p style={{ fontSize: "13px", color: T.textMuted }}>
              Enter soil NPK values manually for a tailored recommendation
            </p>
          </div>
        </div>

        <div className="input-grid" style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(4, 1fr)", 
          gap: "16px", 
          marginBottom: "20px",
        }}>
          {[
            { key: "nitrogen", label: "Nitrogen (N)", min: 0, max: 200, color: T.accent, hint: "0-200 ppm" },
            { key: "phosphorus", label: "Phosphorus (P)", min: 0, max: 200, color: T.blue, hint: "0-200 ppm" },
            { key: "potassium", label: "Potassium (K)", min: 0, max: 200, color: T.amber, hint: "0-200 ppm" },
            { key: "ph", label: "Soil pH", min: 0, max: 14, color: T.violet, hint: "0-14 pH" },
          ].map((f) => (
            <div key={f.key}>
              <label
                style={{
                  fontSize: "12px",
                  color: T.textMuted,
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "500",
                }}
              >
                {f.label}
              </label>
              <input
                type="number"
                min={f.min}
                max={f.max}
                step="0.1"
                value={form[f.key as keyof typeof form]}
                placeholder={f.hint}
                onChange={(e) => {
                  const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                  setForm((p) => ({ ...p, [f.key]: val }));
                }}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background: T.cardHover,
                  border: `1px solid ${T.border}`,
                  color: T.text,
                  fontSize: "14px",
                  fontFamily: F.mono,
                  outline: "none",
                  transition: "all 0.2s ease",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = f.color;
                  e.target.style.boxShadow = `0 0 0 3px ${f.color}15`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = T.border;
                  e.target.style.boxShadow = "none";
                  // Ensure value is within bounds
                  let val = parseFloat(e.target.value);
                  if (isNaN(val)) {
                    setForm((p) => ({ ...p, [f.key]: 0 }));
                  } else if (val < f.min) {
                    setForm((p) => ({ ...p, [f.key]: f.min }));
                  } else if (val > f.max) {
                    setForm((p) => ({ ...p, [f.key]: f.max }));
                  }
                }}
              />
              {/* Range hint below input */}
              <div style={{ 
                fontSize: "10px", 
                color: T.textDim, 
                marginTop: "4px",
                paddingLeft: "4px"
              }}>
                Range: {f.min} - {f.max} {f.key === 'ph' ? '' : 'ppm'}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={runCustom}
          disabled={busy}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            background: busy ? T.cardHover : T.violet,
            border: "none",
            color: busy ? T.textMuted : "white",
            fontWeight: "600",
            fontSize: "15px",
            cursor: busy ? "default" : "pointer",
            transition: "all 0.2s ease",
            opacity: busy ? 0.7 : 1,
          }}
          onMouseEnter={(e) => !busy && (e.currentTarget.style.background = T.violet + "dd")}
          onMouseLeave={(e) => !busy && (e.currentTarget.style.background = T.violet)}
        >
          {busy ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <span style={{ animation: "spin 1s linear infinite" }}>⟳</span>
              Analysing soil composition...
            </span>
          ) : (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <span>🌱</span>
              Get Custom Crop Recommendation
            </span>
          )}
        </button>

        {custom && (
          <div
            style={{
              marginTop: "20px",
              padding: "20px",
              borderRadius: "12px",
              background: T.accentSubtle,
              border: `1px solid ${T.accent}30`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "20px" }}>✨</span>
              <span style={{ fontSize: "14px", fontWeight: "600", color: T.accent, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Your Custom Result
              </span>
            </div>
            <div
              style={{
                fontSize: "clamp(24px, 3vw, 28px)",
                fontWeight: "700",
                color: T.accent,
                textTransform: "capitalize",
                marginBottom: "12px",
                wordBreak: "break-word",
              }}
            >
              {custom.crop}
            </div>
            <ConfRow label="Confidence" value={custom.confidence} color={T.accent} />
            {custom.advice && (
              <p style={{ color: T.textSub, fontSize: "13px", lineHeight: 1.6, marginTop: "12px" }}>
                {custom.advice}
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Responsive Styles */}
      <style>{`
        @keyframes pulseDot {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @media (max-width: 1024px) {
          .recommendations-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        
        @media (max-width: 768px) {
          .recommendations-grid {
            grid-template-columns: 1fr !important;
          }
          .stats-grid {
            grid-template-columns: 1fr !important;
          }
          .input-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        
        @media (max-width: 480px) {
          .input-grid {
            grid-template-columns: 1fr !important;
          }
          .data-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}