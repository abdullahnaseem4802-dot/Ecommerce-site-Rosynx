"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/lib/data";
import { primeCatalog, cachedProducts } from "@/lib/catalog-client";
import { api, getToken, type ApiCart } from "@/lib/api";
import { toast } from "@/lib/toast";

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
  removeFromCart: (apiId: string) => void;
  setQty: (apiId: string, qty: number) => void;
  toggleWishlist: (id: number) => void;
  toggleCompare: (id: number) => void;
  clearCompare: () => void;
  clearCart: () => void;
  hydrate: () => Promise<void>;
  mergeGuestCart: () => Promise<void>;
};

/**
 * Map a server cart response to local CartLine[]. The numeric `id` is only used
 * for product links and may be 0 when the catalog cache is cold; the stable
 * identity of a line is its `apiId` (the backend product cuid), which always
 * comes straight from the server response and never collapses.
 */
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

export const useShop = create<ShopState>()(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],
      compare: [],
      coupon: null,

      setCoupon: (c) => set({ coupon: c }),

      addToCart: (p, qty = 1) => {
        // optimistic — dedupe by the stable apiId (numeric id can collide at 0
        // when the catalog cache is cold).
        set((s) => {
          const existing = s.cart.find((l) => l.apiId === p.apiId);
          if (existing) {
            return {
              cart: s.cart.map((l) =>
                l.apiId === p.apiId ? { ...l, qty: l.qty + qty } : l,
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
          .catch((err: Error) => {
            // Roll the optimistic add back. Without this the item looks added
            // and then silently disappears on the next hydrate().
            set((s) => {
              const existing = s.cart.find((l) => l.apiId === p.apiId);
              if (!existing) return s;
              return existing.qty <= qty
                ? { cart: s.cart.filter((l) => l.apiId !== p.apiId) }
                : {
                    cart: s.cart.map((l) =>
                      l.apiId === p.apiId ? { ...l, qty: l.qty - qty } : l,
                    ),
                  };
            });
            toast.error("Couldn't add to cart", {
              description: err?.message || "Please try again.",
            });
          });
      },

      removeFromCart: (apiId) => {
        // Key by the stable apiId so removing one line never takes out other
        // lines that happen to share a numeric id of 0 (cold catalog cache).
        if (!apiId) return;
        set((s) => ({ cart: s.cart.filter((l) => l.apiId !== apiId) }));
        api
          .removeCartItem(apiId)
          .then((c) => set({ cart: toLines(c) }))
          .catch(() => {});
      },

      setQty: (apiId, qty) => {
        if (!apiId) return;
        set((s) => ({
          cart: s.cart
            .map((l) => (l.apiId === apiId ? { ...l, qty: Math.max(1, qty) } : l))
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
