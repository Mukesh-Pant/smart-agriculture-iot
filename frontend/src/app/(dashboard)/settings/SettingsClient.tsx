"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  User,
  Mail,
  ShieldCheck,
  Cpu,
  Loader2,
  CheckCircle2,
  Save,
} from "lucide-react";
import { BACKEND_DOMAIN } from "@/lib/backend";

type UserInfo = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  deviceId: string;
  status: string;
};

export default function SettingsClient({
  user,
  backendToken,
}: {
  user: UserInfo;
  backendToken: string;
}) {
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("");
  const [saving, setSaving] = useState(false);
  const { update } = useSession();

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_DOMAIN}/api/userOnboarding`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${backendToken}`,
        },
        body: JSON.stringify({ firstName, lastName, phone, district }),
      });
      const data = await res.json();
      if (res.ok && (data.success ?? true)) {
        // Refresh the NextAuth session so the new name shows everywhere
        // (header, dropdown) without requiring a re-login.
        await update({ firstName, lastName });
        toast.success("Profile updated.");
      } else {
        toast.error(data.message || "Could not update profile.");
      }
    } catch {
      toast.error("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-11 h-11 rounded-xl bg-[#2E8B57] flex items-center justify-center">
          <User className="size-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">Manage your account and profile</p>
        </div>
      </div>

      {/* Account overview (read-only) */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Account</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <ReadOnly icon={<Mail className="size-4" />} label="Email" value={user.email} />
          <ReadOnly
            icon={<ShieldCheck className="size-4" />}
            label="Role"
            value={user.role}
            capitalize
          />
          <ReadOnly
            icon={<Cpu className="size-4" />}
            label="Device ID"
            value={user.deviceId || "Not assigned"}
          />
          <ReadOnly
            icon={<CheckCircle2 className="size-4" />}
            label="Status"
            value={user.status.replace(/_/g, " ")}
            capitalize
          />
        </div>
        <p className="text-xs text-gray-400 mt-4">
          Role, device assignment, and account status are managed by an
          administrator.
        </p>
      </section>

      {/* Editable profile */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Profile</h2>
        <form onSubmit={saveProfile} className="grid gap-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>First name</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Last name</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Phone (optional)</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+977 98XXXXXXXX"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>District (optional)</Label>
              <Input
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Kanchanpur"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#2E8B57] hover:bg-[#256d44] text-white gap-2"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Save changes
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ReadOnly({
  icon,
  label,
  value,
  capitalize,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
        {icon}
        {label}
      </div>
      <div className={`text-sm font-semibold text-gray-800 ${capitalize ? "capitalize" : ""}`}>
        {value}
      </div>
    </div>
  );
}
