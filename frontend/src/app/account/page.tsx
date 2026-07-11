"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Package, ShoppingBag } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useHydrated, useShop } from "@/lib/store";
import { api, type OrderSummary } from "@/lib/api";
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
  const cart = useShop((s) => s.cart.length);
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

function AuthForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const login = useAuth((s) => s.login);
  const register = useAuth((s) => s.register);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.includes("@") || password.length < 8) {
      setError("Enter a valid email and a password of at least 8 characters.");
      return;
    }
    if (mode === "register" && name.trim().length < 2) {
      setError("Please enter your name.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "register") await register(name.trim(), email, password);
      else await login(email, password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-20">
      <PageBanner title="My Account" crumb="Account" />
      <Container>
        <div className="mx-auto max-w-md rounded-2xl border border-line/60 bg-white p-8">
          <div className="mb-6 flex rounded-full bg-cream-card p-1">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError("");
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
              <Field label="Full name" value={name} onChange={setName} placeholder="Jane Doe" />
            )}
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@email.com" />
            <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />

            {error && <p className="text-sm text-sale">{error}</p>}

            <button
              type="submit"
              disabled={loading}
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-coffee">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-line bg-cream-soft px-4 py-3 text-sm focus:border-brand focus:outline-none"
      />
    </div>
  );
}
