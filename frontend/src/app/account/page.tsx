"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, MailCheck, Package, ShoppingBag } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useCartCount, useHydrated, useShop } from "@/lib/store";
import {
  api,
  setToken,
  type ApiError,
  type ApiUser,
  type OrderSummary,
} from "@/lib/api";
import { takePendingAdd } from "@/lib/cart-intent";
import { toast } from "@/lib/toast";
import { Container } from "@/components/ui/container";
import { PageBanner } from "@/components/ui/page-banner";
import { AccountShell } from "@/components/account/account-shell";
import { useMoney } from "@/lib/currency";
import { cn } from "@/lib/utils";

export default function AccountPage() {
  const hydrated = useHydrated();
  const user = useAuth((s) => s.user);
  const ready = useAuth((s) => s.ready);

  if (!hydrated || !ready) return <div className="min-h-[60vh]" />;
  return user ? <Dashboard /> : <AuthForm />;
}

/* ----------------------------- Dashboard -------------------------- */

function Dashboard() {
  const user = useAuth((s) => s.user)!;
  const { format } = useMoney();
  const wishlist = useShop((s) => s.wishlist.length);
  // Match the header cart badge: total quantity, not distinct line count.
  const cart = useCartCount();
  const [orders, setOrders] = useState<OrderSummary[]>([]);

  useEffect(() => {
    api
      .myOrders()
      .then(setOrders)
      .catch(() => setOrders([]));
  }, []);

  const stats = [
    { label: "Orders", value: orders.length, icon: Package, href: "/account/orders" },
    { label: "Wishlist", value: wishlist, icon: Heart, href: "/wishlist" },
    { label: "In Cart", value: cart, icon: ShoppingBag, href: "/cart" },
  ];

  return (
    <AccountShell title="My Account">
      <h2 className="font-serif text-2xl font-bold text-espresso">
        Welcome back, {user.name.split(" ")[0]} 👋
      </h2>
      <p className="mt-1 text-sm text-muted">
        Here&apos;s what&apos;s happening with your account.
      </p>

      <div className="mt-6 grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-2xl border border-line/60 bg-white p-5 transition hover:border-brand hover:shadow-lg hover:shadow-espresso/5"
          >
            <s.icon className="h-6 w-6 text-brand" />
            <p className="mt-3 font-serif text-2xl font-bold text-espresso">{s.value}</p>
            <p className="text-xs text-muted">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-espresso">Recent Orders</h3>
          <Link href="/account/orders" className="text-sm font-medium text-brand hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-line/60 bg-white">
          {orders.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">
              No orders yet.
            </p>
          ) : (
            orders.slice(0, 3).map((o, i) => (
              <div
                key={o.orderNumber}
                className={cn(
                  "flex items-center justify-between px-5 py-4 text-sm",
                  i > 0 && "border-t border-line/60",
                )}
              >
                <div>
                  <p className="font-semibold text-coffee">{o.orderNumber}</p>
                  <p className="text-xs text-muted">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <StatusPill status={o.status} />
                <span className="font-semibold text-espresso">
                  {format(o.total)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </AccountShell>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-500/15 text-amber-600",
    ON_HOLD: "bg-blue-500/15 text-blue-600",
    PAID: "bg-newtag/15 text-newtag",
    PROCESSING: "bg-blue-500/15 text-blue-600",
    SHIPPED: "bg-brand/15 text-brand",
    COMPLETED: "bg-newtag/15 text-newtag",
    CANCELLED: "bg-sale/15 text-sale",
    REFUNDED: "bg-sale/15 text-sale",
  };
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium capitalize",
        map[status] ?? "bg-cream-card text-coffee",
      )}
    >
      {status.replace(/_/g, " ").toLowerCase()}
    </span>
  );
}

/* ------------------------------ Auth ------------------------------ */

// Stricter than "contains @" but lenient enough for real addresses.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mirror the backend rule so users don't round-trip to discover a weak password.
const PASSWORD_RE = /(?=.*[A-Za-z])(?=.*\d)/;

function AuthForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const login = useAuth((s) => s.login);
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirect, setRedirect] = useState<string | null>(null);

  // Which fields the user has interacted with — errors only surface after a
  // blur (or once there's content), never on a pristine field.
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
  });

  // Email-verification step (shared by the register flow and the login-of-an-
  // unverified-account flow).
  const [step, setStep] = useState<"form" | "verify">("form");
  const [pendingEmail, setPendingEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [verifyNote, setVerifyNote] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Read ?redirect= from the URL after mount rather than via useSearchParams,
  // which would force a Suspense boundary / CSR bailout on this route.
  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get("redirect");
    // Only ever return to a path on this site — never an absolute URL, which
    // would turn the login form into an open redirect.
    if (r && r.startsWith("/") && !r.startsWith("//")) setRedirect(r);
  }, []);

  // Tick down the resend cooldown, one second at a time.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const emailValid = EMAIL_RE.test(email.trim());
  const passwordValid = password.length >= 8 && PASSWORD_RE.test(password);
  const nameValid = name.trim().length >= 2;

  const emailError = touched.email && !emailValid ? "Enter a valid email address" : "";
  const nameError =
    mode === "register" && touched.name && !nameValid
      ? "Please enter your name (at least 2 characters)"
      : "";
  const passwordError =
    mode === "register" && touched.password && !passwordValid
      ? "Password must be at least 8 characters and include a letter and a number"
      : "";

  const canSubmit =
    mode === "register"
      ? nameValid && emailValid && passwordValid
      : emailValid && password.length > 0;

  // Establish a session from a login-shaped response — the exact steps the auth
  // store runs after a normal sign-in (token, user, guest-cart merge, then flush
  // whatever the visitor was trying to add when the login gate stopped them).
  const establishSession = async (res: {
    user: ApiUser;
    accessToken: string;
  }) => {
    setToken(res.accessToken);
    useAuth.setState({ user: res.user });
    await useShop.getState().mergeGuestCart();
    const pending = takePendingAdd();
    if (pending) {
      try {
        await api.addToCart(pending.apiId, pending.qty);
        await useShop.getState().hydrate();
      } catch {
        /* the visitor is signed in either way — they can add it again */
      }
    }
  };

  const openVerifyStep = (forEmail: string, note: string) => {
    setPendingEmail(forEmail);
    setVerifyNote(note);
    setOtp("");
    setError("");
    setStep("verify");
    setCooldown(60);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setTouched({ name: true, email: true, password: true });
    if (!canSubmit) return;
    setLoading(true);
    try {
      if (mode === "register") {
        // No longer auto-logs in — the backend sent a code and we collect it.
        await api.register(name.trim(), email.trim(), password);
        openVerifyStep(email.trim(), `Enter the 6-digit code we sent to ${email.trim()}.`);
      } else {
        await login(email.trim(), password);
        if (redirect) router.push(redirect);
      }
    } catch (err) {
      const e2 = err as ApiError;
      if (mode === "login" && e2.code === "EMAIL_NOT_VERIFIED") {
        // Unverified customer: move them into the verify step and send a fresh
        // code rather than showing a dead-end error.
        openVerifyStep(email.trim(), `We sent a code to ${email.trim()}.`);
        try {
          await api.resendVerification(email.trim());
        } catch {
          /* the "resend" control below lets them try again */
        }
      } else {
        setError(e2.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const submitVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.verifyEmail(pendingEmail, otp);
      await establishSession(res);
      if (redirect) router.push(redirect);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0) return;
    setError("");
    try {
      await api.resendVerification(pendingEmail);
      toast.info(`A new code was sent to ${pendingEmail}.`);
    } catch {
      /* the endpoint always reports ok; keep the UX moving regardless */
    }
    setCooldown(60);
  };

  const backToForm = () => {
    setStep("form");
    setOtp("");
    setError("");
  };

  return (
    <div className="pb-20">
      <PageBanner title="My Account" crumb="Account" />
      <Container>
        <div className="mx-auto max-w-md rounded-2xl border border-line/60 bg-white p-8">
          {step === "verify" ? (
            <>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cream-card text-brand">
                <MailCheck className="h-5 w-5" />
              </span>
              <h2 className="mt-4 font-serif text-xl font-bold text-espresso">
                Verify your email
              </h2>
              <p className="mt-1 text-sm text-muted">
                {verifyNote || (
                  <>
                    We sent a 6-digit code to{" "}
                    <span className="font-medium text-coffee">{pendingEmail}</span>.
                  </>
                )}
              </p>
              <form onSubmit={submitVerify} className="mt-6 space-y-4">
                <Field
                  label="6-digit code"
                  value={otp}
                  onChange={(v) => setOtp(v.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  inputMode="numeric"
                />
                {error && <p className="text-sm text-sale">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full rounded-full bg-brand py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-70"
                >
                  {loading ? "Verifying…" : "Verify"}
                </button>
                <p className="text-center text-xs text-muted">
                  Didn&apos;t get the code?{" "}
                  {cooldown > 0 ? (
                    <span>Resend in {cooldown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={resend}
                      className="font-medium text-brand hover:underline"
                    >
                      Resend code
                    </button>
                  )}
                </p>
                <button
                  type="button"
                  onClick={backToForm}
                  className="flex w-full items-center justify-center gap-1.5 text-xs font-medium text-muted transition hover:text-brand"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
              </form>
            </>
          ) : (
            <>
              {redirect && (
                <p className="mb-5 rounded-xl bg-cream-card px-4 py-3 text-center text-sm text-coffee">
                  Please sign in or create an account to continue shopping.
                  We&apos;ll take you straight back.
                </p>
              )}
              <div className="mb-6 flex rounded-full bg-cream-card p-1">
                {(["login", "register"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setMode(m);
                      setError("");
                      setTouched({ name: false, email: false, password: false });
                    }}
                    className={cn(
                      "flex-1 rounded-full py-2 text-sm font-semibold capitalize transition",
                      mode === m ? "bg-brand text-white" : "text-coffee",
                    )}
                  >
                    {m === "login" ? "Sign In" : "Register"}
                  </button>
                ))}
              </div>

              <form onSubmit={submit} className="space-y-4">
                {mode === "register" && (
                  <Field
                    label="Full name"
                    value={name}
                    onChange={setName}
                    onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                    placeholder="Jane Doe"
                    error={nameError}
                  />
                )}
                <Field
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  placeholder="you@email.com"
                  error={emailError}
                />
                <Field
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  placeholder="••••••••"
                  error={passwordError}
                  hint={
                    mode === "register"
                      ? "At least 8 characters, including a letter and a number."
                      : undefined
                  }
                />

                {mode === "login" && (
                  <div className="text-right">
                    <Link
                      href="/account/reset"
                      className="text-xs font-medium text-brand hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                )}

                {error && <p className="text-sm text-sale">{error}</p>}

                <button
                  type="submit"
                  disabled={loading || !canSubmit}
                  className="w-full rounded-full bg-brand py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-70"
                >
                  {loading
                    ? "Please wait…"
                    : mode === "login"
                      ? "Sign In"
                      : "Create Account"}
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-muted">
                Secure sign-in · your account syncs your cart, wishlist and orders.
              </p>
            </>
          )}
        </div>
      </Container>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  onBlur,
  type = "text",
  placeholder,
  inputMode,
  error,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  type?: string;
  placeholder?: string;
  inputMode?: "numeric" | "text";
  error?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-coffee">{label}</label>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-xl border bg-cream-soft px-4 py-3 text-sm focus:outline-none",
          error ? "border-sale focus:border-sale" : "border-line focus:border-brand",
        )}
      />
      {error ? (
        <p className="mt-1.5 text-xs text-sale">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
