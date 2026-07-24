"use client";

import { useState } from "react";
import { Tag, X } from "lucide-react";
import { useShop } from "@/lib/store";
import { api } from "@/lib/api";

/**
 * Coupon apply/remove UI. Reads and writes the applied coupon in the shared
 * store so cart and checkout stay in sync, and validates against the API using
 * the current subtotal. Coupons are never advertised here — the customer must
 * already know the code.
 */
export function CouponBox({ subtotal }: { subtotal: number }) {
  const coupon = useShop((s) => s.coupon);
  const setCoupon = useShop((s) => s.setCoupon);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const apply = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError("Enter a coupon code.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await api.validateCoupon(trimmed, Math.round(subtotal * 100));
      if (res.valid) {
        setCoupon({ code: res.code, discountCents: res.discountCents });
        setCode("");
      } else {
        setError(res.reason || "Invalid coupon code.");
        setCoupon(null);
      }
    } catch {
      setError("Could not validate coupon. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (coupon) {
    return (
      <div className="flex items-center justify-between rounded-xl bg-newtag/10 px-3 py-2.5 text-sm">
        <span className="flex items-center gap-2 font-medium text-newtag">
          <Tag className="h-4 w-4" /> {coupon.code} applied
        </span>
        <button
          onClick={() => setCoupon(null)}
          aria-label="Remove coupon"
          className="text-muted hover:text-sale"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              apply();
            }
          }}
          placeholder="Coupon code"
          className="flex-1 rounded-xl border border-line bg-cream-soft px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
        <button
          onClick={apply}
          disabled={loading}
          className="rounded-xl bg-espresso px-4 text-sm font-semibold text-cream transition hover:bg-coffee disabled:opacity-70"
        >
          {loading ? "…" : "Apply"}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-sale">{error}</p>}
    </div>
  );
}
