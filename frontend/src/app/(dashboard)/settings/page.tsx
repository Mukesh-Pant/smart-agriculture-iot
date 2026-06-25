import { safeAuth } from "@/lib/safeAuth";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

/**
 * Settings page — shows the signed-in user's account details and profile.
 * Profile fields are editable and saved via the NodeJS /api/userOnboarding
 * endpoint (re-used for profile updates).
 */
export default async function SettingsPage() {
  const session = await safeAuth();
  if (!session) redirect("/login");

  return (
    <SettingsClient
      user={{
        firstName: session.user.firstName ?? "",
        lastName: session.user.lastName ?? "",
        email: session.user.email ?? "",
        role: session.user.user_role ?? "farmer",
        deviceId: session.user.device_id ?? "",
        status: session.user.status ?? "approved",
      }}
      backendToken={session.user.backendToken}
    />
  );
}
