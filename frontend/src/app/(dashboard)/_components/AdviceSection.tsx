"use client";
import { ClipboardList } from "lucide-react";
import { T } from "./DashboardComponents";
import type { Lang } from "./LanguageToggle";

interface Props {
  adviceEn: string;
  adviceNp: string;
  source:   string;
  lang:     Lang;
}

export default function AdviceSection({ adviceEn, adviceNp, source, lang }: Props) {
  const text = lang === "en" ? adviceEn : adviceNp;
  if (!text) return null;

  return (
    <div style={{
      marginTop: 16,
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
        <span style={{ fontSize: 12, fontWeight: 700, color: "#9a7212", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <ClipboardList size={14} color="#9a7212" strokeWidth={2} />
          {lang === "en" ? "Detailed Advice" : "विस्तृत सल्लाह"}
        </span>
        <span style={{
          fontSize: 10, padding: "2px 7px", borderRadius: 8,
          background: source === "gemini" ? "#d1fae5" : "#dbeafe",
          color: source === "gemini" ? "#065f46" : "#1e3a8a",
          fontWeight: 600,
        }}>
          {source === "gemini" ? "Gemini AI" : "Offline"}
        </span>
      </div>
      <p style={{ fontSize: 13, color: "#1a1a1a", lineHeight: 1.65, margin: 0 }}>
        {text}
      </p>
    </div>
  );
}
