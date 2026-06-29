"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { BACKEND_DOMAIN } from "@/lib/backend";

function ResetInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const email = params.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const invalidLink = !token || !email;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_DOMAIN}/api/account/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        setDone(true);
      } else {
        setError(data?.message || "Could not reset password.");
      }
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm lg:min-w-sm shadow-xl border-gray-200">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl">Reset password</CardTitle>
        <CardDescription>
          {done
            ? "Your password has been updated."
            : `Choose a new password for ${email || "your account"}.`}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {done ? (
          <div className="space-y-5">
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-3 text-sm text-emerald-700">
              <CheckCircle2 className="size-5" />
              Password updated successfully.
            </div>
            <Button
              className="w-full bg-[#2E8B57] hover:bg-[#256d44] text-white font-semibold"
              onClick={() => router.push("/login")}
            >
              Go to Login
            </Button>
          </div>
        ) : invalidLink ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              This reset link is invalid or incomplete. Please request a new one.
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/forgot-password")}
            >
              Request new link
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-4">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="grid gap-2">
              <Label>New password</Label>
              <div className="relative">
                <Input
                  required
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Confirm password</Label>
              <Input
                required
                type={show ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#2E8B57] hover:bg-[#256d44] text-white font-semibold"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Updating…
                </span>
              ) : (
                "Update password"
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center">
          <Loader2 className="size-6 animate-spin text-[#2E8B57]" />
        </div>
      }
    >
      <ResetInner />
    </Suspense>
  );
}
