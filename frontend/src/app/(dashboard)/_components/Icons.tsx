"use client";
/**
 * Central icon system — one source of truth for every icon in the dashboard.
 *
 * We use lucide-react for crisp, consistent, stroke-based icons instead of
 * emojis (which render differently per-OS and look inconsistent). Every page
 * should import icons from here so sizing, stroke width and semantic mapping
 * stay uniform across the whole app.
 */
import * as React from "react";
import {
  // sensors / agronomy
  Thermometer, Droplets, Droplet, Sprout, Wheat, FlaskConical, TestTubes,
  Leaf, Mountain, Layers, Gauge, Waves,
  // weather
  Sun, Cloud, CloudRain, CloudDrizzle, CloudLightning, CloudFog, CloudSun,
  Wind, CalendarDays, MapPin,
  // recommendations / reports
  FileText, Sparkles, Bug, TrendingUp, ClipboardList,
  // ui / nav
  LayoutDashboard, Activity, BarChart3, History as HistoryIcon, Users,
  Settings, Bell, RefreshCw, Download, ChevronLeft, ChevronRight, X, Check,
  Search, Filter, Clock, Pencil, Radio, CircleDot, Trophy, Medal, Award,
  Wifi, Database, Cpu, CloudCog, AlertTriangle, Info, ChevronDown,
  type LucideIcon,
} from "lucide-react";

export type { LucideIcon };

// ── Sensor / metric icons ─────────────────────────────────────
export const MetricIcons = {
  temperature:   Thermometer,
  humidity:      Droplets,
  soil_moisture: Waves,
  moisture:      Waves,
  ph:            FlaskConical,
  rainfall:      CloudRain,
  nitrogen:      Sprout,
  phosphorus:    Sprout,
  potassium:     Sprout,
  pressure:      Gauge,
  wind:          Wind,
  clouds:        Cloud,
} as const;

// ── Recommendation type icons ─────────────────────────────────
export const RecIcons = {
  crop:       Wheat,
  fertilizer: FlaskConical,
  irrigation: Droplets,
  soil:       Layers,
  full:       Sparkles,
  complete:   Sparkles,
} as const;

// ── Weather condition icons ───────────────────────────────────
export const WeatherIcons: Record<string, LucideIcon> = {
  Clear:        Sun,
  Clouds:       Cloud,
  Rain:         CloudRain,
  Drizzle:      CloudDrizzle,
  Thunderstorm: CloudLightning,
  Mist:         CloudFog,
  Haze:         CloudFog,
  Fog:          CloudFog,
  Default:      CloudSun,
};

export function weatherIcon(condition?: string): LucideIcon {
  return WeatherIcons[condition ?? "Default"] ?? WeatherIcons.Default;
}

// Re-export commonly used icons by name for direct use.
export {
  Thermometer, Droplets, Droplet, Sprout, Wheat, FlaskConical, TestTubes,
  Leaf, Mountain, Layers, Gauge, Waves,
  Sun, Cloud, CloudRain, CloudDrizzle, CloudLightning, CloudFog, CloudSun,
  Wind, CalendarDays, MapPin,
  FileText, Sparkles, Bug, TrendingUp, ClipboardList,
  LayoutDashboard, Activity, BarChart3, HistoryIcon, Users,
  Settings, Bell, RefreshCw, Download, ChevronLeft, ChevronRight, X, Check,
  Search, Filter, Clock, Pencil, Radio, CircleDot, Trophy, Medal, Award,
  Wifi, Database, Cpu, CloudCog, AlertTriangle, Info, ChevronDown,
};

// ── Helper: a rounded "chip" wrapping an icon, used in card headers ──
export function IconChip({
  icon: Icon,
  color,
  size = 40,
  iconSize,
  bg,
  style,
}: {
  icon: LucideIcon;
  color: string;
  size?: number;
  iconSize?: number;
  bg?: string;
  style?: React.CSSProperties;
}) {
  const inner = iconSize ?? Math.round(size * 0.5);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        background: bg ?? `${color}15`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        ...style,
      }}
    >
      <Icon size={inner} color={color} strokeWidth={2} />
    </div>
  );
}

// ── Helper: medal/rank icon for top-N lists (replaces 🥇🥈🥉) ──
export function RankIcon({ rank, size = 16 }: { rank: number; size?: number }) {
  const colors = ["#d4a017", "#9ca3af", "#b45309"];
  const Icons = [Trophy, Medal, Award];
  const Ic = Icons[rank] ?? CircleDot;
  return <Ic size={size} color={colors[rank] ?? "#9ca3af"} strokeWidth={2} />;
}
