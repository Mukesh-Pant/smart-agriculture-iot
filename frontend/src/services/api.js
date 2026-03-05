// src/services/api.js
// ─────────────────────────────────────────────────────────────
// Central API service — all HTTP calls to the FastAPI backend.
// Change API_BASE_URL here once to affect the entire app.
// ─────────────────────────────────────────────────────────────

const API_BASE_URL = "http://localhost:8000";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Sensor Data ───────────────────────────────────────────────
export const getLatestReading   = ()              => request("/api/sensors/latest");
export const getSensorHistory   = (limit = 40)   => request(`/api/sensors/history?limit=${limit}`);
export const getSystemStatus    = ()              => request("/api/sensors/status");

// ── Analytics ─────────────────────────────────────────────────
export const getDailySummary    = (date)          => request(`/api/analytics/summary/daily${date ? `?date=${date}` : ""}`);
export const getWeeklySummary   = ()              => request("/api/analytics/summary/week");

// ── Weather ───────────────────────────────────────────────────
export const getCurrentWeather  = ()              => request("/api/weather/current");

// ── ML Recommendations ────────────────────────────────────────
export const getFullRecommendation = ()           => request("/api/recommend/full");
export const getRecommendStatus    = ()           => request("/api/recommend/status");

export const postCropRecommendation = (body)      =>
  request("/api/recommend/crop", { method: "POST", body: JSON.stringify(body) });

export const postFertilizerRecommendation = (body) =>
  request("/api/recommend/fertilizer", { method: "POST", body: JSON.stringify(body) });

export const postIrrigationRecommendation = (body) =>
  request("/api/recommend/irrigation", { method: "POST", body: JSON.stringify(body) });

// ── Health ────────────────────────────────────────────────────
export const getHealth = () => request("/health");
