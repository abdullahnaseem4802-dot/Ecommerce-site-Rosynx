"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Spinner } from "@/components/ui";

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
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
              Admin Login
            </h1>
            <p className="mt-2 text-center text-sm text-white/80">
              Welcome back! Please sign in to continue.
            </p>

            <form onSubmit={submit} className="mt-8 space-y-5">
              {/* Email */}
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
                    className="w-full rounded-xl border border-[#B66A1D]/50 bg-white/10 py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/50 shadow-inner outline-none transition focus:border-[#E0A94E] focus:ring-2 focus:ring-[#E0A94E]/30"
                  />
                </div>
              </div>

              {/* Password */}
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
                    className="w-full rounded-xl border border-[#B66A1D]/50 bg-white/10 py-3 pl-11 pr-11 text-sm text-white placeholder:text-white/50 shadow-inner outline-none transition focus:border-[#E0A94E] focus:ring-2 focus:ring-[#E0A94E]/30"
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

              {/* Options row */}
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
                  onClick={() =>
                    setNotice(
                      "Please contact your system administrator to reset your password.",
                    )
                  }
                  className="font-medium text-[#E0B274] transition hover:text-[#f3d29a]"
                >
                  Forgot Password?
                </button>
              </div>

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

              {/* Submit */}
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.985 }}
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#B66A1D] via-[#D08A2E] to-[#E9BE6E] py-3.5 text-sm font-semibold tracking-wide text-white shadow-[0_16px_36px_-12px_rgba(182,106,29,0.85)] transition hover:brightness-110 hover:shadow-[0_20px_44px_-12px_rgba(224,169,78,0.9)] disabled:opacity-70"
              >
                {loading ? <Spinner /> : null}
                {loading ? "Signing in…" : "Sign In"}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
