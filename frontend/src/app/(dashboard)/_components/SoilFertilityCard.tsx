"use client";
import { T, F, ConfRow } from "./DashboardComponents";
import type { Lang } from "./LanguageToggle";
import AdviceSection from "./AdviceSection";

interface ClassProbs { Low?: number; Medium?: number; High?: number; [k: string]: number | undefined }

interface Props {
  fertility_class: string;
  confidence: number;
  confidence_pct: string;
  class_probs?: ClassProbs;
  advice?: string;
  explanation?: Record<string, number> | null;
  lang: Lang;
  adviceEn?: string;
  adviceNp?: string;
  adviceSource?: string;
  embedded?: boolean;  // strips outer card wrapper and header when inside SectionCard
}

const COLORS: Record<string, string> = {
  High: "#2d6a2d",
  Medium: "#d97706",
  Low:  "#dc2626",
};

const FERTILITY_ICON: Record<string, string> = {
  High: "🌿", Medium: "🌱", Low: "🍂",
};

const ADVICE_NP: Record<string, string> = {
  Low:    "माटोको उर्वरता कम छ। कम्पोस्ट र एनपीके मल प्रयोग गर्नुहोस्।",
  Medium: "माटोको उर्वरता मध्यम छ। नियमित जैविक पदार्थ थप्नुहोस्।",
  High:   "माटोको उर्वरता उच्च छ। उत्कृष्ट अवस्था। नियमित अनुगमन गर्नुहोस्।",
};

export default function SoilFertilityCard({
  fertility_class, confidence, confidence_pct, class_probs,
  advice, explanation, lang, adviceEn, adviceNp, adviceSource, embedded,
}: Props) {
  const color = COLORS[fertility_class] ?? T.teal;
  const icon  = FERTILITY_ICON[fertility_class] ?? "🌱";
  const barWidth = (v?: number) => `${Math.round((v ?? 0) * 100)}%`;

  const content = (
    <>
      {/* Main prediction */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 32, fontWeight: 700, color, letterSpacing: "-0.02em" }}>
          {fertility_class}
        </div>
        <span style={{
          padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
          background: `${color}15`, color,
        }}>
          {confidence_pct}
        </span>
      </div>

      <ConfRow label={lang === "en" ? "Model confidence" : "मोडल विश्वास"} value={confidence} color={color} />

      {/* Class probability bars */}
      {class_probs && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
            {lang === "en" ? "Class Probabilities" : "वर्ग सम्भाव्यता"}
          </div>
          {(["High", "Medium", "Low"] as const).map((cls) => {
            const pct = class_probs[cls] ?? 0;
            const c2  = COLORS[cls];
            return (
              <div key={cls} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 12, color: T.textSub, fontWeight: cls === fertility_class ? 700 : 400 }}>{cls}</span>
                  <span style={{ fontSize: 12, color: c2, fontFamily: F.mono, fontWeight: 600 }}>
                    {Math.round(pct * 100)}%
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 4, background: `${c2}22` }}>
                  <div style={{
                    height: "100%", borderRadius: 4, background: c2,
                    width: barWidth(pct),
                    transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Static advice (fallback) */}
      {!adviceEn && (advice || ADVICE_NP[fertility_class]) && (
        <div style={{
          marginTop: 14, padding: "10px 12px", borderRadius: 10,
          background: `${color}08`, border: `1px solid ${color}20`,
        }}>
          <p style={{ fontSize: 12, color: T.textSub, lineHeight: 1.6, margin: 0 }}>
            {lang === "en" ? (advice ?? "") : (ADVICE_NP[fertility_class] ?? "")}
          </p>
        </div>
      )}

      {/* LIME feature importances */}
      {explanation && Object.keys(explanation).length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
            {lang === "en" ? "Key Factors (LIME)" : "मुख्य कारकहरू (LIME)"}
          </div>
          {Object.entries(explanation)
            .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
            .slice(0, 4)
            .map(([feat, val]) => {
              const pos = val > 0;
              const barPct = Math.min(Math.abs(val) * 200, 100);
              return (
                <div key={feat} style={{ marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 11, color: T.textDim }}>{feat}</span>
                    <span style={{ fontSize: 11, color: pos ? "#2d6a2d" : "#dc2626", fontFamily: F.mono }}>
                      {pos ? "+" : ""}{val.toFixed(3)}
                    </span>
                  </div>
                  <div style={{ height: 4, borderRadius: 3, background: T.cardHover }}>
                    <div style={{
                      height: "100%", borderRadius: 3,
                      background: pos ? "#2d6a2d" : "#dc2626",
                      width: `${barPct}%`,
                    }} />
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Gemini advice (auto-generated, passed from parent) */}
      {adviceEn && adviceSource && (
        <AdviceSection
          adviceEn={adviceEn}
          adviceNp={adviceNp ?? ""}
          source={adviceSource}
          lang={lang}
        />
      )}
    </>
  );

  if (embedded) return <>{content}</>;

  return (
    <div style={{
      padding: "24px",
      background: T.surface,
      borderRadius: "20px",
      border: `1px solid ${T.border}`,
      height: "100%",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: `${color}18`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20,
        }}>
          {icon}
        </div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 2 }}>
            {lang === "en" ? "Soil Fertility" : "माटो उर्वरता"}
          </h3>
          <p style={{ fontSize: 12, color: T.textMuted }}>
            {lang === "en" ? "TabNet AI analysis" : "ट्याबनेट एआई विश्लेषण"}
          </p>
        </div>
      </div>
      {content}
    </div>
  );
}
