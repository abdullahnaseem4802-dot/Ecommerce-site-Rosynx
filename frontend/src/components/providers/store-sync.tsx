"use client";

import { useEffect } from "react";
import { useStoreSync } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useCurrency } from "@/lib/currency";

/**
 * Restores the logged-in session (via JWT), syncs the cart/wishlist with the
 * backend, and initializes currency rates + display currency once on load.
 * Renders nothing.
 */
export function StoreSync() {
  useStoreSync();
  const restore = useAuth((s) => s.restore);
  const initCurrency = useCurrency((s) => s.init);
  useEffect(() => {
    restore();
    initCurrency();
  }, [restore, initCurrency]);
  return null;
}
