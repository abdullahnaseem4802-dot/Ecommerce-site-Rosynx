"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import { useCartTotal, useHydrated, useShop, type CartLine } from "@/lib/store";
import type { Product } from "@/lib/data";
import { Container } from "@/components/ui/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ButtonLink } from "@/components/ui/button";
import { CouponBox } from "@/components/cart/coupon-box";
import { useMoney } from "@/lib/currency";

export default function CartPage() {
  const hydrated = useHydrated();
  const cart = useShop((s) => s.cart);
  const setQty = useShop((s) => s.setQty);
  const remove = useShop((s) => s.removeFromCart);
  const addToCart = useShop((s) => s.addToCart);
  const coupon = useShop((s) => s.coupon);
  const { format } = useMoney();
  const subtotal = useCartTotal();

  const [saved, setSaved] = useState<CartLine[]>([]);

  const discount = coupon ? Math.min(coupon.discountCents / 100, subtotal) : 0;
  const shipping = 0; // free shipping (store policy)
  const total = subtotal - discount + shipping;

  const saveForLater = (line: CartLine) => {
    remove(line.apiId);
    setSaved((s) => (s.find((x) => x.apiId === line.apiId) ? s : [...s, line]));
  };
  const moveToCart = (line: CartLine) => {
    // Rebuild a minimal Product from the saved line (addToCart only reads
    // id/apiId/slug/name/price/images[0]).
    const p = {
      id: line.id,
      apiId: line.apiId,
      slug: line.slug,
      name: line.name,
      price: line.price,
      images: [line.image],
    } as Product;
    addToCart(p, line.qty);
    setSaved((s) => s.filter((x) => x.apiId !== line.apiId));
  };

  return (
    <div className="pb-20">
      <Container className="py-6">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Cart" }]} />
        <h1 className="mt-4 font-serif text-3xl font-bold text-espresso sm:text-4xl">
          Shopping Cart
        </h1>
      </Container>

      <Container>
        {!hydrated ? null : cart.length === 0 && saved.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white py-20 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-cream-card text-brand">
              <ShoppingBag className="h-7 w-7" />
            </span>
            <h2 className="mt-4 font-serif text-xl font-bold text-espresso">
              Your cart is empty
            </h2>
            <p className="mt-1 text-sm text-muted">
              Looks like you haven&apos;t added anything yet.
            </p>
            <ButtonLink href="/shop" className="mt-5">
              Continue Shopping
            </ButtonLink>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              {cart.map((l) => (
                <div key={l.apiId} className="flex gap-4 rounded-2xl border border-line/60 bg-white p-3 sm:p-4">
                  <Link href={`/product/${l.id}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-cream-card sm:h-28 sm:w-28">
                    <Image src={l.image} alt={l.name} fill sizes="112px" className="object-cover" />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <Link href={`/product/${l.id}`} className="font-serif text-base font-semibold text-espresso transition hover:text-brand sm:text-lg">
                      {l.name}
                    </Link>
                    <span className="mt-1 text-sm text-muted">{format(l.price)} each</span>
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                      <div className="flex items-center rounded-full border border-line">
                        <button onClick={() => setQty(l.apiId, l.qty - 1)} className="flex h-9 w-9 items-center justify-center text-coffee hover:text-brand" aria-label="Decrease">
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{l.qty}</span>
                        <button onClick={() => setQty(l.apiId, l.qty + 1)} className="flex h-9 w-9 items-center justify-center text-coffee hover:text-brand" aria-label="Increase">
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-espresso">{format(l.price * l.qty)}</span>
                        <button onClick={() => saveForLater(l)} className="text-xs font-medium text-muted transition hover:text-brand">
                          Save for later
                        </button>
                        <button onClick={() => remove(l.apiId)} aria-label="Remove item" className="text-muted transition hover:text-sale">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Saved for later */}
              {saved.length > 0 && (
                <div className="pt-2">
                  <h3 className="mb-3 font-serif text-lg font-bold text-espresso">
                    Saved for later ({saved.length})
                  </h3>
                  <div className="space-y-3">
                    {saved.map((l) => (
                      <div key={l.apiId} className="flex items-center gap-4 rounded-2xl border border-line/60 bg-cream-soft p-3">
                        <Link href={`/product/${l.id}`} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-cream-card">
                          <Image src={l.image} alt={l.name} fill sizes="64px" className="object-cover" />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-coffee">{l.name}</p>
                          <p className="text-sm font-semibold text-espresso">{format(l.price)}</p>
                        </div>
                        <button onClick={() => moveToCart(l)} className="rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark">
                          Move to cart
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="h-fit space-y-4 lg:sticky lg:top-40">
              {cart.length > 0 && (
                <div className="rounded-2xl border border-line/60 bg-white p-6">
                  <h2 className="font-serif text-lg font-bold text-espresso">Order Summary</h2>

                  {/* Coupon */}
                  <div className="mt-4">
                    <CouponBox subtotal={subtotal} />
                  </div>

                  <dl className="mt-4 space-y-3 border-t border-line pt-4 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted">Subtotal</dt>
                      <dd className="font-medium text-coffee">{format(subtotal)}</dd>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-newtag">
                        <dt>Discount</dt>
                        <dd className="font-medium">−{format(discount)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-muted">Shipping</dt>
                      <dd className="font-medium text-coffee">
                        {shipping === 0 ? "Free" : format(shipping)}
                      </dd>
                    </div>
                    <div className="flex justify-between border-t border-line pt-3 text-base">
                      <dt className="font-semibold text-espresso">Total</dt>
                      <dd className="font-bold text-espresso">{format(total)}</dd>
                    </div>
                  </dl>

                  <ButtonLink href="/checkout" size="lg" className="mt-5 w-full">
                    Proceed to Checkout
                  </ButtonLink>
                  <Link href="/shop" className="mt-3 block text-center text-sm font-medium text-brand hover:underline">
                    Continue shopping
                  </Link>
                </div>
              )}

              {/* Shipping estimate */}
              <div className="rounded-2xl border border-line/60 bg-white p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-coffee">
                  <Truck className="h-4 w-4 text-brand" /> Estimated delivery
                </div>
                <p className="mt-2 flex items-center gap-2 text-sm text-coffee/80">
                  <Check className="h-4 w-4 text-newtag" /> 2–5 business days
                </p>
                <p className="mt-1 text-xs text-muted">
                  Free shipping on orders over $100 · ships from our studio in Cairo.
                </p>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
