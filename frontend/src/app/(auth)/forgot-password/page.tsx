"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Loader2, ArrowLeft, MailCheck } from "lucide-react";
import { BACKEND_DOMAIN } from "@/lib/backend";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_DOMAIN}/api/account/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        setSent(true);
      } else {
        setError(data?.message || "Something went wrong. Please try again.");
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
        <CardTitle className="text-xl">Forgot password</CardTitle>
        <CardDescription>
          {sent
            ? "Check your inbox for the reset link."
            : "Enter your email and we'll send you a reset link."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {sent ? (
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-3 text-sm text-emerald-700">
              <MailCheck className="size-5 flex-shrink-0 mt-0.5" />
              <span>
                If an account exists for <strong>{email}</strong>, a password
                reset link has been sent. The link expires in 1 hour.
              </span>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/login")}
            >
              <ArrowLeft className="size-4 mr-2" />
              Back to Login
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
              <Label>Email</Label>
              <Input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@example.com"
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
                  Sending…
                </span>
              ) : (
                "Send reset link"
              )}
            </Button>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-sm text-gray-500 hover:text-gray-800 inline-flex items-center justify-center gap-1"
            >
              <ArrowLeft className="size-3.5" />
              Back to Login
            </button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
