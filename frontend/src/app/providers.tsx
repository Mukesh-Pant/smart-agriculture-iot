"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Client-side providers. SessionProvider enables useSession()/update() so
 * client components (e.g. Settings) can refresh the session after a profile
 * change without requiring a full re-login.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
