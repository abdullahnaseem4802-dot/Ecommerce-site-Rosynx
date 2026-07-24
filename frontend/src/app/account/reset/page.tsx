"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MailCheck } from "lucide-react";
import { api } from "@/lib/api";
import { Container } from "@/components/ui/container";
import { PageBanner } from "@/components/ui/page-banner";
import { toast } from "@/lib/toast";

// Stricter than "contains @" but lenient enough for real addresses.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!EMAIL_RE.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      // The endpoint always returns { ok: true } and never reveals whether the
      // email exists, so we always advance to the code step.
      await api.forgotPassword(email.trim());
      setStep("otp");
      toast.info("If that email exists, a 6-digit code was sent.");
    } catch {
      // Even on an unexpected failure, keep the flow moving without leaking info.
      setStep("otp");
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Your new password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(email.trim(), otp.trim(), newPassword);
      toast.success("Password updated — please log in.");
      router.push("/account");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-20">
      <PageBanner title="Reset Password" crumb="Account" />
      <Container>
        <div className="mx-auto max-w-md rounded-2xl border border-line/60 bg-white p-8">
          {step === "email" ? (
            <>
              <h2 className="font-serif text-xl font-bold text-espresso">
                Forgot your password?
              </h2>
              <p className="mt-1 text-sm text-muted">
                Enter your account email and we&apos;ll send you a 6-digit code
                to reset it.
              </p>
              <form onSubmit={requestCode} className="mt-6 space-y-4">
                <Field
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@email.com"
                />
                {error && <p className="text-sm text-sale">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-brand py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-70"
                >
                  {loading ? "Please wait…" : "Send reset code"}
                </button>
              </form>
            </>
          ) : (
            <>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cream-card text-brand">
                <MailCheck className="h-5 w-5" />
              </span>
              <h2 className="mt-4 font-serif text-xl font-bold text-espresso">
                Check your email
              </h2>
              <p className="mt-1 text-sm text-muted">
                If an account exists for{" "}
                <span className="font-medium text-coffee">{email.trim()}</span>,
                a 6-digit code was sent. Enter it below with your new password.
              </p>
              <form onSubmit={submitReset} className="mt-6 space-y-4">
                <Field
                  label="6-digit code"
                  value={otp}
                  onChange={(v) => setOtp(v.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  inputMode="numeric"
                />
                <Field
                  label="New password"
                  type="password"
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder="••••••••"
                />
                {error && <p className="text-sm text-sale">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-brand py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-70"
                >
                  {loading ? "Please wait…" : "Reset password"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setError("");
                    setOtp("");
                  }}
                  className="flex w-full items-center justify-center gap-1.5 text-xs font-medium text-muted transition hover:text-brand"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Use a different email
                </button>
              </form>
            </>
          )}

          <div className="mt-6 border-t border-line pt-4 text-center">
            <Link
              href="/account"
              className="text-sm font-medium text-brand hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  inputMode?: "numeric" | "text";
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-coffee">
        {label}
      </label>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-line bg-cream-soft px-4 py-3 text-sm focus:border-brand focus:outline-none"
      />
    </div>
  );
}
