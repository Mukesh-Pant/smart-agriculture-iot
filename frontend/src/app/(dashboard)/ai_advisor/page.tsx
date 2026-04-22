"use client";
import { useCallback, useState } from "react";
import {
  T, F, Card, Err, ConfRow, Badge, Divider, Skeleton, fmt,
} from "../_components/DashboardComponents";
import { usePolling } from "@/app/hooks/useApi";
import {
  getFullRecommendation, postCropRecommendation,
  postSoilFertility, postGenerateReport,
} from "@/app/services/api";
import LanguageToggle, { type Lang } from "../_components/LanguageToggle";
import SoilFertilityCard from "../_components/SoilFertilityCard";
import AdviceSection from "../_components/AdviceSection";
import ManualInputPanel, { type ManualInput } from "../_components/ManualInputPanel";

interface IRecommendationData {
  crop?: {
    crop: string;
    confidence: number;
    confidence_pct: string;
    advice: string;
    top_3_crops?: Array<{ label: string; probability: number }>;
  };
  irrigation?: {
    urgency: "low" | "medium" | "high";
    action: string;
    confidence: number;
    confidence_pct: string;
    water_amount_mm?: number;
    advice: string;
  };
  fertilizer?: {
    fertilizer: string;
    confidence: number;
    confidence_pct: string;
    advice: string;
    npk_status?: Record<string, string>;
    top_3_fertilizers?: Array<{ label: string; probability: number }>;
  };
  soil?: {
    fertility_class: string;
    confidence: number;
    confidence_pct: string;
    class_probs?: Record<string, number>;
    advice: string;
    explanation?: Record<string, number> | null;
  };
  warnings?: string[];
  sensor_data_used?: Record<string, number>;
  weather_data_used?: { temperature_c: number; rainfall_monthly_mm: number };
}

export default function AIAdvisorPage() {
  const { data: rec, loading, error, refetch } = usePolling(
    useCallback(() => getFullRecommendation(), []),
    0
  ) as { data: IRecommendationData | null; loading: boolean; error: any; refetch: () => void };

  const [lang,         setLang]         = useState<Lang>("en");
  const [manualResult, setManualResult] = useState<IRecommendationData | null>(null);
  const [manualBusy,   setManualBusy]   = useState(false);
  const [pdfBusy,      setPdfBusy]      = useState(false);

  const activeRec = manualResult ?? rec;
  const uc = { low: T.accent, medium: T.amber, high: T.rose };

  const runManual = async (input: ManualInput) => {
    setManualBusy(true);
    try {
      const [fullRec, soilRec] = await Promise.all([
        getFullRecommendation(),
        postSoilFertility({
          nitrogen: input.nitrogen, phosphorus: input.phosphorus,
          potassium: input.potassium, ph: input.ph,
          moisture: input.soil_moisture, explain: true,
        }),
      ]);
      setManualResult({ ...(fullRec ?? {}), soil: soilRec });
    } catch (e: any) {
      alert(e.message ?? "Manual run failed");
    } finally {
      setManualBusy(false);
    }
  };

  const downloadPDF = async () => {
    if (!activeRec) return;
    setPdfBusy(true);
    try {
      const body = {
        crop:       activeRec.crop?.crop,
        fertilizer: activeRec.fertilizer?.fertilizer,
        soil_class: activeRec.soil?.fertility_class,
        irrigation: activeRec.irrigation?.action,
        crop_confidence:       activeRec.crop?.confidence,
        fertilizer_confidence: activeRec.fertilizer?.confidence,
        input_data: activeRec.sensor_data_used,
        language: lang,
      };
      const res = await postGenerateReport(body);
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url;
      a.download = `AgriSense_Report_${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e.message ?? "PDF download failed");
    } finally {
      setPdfBusy(false);
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
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "8px 0", paddingLeft: hov ? 8 : 0,
          borderBottom: `1px solid ${T.border}`,
          transition: "all 0.2s ease", cursor: "default",
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

  const getGreeting = () => {
    const h = new Date().getHours();
    if (lang === "np") {
      if (h < 12) return "शुभ बिहान";
      if (h < 18) return "शुभ दिउँसो";
      return "शुभ साँझ";
    }
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div style={{ backgroundColor: T.bg, minHeight: "100vh", padding: "24px" }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "clamp(22px,4vw,30px)", fontWeight: 700, color: T.text, marginBottom: 4, letterSpacing: "-0.02em" }}>
              {getGreeting()},
            </h1>
            <p style={{ fontSize: 13, color: T.textMuted, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d6a2d", animation: "pulseDot 2s infinite", display: "inline-block" }} />
              <span>
                {lang === "en"
                  ? "AI-powered crop & soil recommendations"
                  : "एआई-संचालित बाली र माटो सिफारिस"}
              </span>
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <LanguageToggle lang={lang} onChange={setLang} />

            {activeRec && (
              <button
                onClick={downloadPDF}
                disabled={pdfBusy}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "9px 16px",
                  background: "#fffbf0",
                  border: "1px solid #d4a017",
                  borderRadius: 10, color: "#9a7212",
                  fontSize: 13, fontWeight: 600,
                  cursor: pdfBusy ? "default" : "pointer",
                  opacity: pdfBusy ? 0.7 : 1,
                }}
              >
                {pdfBusy ? "⟳" : "📄"}
                {lang === "en" ? "Download Report" : "रिपोर्ट डाउनलोड"}
              </button>
            )}

            <button
              onClick={refetch}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "9px 16px", background: T.surface,
                border: `1px solid ${T.border}`, borderRadius: 10,
                color: T.text, fontSize: 13, fontWeight: 500, cursor: "pointer",
              }}
            >
              ↺ {lang === "en" ? "Refresh" : "ताजा गर्नुहोस्"}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4,1fr)",
          gap: 14, marginTop: 18,
        }} className="stats-grid">
          {[
            { label: lang === "en" ? "AI Status" : "एआई अवस्था",     value: activeRec ? (lang === "en" ? "Active" : "सक्रिय") : "Ready", color: "#2d6a2d" },
            { label: lang === "en" ? "Crops Analyzed" : "बाली विश्लेषण", value: String(activeRec?.crop?.top_3_crops?.length ?? 3),           color: T.violet  },
            { label: lang === "en" ? "Soil Class" : "माटो वर्ग",       value: activeRec?.soil?.fertility_class ?? "—",                     color: T.teal    },
            { label: lang === "en" ? "Last Updated" : "अन्तिम अद्यावधिक", value: activeRec ? new Date().toLocaleTimeString() : "—",          color: T.amber   },
          ].map((s, i) => (
            <div key={i} style={{
              padding: "14px 16px", background: T.surface,
              borderRadius: 14, border: `1px solid ${T.border}`,
            }}>
              <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      <Err msg={error} />

      {/* ── Manual/Demo Mode Panel ── */}
      <ManualInputPanel lang={lang} onSubmit={runManual} loading={manualBusy} />

      {/* ── Warnings ── */}
      {activeRec?.warnings?.map((w: string, i: number) => (
        <div key={i} style={{
          padding: "10px 14px", borderRadius: 10, marginBottom: 12,
          background: T.amberSubtle, border: `1px solid ${T.amber}30`,
          color: T.amber, fontSize: 12, display: "flex", alignItems: "center", gap: 8,
        }}>
          <span>💡</span>{w}
        </div>
      ))}

      {/* ── Empty state ── */}
      {!loading && !activeRec && !error && (
        <Card style={{ padding: "48px 32px", textAlign: "center", borderRadius: 20 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🤖</div>
          <h3 style={{ fontSize: 20, fontWeight: 600, color: T.text, marginBottom: 8 }}>
            {lang === "en" ? "No recommendations yet" : "अहिले सिफारिस छैन"}
          </h3>
          <p style={{ fontSize: 14, color: T.textMuted, maxWidth: 480, margin: "0 auto 16px", lineHeight: 1.6 }}>
            {lang === "en"
              ? "Click Refresh or use Manual Mode below to get AI recommendations."
              : "एआई सिफारिस पाउन ताजा गर्नुहोस् वा म्यानुअल मोड प्रयोग गर्नुहोस्।"}
          </p>
          <button
            onClick={refetch}
            style={{
              padding: "12px 24px", background: "#2d6a2d",
              border: "none", borderRadius: 12, color: "white",
              fontWeight: 700, fontSize: 14, cursor: "pointer",
            }}
          >
            {lang === "en" ? "Get Recommendations" : "सिफारिस प्राप्त गर्नुहोस्"}
          </button>
        </Card>
      )}

      {/* ── Loading skeletons ── */}
      {loading && !activeRec && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 20, marginBottom: 24 }} className="recommendations-grid">
          {[0,1,2,3].map(i => <Skeleton key={i} height={400} radius={16} />)}
        </div>
      )}

      {/* ── Main Recommendations Grid ── */}
      {activeRec && (
        <>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2,1fr)",
            gap: 20, marginBottom: 24,
          }} className="recommendations-grid">

            {/* Crop Card */}
            {activeRec.crop && (
              <Card style={{ padding: 24, borderRadius: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "#2d6a2d18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🌾</div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 2 }}>
                      {lang === "en" ? "Crop Recommendation" : "बाली सिफारिस"}
                    </h3>
                    <p style={{ fontSize: 12, color: T.textMuted }}>
                      {lang === "en" ? "Top picks for your soil" : "तपाईंको माटोका लागि उत्तम छनोट"}
                    </p>
                  </div>
                </div>
                <CHead label={lang === "en" ? "Recommended Crop" : "सिफारिस बाली"} color="#2d6a2d" badge={`${activeRec.crop.confidence_pct} Match`} />
                <div style={{ fontSize: 28, fontWeight: 700, color: "#2d6a2d", textTransform: "capitalize", marginBottom: 14 }}>
                  {activeRec.crop.crop}
                </div>
                <ConfRow label={lang === "en" ? "Model confidence" : "मोडल विश्वास"} value={activeRec.crop.confidence} color="#2d6a2d" />
                <p style={{ color: T.textSub, fontSize: 13, lineHeight: 1.6, margin: "12px 0" }}>
                  {activeRec.crop.advice}
                </p>
                <Divider />
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {lang === "en" ? "Top 3 Matches" : "शीर्ष ३ मिलान"}
                  </div>
                  {activeRec.crop.top_3_crops?.map((c: any, i: number) => (
                    <TopM key={i} rank={i} label={c.label} pct={Math.round(c.probability * 100)} color="#2d6a2d" />
                  ))}
                </div>
                <AdviceSection
                  lang={lang}
                  request={{
                    advice_type: "crop",
                    crop: activeRec.crop.crop,
                    confidence: activeRec.crop.confidence,
                    nitrogen: activeRec.sensor_data_used?.N ?? 60,
                    phosphorus: activeRec.sensor_data_used?.P ?? 40,
                    potassium: activeRec.sensor_data_used?.K ?? 40,
                    ph: activeRec.sensor_data_used?.ph_value ?? 6.5,
                    rainfall: activeRec.weather_data_used?.rainfall_monthly_mm ?? 100,
                    temperature: activeRec.weather_data_used?.temperature_c ?? 25,
                  }}
                />
              </Card>
            )}

            {/* Soil Fertility Card */}
            {activeRec.soil ? (
              <div>
                <SoilFertilityCard
                  fertility_class={activeRec.soil.fertility_class}
                  confidence={activeRec.soil.confidence}
                  confidence_pct={activeRec.soil.confidence_pct}
                  class_probs={activeRec.soil.class_probs}
                  advice={activeRec.soil.advice}
                  explanation={activeRec.soil.explanation}
                  lang={lang}
                />
                <div style={{ marginTop: 8 }}>
                  <AdviceSection
                    lang={lang}
                    request={{
                      advice_type: "soil",
                      fertility_class: activeRec.soil.fertility_class,
                      confidence: activeRec.soil.confidence,
                    }}
                  />
                </div>
              </div>
            ) : (
              <Card style={{ padding: 24, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
                <div style={{ textAlign: "center", color: T.textMuted }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>🌱</div>
                  <div style={{ fontSize: 13 }}>
                    {lang === "en" ? "Soil fertility data loading…" : "माटो उर्वरता डेटा लोड हुँदैछ…"}
                  </div>
                </div>
              </Card>
            )}

            {/* Irrigation Card */}
            {activeRec.irrigation && (() => {
              const c = uc[activeRec.irrigation.urgency as keyof typeof uc] ?? T.teal;
              return (
                <Card style={{ padding: 24, borderRadius: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: `${c}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>💧</div>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 2 }}>
                        {lang === "en" ? "Irrigation" : "सिँचाई"}
                      </h3>
                      <p style={{ fontSize: 12, color: T.textMuted }}>
                        {lang === "en" ? "Water management" : "पानी व्यवस्थापन"}
                      </p>
                    </div>
                  </div>
                  <CHead label={lang === "en" ? "Irrigation Advisory" : "सिँचाई सल्लाह"} color={c} badge={activeRec.irrigation.urgency?.toUpperCase()} />
                  <div style={{ fontSize: 22, fontWeight: 600, color: c, marginBottom: 14, wordBreak: "break-word" }}>
                    {activeRec.irrigation.action?.replace(/_/g, " ")}
                  </div>
                  <ConfRow label={lang === "en" ? "Model confidence" : "मोडल विश्वास"} value={activeRec.irrigation.confidence} color={c} />
                  {activeRec.irrigation.water_amount_mm && (
                    <div style={{ margin: "14px 0", padding: 14, borderRadius: 12, background: `${c}08`, border: `1px solid ${c}20`, textAlign: "center" }}>
                      <div style={{ fontFamily: F.mono, fontSize: 34, fontWeight: 700, color: c, lineHeight: 1 }}>
                        {activeRec.irrigation.water_amount_mm}
                        <span style={{ fontSize: 14, fontWeight: 400, color: T.textMuted, marginLeft: 4 }}>mm</span>
                      </div>
                      <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>
                        {lang === "en" ? "Recommended water volume" : "सिफारिस पानी मात्रा"}
                      </div>
                    </div>
                  )}
                  <p style={{ color: T.textSub, fontSize: 13, lineHeight: 1.6 }}>
                    {activeRec.irrigation.advice}
                  </p>
                  <AdviceSection
                    lang={lang}
                    request={{
                      advice_type: "irrigation",
                      irrigation_class: 1,
                      irrigation_action: activeRec.irrigation.action,
                      confidence: activeRec.irrigation.confidence,
                      crop_type: activeRec.crop?.crop ?? "Rice",
                      soil_moisture: activeRec.sensor_data_used?.soil_moisture_pct ?? 50,
                      temperature: activeRec.weather_data_used?.temperature_c ?? 25,
                    }}
                  />
                </Card>
              );
            })()}

            {/* Fertilizer Card */}
            {activeRec.fertilizer && (
              <Card style={{ padding: 24, borderRadius: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${T.amber}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🧪</div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 2 }}>
                      {lang === "en" ? "Fertilizer" : "मलखाद"}
                    </h3>
                    <p style={{ fontSize: 12, color: T.textMuted }}>
                      {lang === "en" ? "NPK recommendations" : "एनपीके सिफारिस"}
                    </p>
                  </div>
                </div>
                <CHead label={lang === "en" ? "Fertilizer Advisory" : "मलखाद सल्लाह"} color={T.amber} badge={`${activeRec.fertilizer.confidence_pct} Match`} />
                <div style={{ fontSize: 22, fontWeight: 700, color: T.amber, marginBottom: 14 }}>
                  {activeRec.fertilizer.fertilizer}
                </div>
                <ConfRow label={lang === "en" ? "Model confidence" : "मोडल विश्वास"} value={activeRec.fertilizer.confidence} color={T.amber} />
                <p style={{ color: T.textSub, fontSize: 13, lineHeight: 1.6, margin: "12px 0" }}>
                  {activeRec.fertilizer.advice}
                </p>
                {activeRec.fertilizer.npk_status && (
                  <>
                    <Divider />
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {lang === "en" ? "NPK Status" : "एनपीके अवस्था"}
                      </div>
                      {Object.entries(activeRec.fertilizer.npk_status).map(([k, v]) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${T.border}` }}>
                          <span style={{ color: T.textSub, fontSize: 13, textTransform: "capitalize" }}>{k}</span>
                          <Badge text={v as string} color={v === "optimal" ? "#2d6a2d" : v === "low" ? T.rose : T.amber} size="sm" />
                        </div>
                      ))}
                    </div>
                  </>
                )}
                <Divider />
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {lang === "en" ? "Top 3 Fertilizers" : "शीर्ष ३ मलखाद"}
                  </div>
                  {activeRec.fertilizer.top_3_fertilizers?.map((f: any, i: number) => (
                    <TopM key={i} rank={i} label={f.label} pct={Math.round(f.probability * 100)} color={T.amber} />
                  ))}
                </div>
                <AdviceSection
                  lang={lang}
                  request={{
                    advice_type: "fertilizer",
                    fertilizer: activeRec.fertilizer.fertilizer,
                    confidence: activeRec.fertilizer.confidence,
                    crop_type: activeRec.crop?.crop ?? "Rice",
                    soil_type: "Loamy",
                    nitrogen: activeRec.sensor_data_used?.N ?? 60,
                    phosphorus: activeRec.sensor_data_used?.P ?? 40,
                    potassium: activeRec.sensor_data_used?.K ?? 40,
                  }}
                />
              </Card>
            )}
          </div>

          {/* Data Used Row */}
          {(activeRec.sensor_data_used || activeRec.weather_data_used) && (
            <Card style={{ padding: 24, borderRadius: 20, marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${T.violet}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📊</div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: T.text }}>
                  {lang === "en" ? "Data Used for Recommendations" : "सिफारिसका लागि प्रयोग गरिएको डेटा"}
                </h3>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 14 }}>
                {activeRec.sensor_data_used && Object.entries(activeRec.sensor_data_used).map(([k, v]) => (
                  <div key={k} style={{ padding: "10px 12px", background: T.cardHover, borderRadius: 10 }}>
                    <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 3, textTransform: "capitalize" }}>{k.replace(/_/g, " ")}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#2d6a2d", fontFamily: F.mono }}>{fmt(v as number, 2)}</div>
                  </div>
                ))}
                {activeRec.weather_data_used && <>
                  <div style={{ padding: "10px 12px", background: T.cardHover, borderRadius: 10 }}>
                    <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 3 }}>Weather Temp</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: T.teal, fontFamily: F.mono }}>{fmt(activeRec.weather_data_used.temperature_c, 1)}°C</div>
                  </div>
                  <div style={{ padding: "10px 12px", background: T.cardHover, borderRadius: 10 }}>
                    <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 3 }}>Est. Rainfall</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: T.teal, fontFamily: F.mono }}>{fmt(activeRec.weather_data_used.rainfall_monthly_mm, 0)}mm</div>
                  </div>
                </>}
              </div>
            </Card>
          )}
        </>
      )}

      <style>{`
        @keyframes pulseDot { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        @media (max-width: 1024px) { .recommendations-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 768px)  { .stats-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 480px)  { .stats-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
