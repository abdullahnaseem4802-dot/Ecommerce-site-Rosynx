"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, ArrowLeft, KeyRound } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui";

// The admin login has two modes: the normal sign-in, and a self-service
// password reset (email → 6-digit OTP → new password) that reuses the same
// backend flow as the storefront. `reset` has two sub-steps.
type Mode = "login" | "forgot";
type ForgotStep = "email" | "reset";

const inputCls =
  "w-full rounded-xl border border-[#B66A1D]/50 bg-white/10 py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/50 shadow-inner outline-none transition focus:border-[#E0A94E] focus:ring-2 focus:ring-[#E0A94E]/30";

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot-password state
  const [step, setStep] = useState<ForgotStep>("email");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  function resetMessages() {
    setError("");
    setNotice("");
  }

  function backToLogin() {
    setMode("login");
    setStep("email");
    setOtp("");
    setNewPassword("");
    setConfirm("");
    resetMessages();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      await login(email, password);
      router.replace("/");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();
    if (!email.trim()) {
      setError("Enter your admin email address.");
      return;
    }
    setLoading(true);
    try {
      // Always returns ok (never reveals whether the email exists).
      await api.post("/auth/forgot-password", { email: email.trim() });
      setStep("reset");
      setNotice("If that email is registered, a 6-digit code is on its way.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function doReset(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();
    if (otp.trim().length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });
      backToLogin();
      setNotice("Password updated. Sign in with your new password.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Full-screen luxury background */}
      <Image
        src="/images/login-bg.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      {/* Warm dark overlay + soft vignette for readability */}
      <div className="absolute inset-0 bg-[#2a1c10]/35" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(20,12,6,0.55)_100%)]" />

      {/* Centered glass card */}
      <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 22, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 22 }}
          className="w-full max-w-[500px]"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="rounded-[28px] border border-white/25 bg-white/10 px-8 py-10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.65)] backdrop-blur-2xl sm:px-12"
          >
            {/* Logo */}
            <div className="flex justify-center">
              <Image
                src="/images/logo.png"
                alt="ROSYNX"
                width={200}
                height={60}
                priority
                className="h-14 w-auto object-contain brightness-0 invert drop-shadow"
              />
            </div>

            {/* Title */}
            <h1 className="mt-6 text-center font-serif text-3xl font-bold tracking-wide text-white drop-shadow-sm">
              {mode === "login" ? "Admin Login" : "Reset Password"}
            </h1>
            <p className="mt-2 text-center text-sm text-white/80">
              {mode === "login"
                ? "Welcome back! Please sign in to continue."
                : step === "email"
                  ? "Enter your admin email to receive a reset code."
                  : "Enter the code we emailed you and a new password."}
            </p>

            {/* ---------------- Sign in ---------------- */}
            {mode === "login" && (
              <form onSubmit={submit} className="mt-8 space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/90">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      size={17}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#E0B274]"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      autoComplete="username"
                      required
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/90">
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={17}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#E0B274]"
                    />
                    <input
                      type={show ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                      className={inputCls + " pr-11"}
                    />
                    <button
                      type="button"
                      onClick={() => setShow((v) => !v)}
                      aria-label={show ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/70 transition hover:text-white"
                    >
                      {show ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex cursor-pointer select-none items-center gap-2 text-white/80">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-white/40 bg-white/10 accent-[#B66A1D]"
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      resetMessages();
                      setMode("forgot");
                      setStep("email");
                    }}
                    className="font-medium text-[#E0B274] transition hover:text-[#f3d29a]"
                  >
                    Forgot Password?
                  </button>
                </div>

                <Messages error={error} notice={notice} />

                <SubmitButton loading={loading} label="Sign In" busy="Signing in…" />
              </form>
            )}

            {/* ---------------- Forgot: step 1 (email) ---------------- */}
            {mode === "forgot" && step === "email" && (
              <form onSubmit={sendCode} className="mt-8 space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/90">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      size={17}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#E0B274]"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your admin email"
                      autoComplete="username"
                      required
                      className={inputCls}
                    />
                  </div>
                </div>

                <Messages error={error} notice={notice} />

                <SubmitButton loading={loading} label="Send reset code" busy="Sending…" />
                <BackLink onClick={backToLogin} />
              </form>
            )}

            {/* ---------------- Forgot: step 2 (otp + new password) ---------------- */}
            {mode === "forgot" && step === "reset" && (
              <form onSubmit={doReset} className="mt-8 space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/90">
                    6-digit code
                  </label>
                  <div className="relative">
                    <KeyRound
                      size={17}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#E0B274]"
                    />
                    <input
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      placeholder="Enter the code from your email"
                      required
                      className={inputCls + " tracking-[0.3em]"}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/90">
                    New password
                  </label>
                  <div className="relative">
                    <Lock
                      size={17}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#E0B274]"
                    />
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      required
                      className={inputCls + " pr-11"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((v) => !v)}
                      aria-label={showNew ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/70 transition hover:text-white"
                    >
                      {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/90">
                    Confirm new password
                  </label>
                  <div className="relative">
                    <Lock
                      size={17}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#E0B274]"
                    />
                    <input
                      type={showNew ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Re-enter new password"
                      autoComplete="new-password"
                      required
                      className={inputCls}
                    />
                  </div>
                </div>

                <Messages error={error} notice={notice} />

                <SubmitButton loading={loading} label="Update password" busy="Updating…" />
                <div className="flex items-center justify-between text-sm">
                  <BackLink onClick={backToLogin} inline />
                  <button
                    type="button"
                    onClick={() => setStep("email")}
                    className="font-medium text-[#E0B274] transition hover:text-[#f3d29a]"
                  >
                    Resend code
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

function Messages({ error, notice }: { error: string; notice: string }) {
  return (
    <>
      {error && (
        <motion.p
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-100 ring-1 ring-red-400/30"
        >
          {error}
        </motion.p>
      )}
      {notice && !error && (
        <motion.p
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-lg bg-white/15 px-3 py-2 text-sm text-white/90 ring-1 ring-white/20"
        >
          {notice}
        </motion.p>
      )}
    </>
  );
}

function SubmitButton({
  loading,
  label,
  busy,
}: {
  loading: boolean;
  label: string;
  busy: string;
}) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.985 }}
      type="submit"
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#B66A1D] via-[#D08A2E] to-[#E9BE6E] py-3.5 text-sm font-semibold tracking-wide text-white shadow-[0_16px_36px_-12px_rgba(182,106,29,0.85)] transition hover:brightness-110 hover:shadow-[0_20px_44px_-12px_rgba(224,169,78,0.9)] disabled:opacity-70"
    >
      {loading ? <Spinner /> : null}
      {loading ? busy : label}
    </motion.button>
  );
}

function BackLink({ onClick, inline }: { onClick: () => void; inline?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "inline-flex items-center gap-1.5 text-sm font-medium text-white/80 transition hover:text-white" +
        (inline ? "" : " w-full justify-center")
      }
    >
      <ArrowLeft size={15} /> Back to sign in
    </button>
  );
}
