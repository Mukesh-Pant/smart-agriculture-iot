"use client";
import { useState } from "react";
import { T } from "./DashboardComponents";
import type { Lang } from "./LanguageToggle";
import { BACKEND_URL } from "@/app/services/api";

interface AdviceRequest {
  advice_type: "crop" | "fertilizer" | "irrigation" | "soil";
  crop?:         string;
  fertilizer?:   string;
  fertility_class?: string;
  irrigation_class?: number;
  irrigation_action?: string;
  confidence?:   number;
  nitrogen?:     number;
  phosphorus?:   number;
  potassium?:    number;
  ph?:           number;
  moisture?:     number;
  temperature?:  number;
  humidity?:     number;
  rainfall?:     number;
  crop_type?:    string;
  soil_type?:    string;
  soil_moisture?: number;
}

interface AdviceResult {
  advice_en: string;
  advice_np: string;
  source:    string;
}

interface Props {
  request: AdviceRequest;
  lang:    Lang;
}

export default function AdviceSection({ request, lang }: Props) {
  const [result,  setResult]  = useState<AdviceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const fetchAdvice = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/recommend/advice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message ?? "Failed to fetch advice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 16 }}>
      {!result && (
        <button
          onClick={fetchAdvice}
          disabled={loading}
          style={{
            width: "100%",
            padding: "11px 16px",
            borderRadius: 10,
            border: `1.5px solid #2d6a2d`,
            background: loading ? T.cardHover : "#2d6a2d",
            color: loading ? T.textMuted : "#fff",
            fontWeight: 600,
            fontSize: 13,
            cursor: loading ? "default" : "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {loading ? (
            <>
              <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
              {lang === "en" ? "Generating advice…" : "सल्लाह तयार गर्दै…"}
            </>
          ) : (
            <>
              <span>📋</span>
              {lang === "en" ? "Get Detailed Advice" : "विस्तृत सल्लाह लिनुहोस्"}
            </>
          )}
        </button>
      )}

      {error && (
        <div style={{
          marginTop: 10, padding: "8px 12px",
          borderRadius: 8, background: "#fee2e2",
          border: "1px solid #fca5a5",
          fontSize: 12, color: "#991b1b",
        }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{
          marginTop: 12,
          padding: "14px 16px",
          borderRadius: 12,
          background: "#fffbf0",
          border: "1.5px solid #d4a017",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#9a7212" }}>
              {lang === "en" ? "📋 Detailed Advice" : "📋 विस्तृत सल्लाह"}
            </span>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{
                fontSize: 10, padding: "2px 7px", borderRadius: 8,
                background: result.source === "gemini" ? "#d1fae5" : "#dbeafe",
                color: result.source === "gemini" ? "#065f46" : "#1e3a8a",
                fontWeight: 600,
              }}>
                {result.source === "gemini" ? "Gemini AI" : "Offline"}
              </span>
              <button
                onClick={() => setResult(null)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 14, color: T.textMuted, padding: "0 2px",
                }}
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
          <p style={{ fontSize: 13, color: "#1a1a1a", lineHeight: 1.65, margin: 0 }}>
            {lang === "en" ? result.advice_en : result.advice_np}
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
