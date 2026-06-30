"use client";
import React, { useCallback, useEffect, useState } from "react";
import { T, F, ConfRow, Badge } from "../_components/DashboardComponents";
import { usePolling } from "@/app/hooks/useApi";
import { getRecommendHistory, getRecommendationById } from "@/app/services/api";
import LanguageToggle, { type Lang } from "../_components/LanguageToggle";
import SoilFertilityCard from "../_components/SoilFertilityCard";
import AdviceSection from "../_components/AdviceSection";
import { IconChip, RankIcon } from "../_components/Icons";
import {
  Wheat, FlaskConical, Droplets, Layers, Sparkles, BarChart3,
  Leaf, ChevronRight, ClipboardList, ChevronLeft, X, Clock, Hash,
  type LucideIcon,
} from "lucide-react";

// ── Type → visual config (icon + colour + label) ──────────────
type TypeKey = "crop" | "fertilizer" | "irrigation" | "soil" | "full" | "complete" | string;

const TYPE_META: Record<string, { color: string; icon: LucideIcon; label: string }> = {
  crop:       { color: "#2d6a2d", icon: Wheat,        label: "Crop" },
  fertilizer: { color: "#d97706", icon: FlaskConical, label: "Fertilizer" },
  irrigation: { color: "#0284c7", icon: Droplets,     label: "Irrigation" },
  soil:       { color: "#7c3aed", icon: Layers,       label: "Soil" },
  full:       { color: "#0d9488", icon: Sparkles,     label: "Complete" },
  complete:   { color: "#0d9488", icon: Sparkles,     label: "Complete" },
};

function metaFor(type: TypeKey) {
  return TYPE_META[type] ?? TYPE_META.full;
}

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

// ════════════════════════════════════════════════════════════
// DRAWER
// ════════════════════════════════════════════════════════════

function DrawerSection({
  icon, color, title, children,
}: {
  icon: LucideIcon; color: string; title: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      background: T.surface, borderRadius: 14,
      border: `1px solid ${T.border}`,
      borderLeft: `4px solid ${color}`,
      overflow: "hidden",
    }}>
      <div style={{
        padding: "12px 16px", borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", gap: 10,
        background: `${color}06`,
      }}>
        <IconChip icon={icon} color={color} size={32} iconSize={16} />
        <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{title}</span>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

function DrawerContent({ rec, lang }: { rec: any; lang: Lang }) {
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

  const soilColor = ({ High: "#2d6a2d", Medium: "#d97706", Low: "#dc2626" } as any)[soil?.fertility_class] ?? "#0d9488";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Crop */}
      {crop && (
        <DrawerSection icon={Wheat} color="#2d6a2d" title={t("Crop Recommendation", "बाली सिफारिस")}>
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
                  <span style={{ color: T.textMuted, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 7 }}>
                    <RankIcon rank={i} />
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
            <AdviceSection adviceEn={advice.crop.advice_en} adviceNp={advice.crop.advice_np} source={advice.crop.source} lang={lang} />
          )}
        </DrawerSection>
      )}

      {/* Soil */}
      {soil && (
        <DrawerSection icon={Layers} color={soilColor} title={t("Soil Fertility", "माटो उर्वरता")}>
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
          <DrawerSection icon={Droplets} color={c} title={t("Irrigation", "सिँचाई")}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Badge text={urgency.toUpperCase()} color={c} size="sm" />
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: c, marginBottom: 10, wordBreak: "break-word" }}>
              {irrigation.action?.replace(/_/g, " ").replace(/—|–/g, "-")}
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
              <AdviceSection adviceEn={advice.irrigation.advice_en} adviceNp={advice.irrigation.advice_np} source={advice.irrigation.source} lang={lang} />
            )}
          </DrawerSection>
        );
      })()}

      {/* Fertilizer */}
      {fertilizer && (
        <DrawerSection icon={FlaskConical} color="#d97706" title={t("Fertilizer", "मलखाद")}>
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
            <AdviceSection adviceEn={advice.fertilizer.advice_en} adviceNp={advice.fertilizer.advice_np} source={advice.fertilizer.source} lang={lang} />
          )}
        </DrawerSection>
      )}

      {/* Sensor Data */}
      {sensorData && (
        <DrawerSection icon={BarChart3} color="#7c3aed" title={t("Data Used for This Report", "यस रिपोर्टका लागि प्रयोग गरिएको डेटा")}>
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

function HistoryDetailDrawer({ reportId, lang, onClose }: { reportId: string; lang: Lang; onClose: () => void }) {
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

  const meta = metaFor(rec?.type ?? "full");

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 100, backdropFilter: "blur(2px)" }} />
      <div style={{
        position: "fixed", top: 0, right: 0,
        width: "min(55vw, 860px)", height: "100vh",
        background: T.bg, borderLeft: `1px solid ${T.border}`,
        zIndex: 101, display: "flex", flexDirection: "column",
        boxShadow: "-8px 0 32px rgba(0,0,0,0.18)", overflow: "hidden",
      }}>
        {/* header */}
        <div style={{
          padding: "20px 24px", borderBottom: `1px solid ${T.border}`, background: T.surface,
          display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <IconChip icon={meta.icon} color={meta.color} size={40} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: T.text }}>
                  {meta.label} {lang === "en" ? "Recommendation" : "सिफारिस"}
                </span>
                {rec?.report_id && (
                  <span style={{ fontSize: 11, color: T.textMuted, fontFamily: F.mono, display: "inline-flex", alignItems: "center", gap: 2 }}>
                    <Hash size={11} />{rec.report_id}
                  </span>
                )}
              </div>
              {rec?.created_at && (
                <div style={{ fontSize: 12, color: T.textMuted, display: "flex", alignItems: "center", gap: 5 }}>
                  <Clock size={12} /> {new Date(rec.created_at).toLocaleString()}
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.border}`, background: T.cardHover,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.textMuted,
          }}>
            <X size={18} />
          </button>
        </div>

        {/* body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ height: 110, borderRadius: 14, background: `linear-gradient(90deg,${T.cardHover} 25%,${T.overlay} 50%,${T.cardHover} 75%)`, backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
              ))}
            </div>
          )}
          {err && (
            <div style={{ padding: "12px 16px", borderRadius: 10, background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", fontSize: 13 }}>
              Failed to load report: {err}
            </div>
          )}
          {rec && !loading && <DrawerContent rec={rec} lang={lang} />}
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════
// LIST PAGE
// ════════════════════════════════════════════════════════════

const FILTERS = ["all", "full", "crop", "fertilizer", "irrigation", "soil"] as const;

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

  // "full" filter matches both legacy "full" and current "complete" report type.
  const matchesFilter = (r: HistoryRecord) =>
    filter === "all" ? true
    : filter === "full" ? (r.type === "full" || r.type === "complete")
    : r.type === filter;
  const filtered = records.filter(matchesFilter);

  const t = (en: string, np: string) => lang === "en" ? en : np;
  const fmtDate = (iso: string) => { try { return new Date(iso).toLocaleString(); } catch { return iso; } };

  return (
    <div style={{ backgroundColor: T.bg, minHeight: "100vh", padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: T.text, marginBottom: 4, letterSpacing: "-0.02em" }}>
            {t("Recommendation History", "सिफारिस इतिहास")}
          </h1>
          <p style={{ fontSize: 13, color: T.textMuted }}>
            {t(`${total} recommendations saved · All your AI advisory records`,
               `${total} सिफारिस सुरक्षित · सबै एआई सल्लाह अभिलेख`)}
          </p>
        </div>
        <LanguageToggle lang={lang} onChange={setLang} />
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {FILTERS.map(f => {
          const active = filter === f;
          const meta = f === "all" ? null : metaFor(f);
          const color = meta?.color ?? "#2d6a2d";
          const Ic = meta?.icon ?? ClipboardList;
          const label = f === "all" ? t("All", "सबै") : meta!.label;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 20,
                border: `1.5px solid ${active ? color : T.border}`,
                background: active ? `${color}12` : T.surface,
                color: active ? color : T.textMuted,
                fontSize: 12.5, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
              }}
            >
              <Ic size={14} strokeWidth={2.2} /> {label}
            </button>
          );
        })}
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 10, marginBottom: 16, background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", fontSize: 13 }}>
          {t("Failed to load history. ", "इतिहास लोड गर्न असफल। ")}{error?.message ?? String(error)}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ height: 92, borderRadius: 16, background: `linear-gradient(90deg, ${T.cardHover} 25%, ${T.overlay} 50%, ${T.cardHover} 75%)`, animation: "shimmer 1.4s infinite", backgroundSize: "200% 100%" }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", background: T.surface, borderRadius: 20, border: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <ClipboardList size={48} color={T.textDim} strokeWidth={1.5} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 8 }}>
            {t("No history yet", "अहिले इतिहास छैन")}
          </h3>
          <p style={{ fontSize: 13, color: T.textMuted }}>
            {t("Your recommendation history will appear here.", "तपाईंको सिफारिस इतिहास यहाँ देखिनेछ।")}
          </p>
        </div>
      )}

      {/* Records */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(rec => (
            <HistoryRow key={rec.id} rec={rec} lang={lang} onOpen={() => setSelectedId(rec.report_id ?? null)} fmtDate={fmtDate} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "8px 16px", borderRadius: 8, border: `1px solid ${T.border}`,
            background: T.surface, color: page <= 1 ? T.textMuted : T.text, cursor: page <= 1 ? "default" : "pointer", fontWeight: 500,
          }}>
            <ChevronLeft size={15} /> {t("Prev", "अघिल्लो")}
          </button>
          <span style={{ padding: "8px 16px", fontSize: 13, color: T.textMuted, alignSelf: "center" }}>{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "8px 16px", borderRadius: 8, border: `1px solid ${T.border}`,
            background: T.surface, color: page >= totalPages ? T.textMuted : T.text, cursor: page >= totalPages ? "default" : "pointer", fontWeight: 500,
          }}>
            {t("Next", "अर्को")} <ChevronRight size={15} />
          </button>
        </div>
      )}

      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>

      {selectedId && (
        <HistoryDetailDrawer reportId={selectedId} lang={lang} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}

// ── Single history row card ───────────────────────────────────
function HistoryRow({ rec, lang, onOpen, fmtDate }: { rec: HistoryRecord; lang: Lang; onOpen: () => void; fmtDate: (s: string) => string }) {
  const [hov, setHov] = useState(false);
  const meta = metaFor(rec.type);
  const result = rec.result as any;

  const crop       = result?.crop?.crop       ?? result?.crop ?? (rec as any).confirmed_crop;
  const fertilizer = result?.fertilizer?.fertilizer ?? result?.fertilizer ?? (rec as any).fertilizer?.fertilizer;
  const fertility  = result?.soil?.fertility_class ?? result?.fertility_class ?? (rec as any).soil?.fertility_class;
  const irrigation = result?.irrigation?.action ?? (rec as any).irrigation?.action;

  const chips: Array<{ icon: LucideIcon; color: string; bg: string; text: string }> = [];
  if (crop)       chips.push({ icon: Wheat,        color: "#2d6a2d", bg: "#e8f4e8", text: String(crop) });
  if (fertilizer) chips.push({ icon: FlaskConical, color: "#d97706", bg: "#fef3c7", text: String(fertilizer) });
  if (fertility)  chips.push({ icon: Layers,       color: "#7c3aed", bg: "#f3e8ff", text: String(fertility) });
  if (irrigation) chips.push({ icon: Droplets,     color: "#0284c7", bg: "#dbeafe", text: String(irrigation).split(/[—–-]/)[0].trim() });

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 16,
        padding: "16px 20px",
        background: hov ? T.cardHover : T.surface,
        borderRadius: 16,
        border: `1px solid ${hov ? meta.color : T.border}`,
        borderLeft: `4px solid ${meta.color}`,
        boxShadow: hov ? `0 8px 22px -8px ${meta.color}55` : "0 1px 4px rgba(0,0,0,0.05)",
        transform: hov ? "translateY(-1px)" : "none",
        transition: "all 0.18s", cursor: "pointer",
      }}
    >
      <IconChip icon={meta.icon} color={meta.color} size={44} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14.5, fontWeight: 700, color: T.text }}>
            {meta.label} {lang === "en" ? "Recommendation" : "सिफारिस"}
          </span>
          {rec.confidence != null && (
            <span style={{ padding: "2px 8px", borderRadius: 12, background: `${meta.color}15`, color: meta.color, fontSize: 11, fontWeight: 700 }}>
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

        <div style={{ fontSize: 11.5, color: T.textMuted, marginTop: 3, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Clock size={11} />{fmtDate(rec.created_at)}</span>
          {rec.report_id && (
            <span style={{ fontFamily: F.mono, color: T.textDim, display: "inline-flex", alignItems: "center", gap: 2 }}>
              <Hash size={10} />{rec.report_id}
            </span>
          )}
        </div>

        {chips.length > 0 && (
          <div style={{ display: "flex", gap: 7, marginTop: 10, flexWrap: "wrap" }}>
            {chips.map((c, i) => {
              const Ic = c.icon;
              return (
                <span key={i} style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "3px 10px", borderRadius: 8, background: c.bg, color: c.color,
                  fontSize: 12, fontWeight: 600, textTransform: "capitalize",
                }}>
                  <Ic size={13} strokeWidth={2.2} /> {c.text}
                </span>
              );
            })}
          </div>
        )}

        {(rec.advice_en || rec.advice_np) && (
          <p style={{ marginTop: 10, marginBottom: 0, fontSize: 12, color: T.textDim, lineHeight: 1.55, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any }}>
            {lang === "en" ? rec.advice_en : rec.advice_np}
          </p>
        )}
      </div>

      <ChevronRight size={20} color={hov ? meta.color : T.textDim} style={{ flexShrink: 0, transition: "all 0.18s", transform: hov ? "translateX(2px)" : "none" }} />
    </div>
  );
}
