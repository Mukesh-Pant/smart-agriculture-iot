"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import BackendApi from "./Common";

/**
 * Keeps the httpOnly `backend_token` cookie fresh.
 *
 * The cookie carries the user's device assignments, role and status. It is
 * minted at /jwtSetup (login) and otherwise never changes — so when an admin
 * reassigns a device or changes a role, the logged-in user would keep stale
 * access until they manually log out and back in.
 *
 * This component silently re-calls /api/settingCookies, which re-reads the
 * live user from the database and re-issues the cookie with current claims:
 *   - once on mount (every dashboard entry)
 *   - whenever the tab regains focus (covers long-lived sessions)
 * No UI, no re-login required.
 */
export default function SessionRefresher() {
  const { data: session } = useSession();
  const backendToken = session?.user?.backendToken;

  useEffect(() => {
    if (!backendToken) return;

    let cancelled = false;

    const refresh = async () => {
      try {
        await fetch(BackendApi.SettingCookies.url, {
          method: BackendApi.SettingCookies.method,
          credentials: "include",
          cache: "no-store",
          headers: { Authorization: `Bearer ${backendToken}` },
        });
      } catch {
        // Non-fatal — the existing cookie (if any) still works; route guards
        // and per-request auth handle anything truly broken.
      }
    };

    if (!cancelled) refresh();

    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
    };
  }, [backendToken]);

  return null;
}
