"use client";
import { useState, useEffect } from "react";
import { Radio, Pencil, Wheat, Sprout, Leaf, TreePine, Sun, type LucideIcon } from "lucide-react";
import { T, F } from "./DashboardComponents";
import type { Lang } from "./LanguageToggle";

export interface ManualInput {
  nitrogen:      number;
  phosphorus:    number;
  potassium:     number;
  temperature:   number;
  humidity:      number;
  ph:            number;
  rainfall:      number;
  soil_moisture: number;
  moisture:      number;
  soil_type:     string;
}

interface Props {
  lang:     Lang;
  onChange: (data: ManualInput) => void;
  /** Seed values to pre-fill the form with (e.g. live sensor + weather data). */
  seed?: Partial<ManualInput>;
  /** Field keys whose values came from live sensor/weather (shown with a 📡 badge). */
  sensorKeys?: Array<keyof ManualInput>;
  /** Show the Nepal scenario presets (hidden in Live mode). Default true. */
  showPresets?: boolean;
}

const PRESETS: Array<{ label: string; label_np: string; icon: LucideIcon; data: ManualInput }> = [
  {
    label: "Terai Rice Farm", label_np: "तराई धान खेत", icon: Wheat,
    data: { nitrogen: 82, phosphorus: 46, potassium: 46, temperature: 28, humidity: 82, ph: 6.5, rainfall: 215, soil_moisture: 72, moisture: 72, soil_type: "Alluvial" },
  },
  {
    label: "Mid-hills Potato", label_np: "मध्यपहाड आलु", icon: Sprout,
    data: { nitrogen: 56, phosphorus: 58, potassium: 76, temperature: 17, humidity: 80, ph: 5.6, rainfall: 120, soil_moisture: 65, moisture: 65, soil_type: "Loamy" },
  },
  {
    label: "Mustard Field (Terai)", label_np: "तराई तोरी खेत", icon: Leaf,
    data: { nitrogen: 62, phosphorus: 44, potassium: 40, temperature: 18, humidity: 56, ph: 6.6, rainfall: 62, soil_moisture: 42, moisture: 42, soil_type: "Silt" },
  },
  {
    label: "Apple Orchard (Hills)", label_np: "पहाडी स्याउ बगैंचा", icon: TreePine,
    data: { nitrogen: 22, phosphorus: 135, potassium: 200, temperature: 13, humidity: 91, ph: 5.9, rainfall: 113, soil_moisture: 58, moisture: 58, soil_type: "Loamy" },
  },
  {
    label: "Dry / Low Fertility", label_np: "सुक्खा / कम उर्वर", icon: Sun,
    data: { nitrogen: 18, phosphorus: 10, potassium: 12, temperature: 32, humidity: 35, ph: 5.2, rainfall: 30, soil_moisture: 18, moisture: 18, soil_type: "Sandy" },
  },
];

const SOIL_TYPES = ["Sandy", "Loamy", "Clay", "Silt", "Alluvial"];

const FIELDS: Array<{
  key: keyof ManualInput; label: string; label_np: string;
  min: number; max: number; step: number; color: string; unit: string;
}> = [
  { key: "nitrogen",     label: "Nitrogen (N)",   label_np: "नाइट्रोजन",   min: 0,   max: 200, step: 1,   color: "#2d6a2d", unit: "mg/kg" },
  { key: "phosphorus",   label: "Phosphorus (P)", label_np: "फस्फोरस",     min: 0,   max: 150, step: 1,   color: "#2563eb", unit: "mg/kg" },
  { key: "potassium",    label: "Potassium (K)",  label_np: "पोटासियम",    min: 0,   max: 250, step: 1,   color: "#d97706", unit: "mg/kg" },
  { key: "temperature",  label: "Temperature",    label_np: "तापक्रम",     min: 5,   max: 45,  step: 0.5, color: "#dc2626", unit: "°C"   },
  { key: "humidity",     label: "Humidity",       label_np: "आर्द्रता",    min: 10,  max: 100, step: 1,   color: "#0d9488", unit: "%"    },
  { key: "ph",           label: "Soil pH",        label_np: "पीएच",        min: 3.5, max: 9.0, step: 0.1, color: "#7c3aed", unit: ""     },
  { key: "rainfall",     label: "Rainfall",       label_np: "वर्षा",       min: 0,   max: 400, step: 5,   color: "#0284c7", unit: "mm/yr"},
  { key: "soil_moisture",label: "Soil Moisture",  label_np: "माटो आर्द्रता",min:5,  max: 95,  step: 1,   color: "#2d6a2d", unit: "%"    },
];

export const defaultManualInput: ManualInput = {
  nitrogen: 60, phosphorus: 40, potassium: 40,
  temperature: 25, humidity: 65, ph: 6.5,
  rainfall: 100, soil_moisture: 50, moisture: 50,
  soil_type: "Loamy",
};

export default function ManualInputPanel({ lang, onChange, seed, sensorKeys, showPresets = true }: Props) {
  const isLive  = Array.isArray(sensorKeys);
  const liveSet = new Set<keyof ManualInput>(sensorKeys ?? []);
  const initial = { ...defaultManualInput, ...(seed ?? {}) } as ManualInput;

  const [form, setForm]                 = useState<ManualInput>(initial);
  const [activePreset, setActivePreset] = useState<number | null>(null);

  // Push the (seeded) values up to the parent once on mount, so the user can
  // submit without editing and still send the live/default values.
  useEffect(() => {
    onChange(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const t = (en: string, np: string) => (lang === "en" ? en : np);

  const applyPreset = (idx: number) => {
    const d = PRESETS[idx].data;
    setForm(d);
    setActivePreset(idx);
    onChange(d);
  };

  const handleChange = (key: keyof ManualInput, val: string | number) => {
    const updated = { ...form, [key]: val, ...(key === "soil_moisture" ? { moisture: val } : {}) } as ManualInput;
    setForm(updated);
    setActivePreset(null);
    onChange(updated);
  };

  // Small badge shown next to each field in Live mode.
  const LiveBadge = () => (
    <span style={{ marginLeft: 6, display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9, fontWeight: 700, color: "#15803d", background: "#dcfce7", borderRadius: 5, padding: "1px 5px", verticalAlign: "middle" }}>
      <Radio size={9} strokeWidth={2.5} /> {t("live", "लाइभ")}
    </span>
  );
  const ReviewBadge = () => (
    <span style={{ marginLeft: 6, display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9, fontWeight: 700, color: "#b45309", background: "#fef3c7", borderRadius: 5, padding: "1px 5px", verticalAlign: "middle" }}>
      <Pencil size={9} strokeWidth={2.5} /> {t("review", "जाँच")}
    </span>
  );

  return (
    <div style={{ padding: "20px 24px", background: T.surface, borderRadius: 16, border: `2px solid #2d6a2d40` }}>
      {/* Presets (manual mode only) */}
      {showPresets && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
            {t("Nepal Scenario Presets", "नेपाल परिदृश्य")}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {PRESETS.map((p, i) => {
              const Ic = p.icon;
              return (
                <button
                  key={i}
                  onClick={() => applyPreset(i)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "6px 12px", borderRadius: 8,
                    border: `1.5px solid ${activePreset === i ? "#2d6a2d" : T.border}`,
                    background: activePreset === i ? "#e8f4e8" : T.cardHover,
                    color: activePreset === i ? "#2d6a2d" : T.textSub,
                    fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  <Ic size={14} strokeWidth={2} /> {t(p.label, p.label_np)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Inputs — 5 in row 1, 4 in row 2 (last cell = Soil Type) */}
      <div
        className="mip-grid"
        style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 12 }}
      >
        {FIELDS.map(f => (
          <div key={f.key}>
            <label style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, display: "block", marginBottom: 5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {t(f.label, f.label_np)}
              {f.unit && <span style={{ color: T.textDim, marginLeft: 3, fontWeight: 400 }}>({f.unit})</span>}
              {isLive && (liveSet.has(f.key) ? <LiveBadge /> : <ReviewBadge />)}
            </label>
            <input
              type="number"
              min={f.min} max={f.max} step={f.step}
              value={form[f.key] as number}
              onChange={e => handleChange(f.key, parseFloat(e.target.value) || 0)}
              style={{
                width: "100%", padding: "9px 11px", borderRadius: 10,
                background: T.cardHover, border: `1px solid ${T.border}`,
                color: T.text, fontSize: 14, fontFamily: F.mono, outline: "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onFocus={e => { e.target.style.borderColor = f.color; e.target.style.boxShadow = `0 0 0 3px ${f.color}22`; }}
              onBlur={e  => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none"; }}
            />
          </div>
        ))}

        {/* Soil Type — sits as the 4th cell of row 2, same size as inputs */}
        <div>
          <label style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, display: "block", marginBottom: 5 }}>
            {t("Soil Type", "माटोको प्रकार")}
            {isLive && <ReviewBadge />}
          </label>
          <select
            value={form.soil_type}
            onChange={e => handleChange("soil_type", e.target.value)}
            style={{ width: "100%", padding: "9px 11px", borderRadius: 10, background: T.cardHover, border: `1px solid ${T.border}`, color: T.text, fontSize: 14, cursor: "pointer", outline: "none" }}
          >
            {SOIL_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <p style={{ fontSize: 11, color: T.textDim, margin: 0, lineHeight: 1.5 }}>
        {t(
          "Crop is chosen from the Crop Recommendation results - selecting one personalises the fertilizer & irrigation advice.",
          "बाली सिफारिस नतिजाबाट बाली छानिन्छ - एउटा छान्दा मलखाद र सिँचाई सल्लाह बाली-अनुसार हुन्छ।"
        )}
      </p>

      <style>{`
        @media (max-width: 900px) { .mip-grid { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (max-width: 560px) { .mip-grid { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>
    </div>
  );
}
