"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useShop } from "@/lib/store";
import { toast } from "@/lib/toast";
import { setPendingAdd } from "@/lib/cart-intent";
import type { Product } from "@/lib/data";

/**
 * The single entry point for adding to the cart. Every "Add to Cart" button
 * goes through here so the login gate and the confirmation toast can never
 * drift apart between call sites.
 *
 * Returns true if the item went into the cart, false if the visitor was sent
 * to sign in first (the item is remembered and added once they're back).
 */
export function useAddToCart() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const ready = useAuth((s) => s.ready);
  const add = useShop((s) => s.addToCart);

  return (p: Product, qty = 1): boolean => {
    // Session is still being restored — don't bounce a logged-in user to the
    // login page just because we haven't heard back from /auth/me yet. Say so
    // rather than returning silently, since a cold start can make this window
    // long enough to feel like a dead button.
    if (!ready) {
      toast.info("One moment — still loading your session.");
      return false;
    }

    if (!user) {
      setPendingAdd(p.apiId, qty);
      toast.info("Please sign in to add items to your cart", {
        description: "We'll add it for you right after.",
      });
      // Preserve the query string (e.g. /shop?category=…) so the visitor lands
      // back exactly where they were.
      const back = window.location.pathname + window.location.search;
      router.push(`/account?redirect=${encodeURIComponent(back)}`);
      return false;
    }

    add(p, qty);
    toast.success("Added to cart", {
      description: qty > 1 ? `${p.name} × ${qty}` : p.name,
      image: p.images[0],
      href: "/cart",
      hrefLabel: "View cart",
    });
    return true;
  };
}
