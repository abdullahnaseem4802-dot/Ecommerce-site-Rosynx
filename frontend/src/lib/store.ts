"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/lib/data";
import { primeCatalog, cachedProducts } from "@/lib/catalog-client";
import { api, getToken, type ApiCart } from "@/lib/api";

export type CartLine = {
  id: number;
  apiId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  qty: number;
};

export type AppliedCoupon = { code: string; discountCents: number };

type ShopState = {
  cart: CartLine[];
  wishlist: number[];
  compare: number[]; // legacy (unused in UI)
  coupon: AppliedCoupon | null;
  setCoupon: (c: AppliedCoupon | null) => void;
  addToCart: (p: Product, qty?: number) => void;
  removeFromCart: (id: number) => void;
  setQty: (id: number, qty: number) => void;
  toggleWishlist: (id: number) => void;
  toggleCompare: (id: number) => void;
  clearCompare: () => void;
  clearCart: () => void;
  hydrate: () => Promise<void>;
  mergeGuestCart: () => Promise<void>;
};

/** Map a server cart response to local CartLine[] (numeric ids via live cache). */
function toLines(cart: ApiCart): CartLine[] {
  const catalog = cachedProducts();
  return cart.items.map((i) => {
    const p = catalog.find((x) => x.slug === i.slug || x.apiId === i.productId);
    return {
      id: p?.id ?? 0,
      apiId: i.productId,
      slug: i.slug,
      name: i.name,
      price: i.price,
      image: i.image ?? p?.images[0] ?? "",
      qty: i.qty,
    };
  });
}

// Resolve the backend product id for a local line: prefer the line itself
// (it always carries apiId), then fall back to the live catalog cache.
function apiIdOfIn(cart: CartLine[], id: number) {
  return (
    cart.find((l) => l.id === id)?.apiId ??
    cachedProducts().find((p) => p.id === id)?.apiId ??
    ""
  );
}

export const useShop = create<ShopState>()(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],
      compare: [],
      coupon: null,

      setCoupon: (c) => set({ coupon: c }),

      addToCart: (p, qty = 1) => {
        // optimistic
        set((s) => {
          const existing = s.cart.find((l) => l.id === p.id);
          if (existing) {
            return {
              cart: s.cart.map((l) =>
                l.id === p.id ? { ...l, qty: l.qty + qty } : l,
              ),
            };
          }
          return {
            cart: [
              ...s.cart,
              {
                id: p.id,
                apiId: p.apiId,
                slug: p.slug,
                name: p.name,
                price: p.price,
                image: p.images[0],
                qty,
              },
            ],
          };
        });
        api
          .addToCart(p.apiId, qty)
          .then((c) => set({ cart: toLines(c) }))
          .catch(() => {});
      },

      removeFromCart: (id) => {
        const apiId = apiIdOfIn(get().cart, id);
        set((s) => ({ cart: s.cart.filter((l) => l.id !== id) }));
        api
          .removeCartItem(apiId)
          .then((c) => set({ cart: toLines(c) }))
          .catch(() => {});
      },

      setQty: (id, qty) => {
        const apiId = apiIdOfIn(get().cart, id);
        set((s) => ({
          cart: s.cart
            .map((l) => (l.id === id ? { ...l, qty: Math.max(1, qty) } : l))
            .filter((l) => l.qty > 0),
        }));
        const call =
          qty <= 0
            ? api.removeCartItem(apiId)
            : api.setCartQty(apiId, Math.max(1, qty));
        call.then((c) => set({ cart: toLines(c) })).catch(() => {});
      },

      clearCart: () => {
        set({ cart: [], coupon: null });
        api.clearCart().catch(() => {});
      },

      toggleWishlist: (id) => {
        const has = get().wishlist.includes(id);
        set((s) => ({
          wishlist: has
            ? s.wishlist.filter((x) => x !== id)
            : [...s.wishlist, id],
        }));
        // wishlist is per-user on the server → only sync when logged in
        if (getToken()) {
          const apiId = cachedProducts().find((p) => p.id === id)?.apiId ?? "";
          if (apiId)
            (has ? api.removeWishlist(apiId) : api.addWishlist(apiId)).catch(
              () => {},
            );
        }
      },

      toggleCompare: (id) =>
        set((s) => ({
          compare: s.compare.includes(id)
            ? s.compare.filter((x) => x !== id)
            : [...s.compare, id].slice(-4),
        })),
      clearCompare: () => set({ compare: [] }),

      hydrate: async () => {
        await primeCatalog(); // ensure live catalog is loaded for id/image mapping
        try {
          const cart = await api.getCart();
          set({ cart: toLines(cart) });
        } catch {
          /* keep local */
        }
        if (getToken()) {
          try {
            const wl = await api.getWishlist();
            const catalog = cachedProducts();
            const ids = wl
              .map((w) => catalog.find((p) => p.slug === w.slug)?.id)
              .filter((x): x is number => typeof x === "number");
            set({ wishlist: ids });
          } catch {
            /* keep local */
          }
        }
      },

      mergeGuestCart: async () => {
        const guest =
          typeof window !== "undefined"
            ? localStorage.getItem("rosynx-guest") ?? ""
            : "";
        try {
          if (guest) await api.mergeCart(guest);
        } catch {
          /* ignore */
        }
        // push any local wishlist to the server, then reload from server
        await primeCatalog();
        const local = get().wishlist;
        const catalog = cachedProducts();
        for (const id of local) {
          const apiId = catalog.find((p) => p.id === id)?.apiId ?? "";
          if (apiId) await api.addWishlist(apiId).catch(() => {});
        }
        await get().hydrate();
      },
    }),
    { name: "rosynx-shop" },
  ),
);

/** True only after the client has mounted (gates persisted UI vs SSR). */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

/** Sync cart/wishlist with the server once on mount. Mount once in layout. */
export function useStoreSync() {
  const hydrate = useShop((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
}

export function useCartCount() {
  return useShop((s) => s.cart.reduce((n, l) => n + l.qty, 0));
}
export function useCartTotal() {
  return useShop((s) => s.cart.reduce((n, l) => n + l.qty * l.price, 0));
}
