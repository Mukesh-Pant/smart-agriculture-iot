"use client";
import React, { useCallback, useEffect, useState } from "react";
import { T, F, ConfRow, Badge, Divider, Err } from "../_components/DashboardComponents";
import { usePolling } from "@/app/hooks/useApi";
import { getRecommendHistory } from "@/app/services/api";
import LanguageToggle, { type Lang } from "../_components/LanguageToggle";
import SoilFertilityCard from "../_components/SoilFertilityCard";
import AdviceSection from "../_components/AdviceSection";
import { getRecommendationById } from "@/app/services/api";

const TYPE_COLOR: Record<string, string> = {
  crop: "#2d6a2d", fertilizer: "#d97706", irrigation: "#0284c7",
  soil: "#7c3aed", full: "#0d9488",
};
const TYPE_ICON: Record<string, string> = {
  crop: "🌾", fertilizer: "🧪", irrigation: "💧",
  soil: "🌱", full: "🤖",
};

interface HistoryRecord {
  id: string;
  report_id?: string;
  device_id?: string;
  user_id?: string;
  type: string;
  confidence?: number;
  created_at: string;
  result?: Record<string, unknown>;
  advice_en?: string;
  advice_np?: string;
  advice_source?: string;
}

function DrawerSection({
  icon, color, iconBg, title, children,
}: {
  icon: string; color: string; iconBg: string;
  title: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      background: T.surface, borderRadius: 14,
      border: `1px solid ${T.border}`,
      borderLeft: `4px solid ${color}`,
      overflow: "hidden", marginBottom: 0,
    }}>
      <div style={{
        padding: "12px 16px", borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", gap: 8,
        background: `${color}06`,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: iconBg,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
        }}>
          {icon}
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{title}</span>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

function DrawerContent({
  rec, lang,
}: {
  rec: any; lang: Lang;
}) {
  const t = (en: string, np: string) => lang === "en" ? en : np;
  const uc = { low: "#0284c7", medium: "#d97706", high: "#dc2626" } as const;

  const crop       = rec.confirmed_crop ?? rec.result?.crop?.crop ?? rec.result?.crop;
  const cropConf   = rec.crop_confidence ?? rec.result?.crop?.confidence;
  const cropTop3   = rec.crop_top_3 ?? rec.result?.crop?.top_3_crops;
  const soil       = rec.soil ?? rec.result?.soil;
  const fertilizer = rec.fertilizer ?? rec.result?.fertilizer;
  const irrigation = rec.irrigation ?? rec.result?.irrigation;
  const advice     = rec.advice;
  const sensorData = rec.sensor_data_used;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Crop */}
      {crop && (
        <DrawerSection icon="🌾" color="#2d6a2d" iconBg="#2d6a2d18"
          title={t("Crop Recommendation", "बाली सिफारिस")}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#2d6a2d", textTransform: "capitalize", marginBottom: 8 }}>
            {crop}
          </div>
          {cropConf != null && (
            <ConfRow label={t("Confidence", "विश्वास")} value={cropConf} color="#2d6a2d" />
          )}
          {cropTop3 && cropTop3.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>
                {t("Top 3 Matches", "शीर्ष ३ मिलान")}
              </div>
              {cropTop3.map((c: any, i: number) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ color: T.textMuted, fontSize: 13 }}>
                    {["🥇","🥈","🥉"][i]}{" "}
                    <span style={{ textTransform: "capitalize" }}>{c.label}</span>
                  </span>
                  <span style={{ color: "#2d6a2d", fontFamily: F.mono, fontSize: 13, fontWeight: 600 }}>
                    {Math.round(c.probability * 100)}%
                  </span>
                </div>
              ))}
            </div>
          )}
          {advice?.crop && (
            <AdviceSection
              adviceEn={advice.crop.advice_en} adviceNp={advice.crop.advice_np}
              source={advice.crop.source} lang={lang}
            />
          )}
        </DrawerSection>
      )}

      {/* Soil */}
      {soil && (
        <DrawerSection
          icon="🌿"
          color={({"High":"#2d6a2d","Medium":"#d97706","Low":"#dc2626"} as any)[soil.fertility_class] ?? "#0d9488"}
          iconBg={`${({"High":"#2d6a2d","Medium":"#d97706","Low":"#dc2626"} as any)[soil.fertility_class] ?? "#0d9488"}18`}
          title={t("Soil Fertility", "माटो उर्वरता")}
        >
          <SoilFertilityCard
            fertility_class={soil.fertility_class}
            confidence={soil.confidence}
            confidence_pct={soil.confidence_pct}
            class_probs={soil.class_probs}
            advice={soil.advice}
            explanation={soil.explanation}
            lang={lang}
            adviceEn={advice?.soil?.advice_en}
            adviceNp={advice?.soil?.advice_np}
            adviceSource={advice?.soil?.source}
            embedded
          />
        </DrawerSection>
      )}

      {/* Irrigation */}
      {irrigation && (() => {
        const urgency = (irrigation.urgency ?? "low") as "low" | "medium" | "high";
        const c = uc[urgency] ?? "#0d9488";
        return (
          <DrawerSection icon="💧" color={c} iconBg={`${c}18`}
            title={t("Irrigation", "सिँचाई")}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Badge text={urgency.toUpperCase()} color={c} size="sm" />
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: c, marginBottom: 10, wordBreak: "break-word" }}>
              {irrigation.action?.replace(/_/g, " ")}
            </div>
            <ConfRow label={t("Confidence", "विश्वास")} value={irrigation.confidence} color={c} />
            {irrigation.water_amount_mm && (
              <div style={{ margin: "12px 0", padding: 12, borderRadius: 10, background: `${c}08`, border: `1px solid ${c}20`, textAlign: "center" }}>
                <div style={{ fontFamily: F.mono, fontSize: 28, fontWeight: 700, color: c }}>
                  {irrigation.water_amount_mm}
                  <span style={{ fontSize: 13, color: T.textMuted, marginLeft: 4 }}>mm</span>
                </div>
                <div style={{ fontSize: 11, color: T.textMuted }}>
                  {t("Recommended water volume", "सिफारिस पानी मात्रा")}
                </div>
              </div>
            )}
            {irrigation.advice && (
              <p style={{ color: T.textMuted, fontSize: 13, lineHeight: 1.6 }}>{irrigation.advice}</p>
            )}
            {advice?.irrigation && (
              <AdviceSection
                adviceEn={advice.irrigation.advice_en} adviceNp={advice.irrigation.advice_np}
                source={advice.irrigation.source} lang={lang}
              />
            )}
          </DrawerSection>
        );
      })()}

      {/* Fertilizer */}
      {fertilizer && (
        <DrawerSection icon="🧪" color="#d97706" iconBg="#d9770618"
          title={t("Fertilizer", "मलखाद")}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#d97706" }}>{fertilizer.fertilizer}</div>
            <Badge text={fertilizer.confidence_pct} color="#d97706" size="sm" />
          </div>
          <ConfRow label={t("Confidence", "विश्वास")} value={fertilizer.confidence} color="#d97706" />
          {fertilizer.advice && (
            <p style={{ color: T.textMuted, fontSize: 13, lineHeight: 1.6, margin: "10px 0" }}>{fertilizer.advice}</p>
          )}
          {fertilizer.npk_status && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>
                {t("NPK Status", "एनपीके अवस्था")}
              </div>
              {Object.entries(fertilizer.npk_status).map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ color: T.textMuted, fontSize: 13, textTransform: "capitalize" }}>{k}</span>
                  <Badge
                    text={v as string}
                    color={(v as string) === "optimal" ? "#2d6a2d" : (v as string) === "low" ? "#dc2626" : "#d97706"}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          )}
          {advice?.fertilizer && (
            <AdviceSection
              adviceEn={advice.fertilizer.advice_en} adviceNp={advice.fertilizer.advice_np}
              source={advice.fertilizer.source} lang={lang}
            />
          )}
        </DrawerSection>
      )}

      {/* Sensor Data */}
      {sensorData && (
        <DrawerSection icon="📊" color="#7c3aed" iconBg="#7c3aed15"
          title={t("Data Used for This Report", "यस रिपोर्टका लागि प्रयोग गरिएको डेटा")}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10 }}>
            {Object.entries(sensorData).map(([k, v]) => (
              <div key={k} style={{ padding: "8px 10px", background: T.cardHover, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 2, textTransform: "capitalize" }}>
                  {k.replace(/_/g, " ")}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#2d6a2d", fontFamily: F.mono }}>
                  {typeof v === "number" ? v.toFixed(1) : String(v)}
                </div>
              </div>
            ))}
          </div>
        </DrawerSection>
      )}
    </div>
  );
}

function HistoryDetailDrawer({
  reportId, lang, onClose,
}: {
  reportId: string; lang: Lang; onClose: () => void;
}) {
  const [rec, setRec]         = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setErr(null); setRec(null);
    getRecommendationById(reportId)
      .then((data: any) => { if (!cancelled) setRec(data); })
      .catch((e: any)  => { if (!cancelled) setErr(e.message ?? String(e)); })
      .finally(()      => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reportId]);

  const color = TYPE_COLOR[rec?.type ?? "full"] ?? "#0d9488";
  const icon  = TYPE_ICON[rec?.type  ?? "full"] ?? "🤖";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.45)", zIndex: 100,
        }}
      />

      {/* Drawer panel */}
      <div style={{
        position: "fixed", top: 0, right: 0,
        width: "min(55vw, 860px)", height: "100vh",
        background: "#f1f5f9",
        borderLeft: `1px solid #94a3b8`,
        zIndex: 101,
        display: "flex", flexDirection: "column",
        boxShadow: "-8px 0 32px rgba(0,0,0,0.18)",
        overflow: "hidden",
      }}>

        {/* Drawer header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: `1px solid #94a3b8`,
          background: "#ffffff",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          flexShrink: 0,
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: T.text, textTransform: "capitalize" }}>
                {rec?.type ?? "—"} Recommendation
              </span>
              {rec?.report_id && (
                <span style={{ fontSize: 11, color: T.textMuted, fontFamily: F.mono }}>
                  #{rec.report_id}
                </span>
              )}
            </div>
            {rec?.created_at && (
              <div style={{ fontSize: 12, color: T.textMuted }}>
                {new Date(rec.created_at).toLocaleString()}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8,
              border: `1px solid #94a3b8`, background: "#f8fafc",
              cursor: "pointer", fontSize: 18, lineHeight: 1,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: T.textMuted,
            }}
          >
            ×
          </button>
        </div>

        {/* Drawer body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{
                  height: 110, borderRadius: 14,
                  background: `linear-gradient(90deg,#f8fafc 25%,#e2e8f0 50%,#f8fafc 75%)`,
                  backgroundSize: "200% 100%",
                }} />
              ))}
            </div>
          )}
          {err && (
            <div style={{
              padding: "12px 16px", borderRadius: 10,
              background: "#fee2e2", border: "1px solid #fca5a5",
              color: "#991b1b", fontSize: 13,
            }}>
              Failed to load report: {err}
            </div>
          )}
          {rec && !loading && <DrawerContent rec={rec} lang={lang} />}
        </div>
      </div>
    </>
  );
}

export default function HistoryPage() {
  const [lang,       setLang]       = useState<Lang>("en");
  const [page,       setPage]       = useState(1);
  const [filter,     setFilter]     = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, loading, error } = usePolling(
    useCallback(() => getRecommendHistory(undefined, page), [page]),
    0
  ) as { data: { records: HistoryRecord[]; total: number; page: number } | null; loading: boolean; error: any };

  const records = data?.records ?? [];
  const total   = data?.total   ?? 0;
  const totalPages = Math.ceil(total / 20) || 1;

  const filtered = filter === "all"
    ? records
    : records.filter(r => r.type === filter);

  const fmtDate = (iso: string) => {
    try { return new Date(iso).toLocaleString(); }
    catch { return iso; }
  };

  return (
    <div style={{ backgroundColor: T.bg, minHeight: "100vh", padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: T.text, marginBottom: 4, letterSpacing: "-0.02em" }}>
            {lang === "en" ? "Recommendation History" : "सिफारिस इतिहास"}
          </h1>
          <p style={{ fontSize: 13, color: T.textMuted }}>
            {lang === "en"
              ? `${total} recommendations saved · All your AI advisory records`
              : `${total} सिफारिस सुरक्षित · सबै एआई सल्लाह अभिलेख`}
          </p>
        </div>
        <LanguageToggle lang={lang} onChange={setLang} />
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {["all", "full", "crop", "fertilizer", "irrigation", "soil"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "6px 14px", borderRadius: 20,
              border: `1.5px solid ${filter === f ? (TYPE_COLOR[f] ?? "#2d6a2d") : T.border}`,
              background: filter === f ? `${(TYPE_COLOR[f] ?? "#2d6a2d")}15` : T.cardHover,
              color: filter === f ? (TYPE_COLOR[f] ?? "#2d6a2d") : T.textMuted,
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {TYPE_ICON[f] ?? ""} {f}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: "12px 16px", borderRadius: 10, marginBottom: 16,
          background: "#fee2e2", border: "1px solid #fca5a5",
          color: "#991b1b", fontSize: 13,
        }}>
          {lang === "en" ? "Failed to load history. " : "इतिहास लोड गर्न असफल। "}
          {error?.message ?? String(error)}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              height: 80, borderRadius: 14,
              background: `linear-gradient(90deg, ${T.cardHover} 25%, ${T.overlay} 50%, ${T.cardHover} 75%)`,
              animation: "shimmer 1.4s infinite",
              backgroundSize: "200% 100%",
            }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div style={{
          textAlign: "center", padding: "60px 20px",
          background: T.surface, borderRadius: 20,
          border: `1px solid ${T.border}`,
        }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>📋</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: T.text, marginBottom: 8 }}>
            {lang === "en" ? "No history yet" : "अहिले इतिहास छैन"}
          </h3>
          <p style={{ fontSize: 13, color: T.textMuted }}>
            {lang === "en"
              ? "Your recommendation history will appear here."
              : "तपाईंको सिफारिस इतिहास यहाँ देखिनेछ।"}
          </p>
        </div>
      )}

      {/* Records list */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(rec => {
            const color = TYPE_COLOR[rec.type] ?? T.teal;
            const icon  = TYPE_ICON[rec.type]  ?? "🤖";
            const result = rec.result as any;
            const crop       = result?.crop?.crop       ?? result?.crop;
            const fertilizer = result?.fertilizer?.fertilizer ?? result?.fertilizer;
            const fertility  = result?.soil?.fertility_class ?? result?.fertility_class;
            const irrigation = result?.irrigation?.action;

            return (
              <div
                key={rec.id}
                onClick={() => setSelectedId(rec.report_id ?? null)}
                style={{
                  padding: "16px 20px",
                  background: T.surface,
                  borderRadius: 14,
                  border: `1px solid ${T.border}`,
                  borderLeft: `4px solid ${color}`,
                  transition: "all 0.2s",
                  cursor: "pointer",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = T.cardHover)}
                onMouseLeave={e => (e.currentTarget.style.background = T.surface)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{icon}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: T.text, textTransform: "capitalize" }}>
                        {rec.type} Recommendation
                      </div>
                      <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                        {fmtDate(rec.created_at)}
                        {rec.report_id && (
                          <span style={{ marginLeft: 8, fontFamily: F.mono, color: T.textDim }}>
                            #{rec.report_id}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    {rec.confidence != null && (
                      <span style={{
                        padding: "2px 8px", borderRadius: 12,
                        background: `${color}15`, color, fontSize: 11, fontWeight: 700,
                      }}>
                        {Math.round(rec.confidence * 100)}%
                      </span>
                    )}
                    {rec.advice_source && (
                      <span style={{
                        padding: "2px 8px", borderRadius: 12,
                        background: rec.advice_source === "gemini" ? "#d1fae5" : "#dbeafe",
                        color: rec.advice_source === "gemini" ? "#065f46" : "#1e3a8a",
                        fontSize: 10, fontWeight: 600,
                      }}>
                        {rec.advice_source === "gemini" ? "Gemini AI" : "Template"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Result summary chips */}
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  {crop && (
                    <span style={{
                      padding: "3px 10px", borderRadius: 8,
                      background: "#e8f4e8", color: "#2d6a2d",
                      fontSize: 12, fontWeight: 500, textTransform: "capitalize",
                    }}>
                      🌾 {crop}
                    </span>
                  )}
                  {fertilizer && (
                    <span style={{
                      padding: "3px 10px", borderRadius: 8,
                      background: "#fef3c7", color: "#d97706",
                      fontSize: 12, fontWeight: 500,
                    }}>
                      🧪 {fertilizer}
                    </span>
                  )}
                  {fertility && (
                    <span style={{
                      padding: "3px 10px", borderRadius: 8,
                      background: `${TYPE_COLOR.soil}15`, color: TYPE_COLOR.soil,
                      fontSize: 12, fontWeight: 500,
                    }}>
                      🌱 {fertility}
                    </span>
                  )}
                  {irrigation && (
                    <span style={{
                      padding: "3px 10px", borderRadius: 8,
                      background: "#dbeafe", color: "#1e3a8a",
                      fontSize: 12, fontWeight: 500,
                    }}>
                      💧 {String(irrigation).split("—")[0].trim()}
                    </span>
                  )}
                </div>

                {/* Advice preview */}
                {(rec.advice_en || rec.advice_np) && (
                  <p style={{
                    marginTop: 10, fontSize: 12,
                    color: T.textDim, lineHeight: 1.55,
                    overflow: "hidden", display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical" as any,
                  }}>
                    {lang === "en" ? rec.advice_en : rec.advice_np}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            style={{
              padding: "8px 16px", borderRadius: 8, border: `1px solid ${T.border}`,
              background: T.surface, color: page <= 1 ? T.textMuted : T.text,
              cursor: page <= 1 ? "default" : "pointer", fontWeight: 500,
            }}
          >
            ← {lang === "en" ? "Prev" : "अघिल्लो"}
          </button>
          <span style={{ padding: "8px 16px", fontSize: 13, color: T.textMuted, alignSelf: "center" }}>
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            style={{
              padding: "8px 16px", borderRadius: 8, border: `1px solid ${T.border}`,
              background: T.surface, color: page >= totalPages ? T.textMuted : T.text,
              cursor: page >= totalPages ? "default" : "pointer", fontWeight: 500,
            }}
          >
            {lang === "en" ? "Next" : "अर्को"} →
          </button>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {selectedId && (
        <HistoryDetailDrawer
          reportId={selectedId}
          lang={lang}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
