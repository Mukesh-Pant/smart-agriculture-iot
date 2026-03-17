// src/hooks/useApi.js
// ─────────────────────────────────────────────────────────────
// Custom hooks for data fetching with auto-polling, loading
// states, and error handling — used across all dashboard pages.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Generic polling hook.
 * Fetches data immediately, then re-fetches every `interval` ms.
 *
 * @param {Function} fetchFn  - async function that returns data
 * @param {number}   interval - polling interval in ms (0 = no poll)
 * @param {Array}    deps     - extra dependencies to re-fetch on
 */
export function usePolling(fetchFn, interval = 10000, deps = []) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const timerRef = useRef(null);

  const fetch_ = useCallback(async () => {
    try {
      const result = await fetchFn();
      setData(result);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, ...deps]); // eslint-disable-line

  useEffect(() => {
    setLoading(true);
    fetch_();
    if (interval > 0) {
      timerRef.current = setInterval(fetch_, interval);
    }
    return () => clearInterval(timerRef.current);
  }, [fetch_, interval]);

  return { data, loading, error, refetch: fetch_ };
}

/**
 * Single-fetch hook (no polling). Good for analytics / summaries.
 */
export function useFetch(fetchFn, deps = []) {
  return usePolling(fetchFn, 0, deps);
}