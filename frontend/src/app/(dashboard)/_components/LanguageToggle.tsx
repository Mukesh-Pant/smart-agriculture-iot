"use client";
import { useState } from "react";
import { T } from "./DashboardComponents";

export type Lang = "en" | "np";

interface Props {
  lang: Lang;
  onChange: (l: Lang) => void;
}

export default function LanguageToggle({ lang, onChange }: Props) {
  const [hov, setHov] = useState<Lang | null>(null);

  const btn = (l: Lang, label: string) => {
    const active  = lang === l;
    const hovered = hov === l;
    return (
      <button
        key={l}
        onClick={() => onChange(l)}
        onMouseEnter={() => setHov(l)}
        onMouseLeave={() => setHov(null)}
        style={{
          padding: "5px 14px",
          borderRadius: "8px",
          border: "none",
          fontWeight: active ? 700 : 500,
          fontSize: "13px",
          cursor: "pointer",
          transition: "all 0.18s ease",
          background: active
            ? "#2d6a2d"
            : hovered
            ? "#e8f4e8"
            : "transparent",
          color: active ? "#fff" : hovered ? "#2d6a2d" : T.textMuted,
          letterSpacing: l === "np" ? "0.01em" : undefined,
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "2px",
        background: T.cardHover,
        border: `1px solid ${T.border}`,
        borderRadius: "10px",
        padding: "3px",
      }}
    >
      {btn("en", "EN")}
      {btn("np", "नेपाली")}
    </div>
  );
}
