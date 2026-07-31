"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, MailCheck } from "lucide-react";
import { api } from "@/lib/api";
import { Container } from "@/components/ui/container";
import { PageBanner } from "@/components/ui/page-banner";
import { toast } from "@/lib/toast";

// Stricter than "contains @" but lenient enough for real addresses.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Mirror the backend rule (min 8 + a letter + a number).
const PASSWORD_RE = /(?=.*[A-Za-z])(?=.*\d)/;

export default function ResetPasswordPage() {
  const router = useRouter();
  // Three steps: enter email → enter the emailed code → set a new password.
  // Splitting the code and password into separate screens means the user isn't
  // racing to type a fresh password in the same moment they read the code.
  const [step, setStep] = useState<"email" | "otp" | "password">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Timers: `sentAt` anchors the 60s resend cooldown; `expiresAt` anchors the
  // 15-minute validity of the code. `now` ticks every second while on the code
  // step so both countdowns render live.
  const [sentAt, setSentAt] = useState(0);
  const [expiresAt, setExpiresAt] = useState(0);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (step === "email") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [step]);

  const cooldownLeft = Math.max(0, 60 - Math.floor((now - sentAt) / 1000));
  const validityLeft = Math.max(0, Math.ceil((expiresAt - now) / 1000));
  const mmss = `${String(Math.floor(validityLeft / 60)).padStart(2, "0")}:${String(
    validityLeft % 60,
  ).padStart(2, "0")}`;

  const markSent = () => {
    const t = Date.now();
    setSentAt(t);
    setExpiresAt(t + 15 * 60 * 1000); // OTP valid 15 min
    setNow(t);
  };

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
      markSent();
      setStep("otp");
      toast.info("If that email exists, a 6-digit code was sent.");
    } catch {
      // Even on an unexpected failure, keep the flow moving without leaking info.
      markSent();
      setStep("otp");
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (cooldownLeft > 0) return;
    setError("");
    try {
      await api.forgotPassword(email.trim());
      toast.info("A new code was sent.");
    } catch {
      /* endpoint never reveals existence — keep the UX moving regardless */
    }
    markSent();
  };

  // Step 2 → 3: the code is only checked for shape here; it's validated against
  // the server together with the new password on the final submit.
  const continueToPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setStep("password");
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8 || !PASSWORD_RE.test(newPassword)) {
      setError(
        "Your new password must be at least 8 characters and include a letter and a number.",
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The two passwords don't match.");
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
          {step === "email" && (
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
                  autoComplete="username"
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
          )}

          {step === "otp" && (
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
                a 6-digit code was sent. Enter it below to continue.
              </p>
              <div className="mt-4 rounded-xl bg-cream-card px-4 py-3 text-xs text-coffee">
                Code sent — valid for 15 minutes.{" "}
                {validityLeft > 0 ? (
                  <span className="font-medium">Expires in {mmss}.</span>
                ) : (
                  <span className="font-medium text-sale">
                    Code expired — request a new one.
                  </span>
                )}
              </div>
              <form onSubmit={continueToPassword} className="mt-6 space-y-4">
                <Field
                  label="6-digit code"
                  value={otp}
                  onChange={(v) => setOtp(v.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  inputMode="numeric"
                  name="otp"
                  autoComplete="one-time-code"
                />
                {error && <p className="text-sm text-sale">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full rounded-full bg-brand py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-70"
                >
                  Continue
                </button>
                <p className="text-center text-xs text-muted">
                  Didn&apos;t get the code?{" "}
                  {cooldownLeft > 0 ? (
                    <span>Resend in {cooldownLeft}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={resendCode}
                      className="font-medium text-brand hover:underline"
                    >
                      Resend code
                    </button>
                  )}
                </p>
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

          {step === "password" && (
            <>
              <h2 className="font-serif text-xl font-bold text-espresso">
                Set a new password
              </h2>
              <p className="mt-1 text-sm text-muted">
                Choose a new password for{" "}
                <span className="font-medium text-coffee">{email.trim()}</span>.
              </p>
              <form onSubmit={submitReset} className="mt-6 space-y-4">
                <Field
                  label="New password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder="Enter a new password"
                  autoComplete="new-password"
                  reveal={showPassword}
                  onToggleReveal={() => setShowPassword((v) => !v)}
                  hint="At least 8 characters, including a letter and a number."
                />
                <Field
                  label="Confirm new password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Re-enter the new password"
                  autoComplete="new-password"
                  error={
                    confirmPassword.length > 0 && confirmPassword !== newPassword
                      ? "Passwords don't match"
                      : undefined
                  }
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
                    setStep("otp");
                    setError("");
                  }}
                  className="flex w-full items-center justify-center gap-1.5 text-xs font-medium text-muted transition hover:text-brand"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
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
  autoComplete,
  name,
  error,
  hint,
  reveal,
  onToggleReveal,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  inputMode?: "numeric" | "text";
  autoComplete?: string;
  name?: string;
  error?: string;
  hint?: string;
  reveal?: boolean;
  onToggleReveal?: () => void;
}) {
  // Start read-only so the browser can't auto-fill saved credentials on load.
  const [ro, setRo] = useState(true);
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-coffee">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setRo(false)}
          readOnly={ro}
          placeholder={placeholder}
          autoComplete={autoComplete}
          name={name}
          className={cnField(!!error, !!onToggleReveal)}
        />
        {onToggleReveal && (
          <button
            type="button"
            onClick={onToggleReveal}
            aria-label={reveal ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted transition hover:text-brand"
          >
            {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-sale">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

function cnField(hasError: boolean, hasToggle: boolean): string {
  return [
    "w-full rounded-xl border bg-cream-soft px-4 py-3 text-sm focus:outline-none",
    hasToggle ? "pr-11" : "",
    hasError ? "border-sale focus:border-sale" : "border-line focus:border-brand",
  ]
    .filter(Boolean)
    .join(" ");
}
