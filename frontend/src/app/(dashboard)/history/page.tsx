"use client";
import { useCallback, useState } from "react";
import { T, F } from "../_components/DashboardComponents";
import { usePolling } from "@/app/hooks/useApi";
import { getRecommendHistory } from "@/app/services/api";
import LanguageToggle, { type Lang } from "../_components/LanguageToggle";

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

export default function HistoryPage() {
  const [lang,   setLang]   = useState<Lang>("en");
  const [page,   setPage]   = useState(1);
  const [filter, setFilter] = useState<string>("all");

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
                style={{
                  padding: "16px 20px",
                  background: T.surface,
                  borderRadius: 14,
                  border: `1px solid ${T.border}`,
                  borderLeft: `4px solid ${color}`,
                  transition: "all 0.2s",
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
    </div>
  );
}
