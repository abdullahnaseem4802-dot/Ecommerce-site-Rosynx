"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { Container } from "@/components/ui/container";

function SandboxPayInner() {
  const router = useRouter();
  const params = useSearchParams();
  const orderNumber = params.get("order") ?? "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pay = async () => {
    if (!orderNumber) return;
    setError("");
    setLoading(true);
    try {
      await api.sandboxPay(orderNumber);
      router.push(`/order-success?id=${orderNumber}`);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="py-16">
      <Container className="max-w-lg">
        <div className="overflow-hidden rounded-3xl border border-line/60 bg-white shadow-sm">
          {/* Sandbox banner */}
          <div className="flex items-center justify-center gap-2 bg-brand/10 px-6 py-3 text-center">
            <ShieldCheck className="h-4 w-4 text-brand" />
            <span className="text-xs font-semibold uppercase tracking-wide text-brand">
              Sandbox Payment — Test Gateway
            </span>
          </div>

          <div className="p-8 text-center sm:p-10">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cream-soft">
              <CreditCard className="h-8 w-8 text-brand" />
            </span>
            <h1 className="mt-5 font-serif text-2xl font-bold text-espresso">
              Debit / Credit Card
            </h1>
            <p className="mt-2 text-sm text-muted">
              You are paying for order
            </p>
            <p className="font-semibold text-coffee">
              {orderNumber || "—"}
            </p>

            {/* Fake card summary */}
            <div className="mx-auto mt-6 max-w-sm rounded-2xl bg-espresso p-5 text-left text-cream shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-cream/70">
                  Test Card
                </span>
                <CreditCard className="h-5 w-5 text-cream/80" />
              </div>
              <p className="mt-6 font-mono text-lg tracking-widest">
                4242 4242 4242 4242
              </p>
              <div className="mt-4 flex justify-between text-xs text-cream/80">
                <span>SANDBOX CUSTOMER</span>
                <span>12 / 34</span>
              </div>
            </div>

            <button
              onClick={pay}
              disabled={loading || !orderNumber}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing…
                </>
              ) : (
                "Pay now (simulate success)"
              )}
            </button>

            {error && (
              <p className="mt-3 text-center text-xs text-sale">{error}</p>
            )}

            <Link
              href="/checkout"
              className="mt-4 inline-block text-xs font-medium text-muted underline-offset-4 hover:underline"
            >
              Cancel and return to checkout
            </Link>

            <p className="mt-6 rounded-xl bg-cream-soft px-4 py-3 text-xs leading-relaxed text-muted">
              This is a test payment gateway. No real card is charged and no
              money moves. In production, real Safepay / Paymob keys replace
              this sandbox with the live card checkout.
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default function SandboxPayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
        </div>
      }
    >
      <SandboxPayInner />
    </Suspense>
  );
}
