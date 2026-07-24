"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShoppingBag, Star } from "lucide-react";
import type { Product } from "@/lib/data";
import { useHydrated, useShop } from "@/lib/store";
import { useAddToCart } from "@/lib/use-add-to-cart";
import { useMoney } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { ProductBadges } from "./product-badge";

export function ProductCard({ product }: { product: Product }) {
  const [hover, setHover] = useState(false);
  const hydrated = useHydrated();
  const router = useRouter();
  const { format } = useMoney();

  const wished = useShop((s) => s.wishlist.includes(product.id));
  const toggleWishlist = useShop((s) => s.toggleWishlist);
  const addToCart = useAddToCart();

  const discount = product.oldPrice
    ? `-${Math.round((1 - product.price / product.oldPrice) * 100)}%`
    : undefined;

  const secondImage = product.images[1] ?? product.images[0];

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/product/${product.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(`/product/${product.id}`);
      }}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-line/60 bg-white transition-all duration-300 hover:-translate-y-1.5 hover:border-line hover:shadow-xl hover:shadow-espresso/10"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-cream-card">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn(
              "object-cover transition-all duration-700",
              hover ? "scale-110 opacity-0" : "scale-100 opacity-100",
            )}
          />
          <Image
            src={secondImage}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            aria-hidden
            className={cn(
              "object-cover transition-transform duration-700",
              hover ? "scale-105" : "scale-110",
            )}
          />

          <ProductBadges
            badges={product.badges}
            discount={discount}
            className="absolute left-3 top-3 z-10"
          />

          {!product.inStock && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
              <span className="rounded-full bg-espresso px-4 py-1.5 text-xs font-semibold text-cream">
                Out of Stock
              </span>
            </div>
          )}

          {/* Side actions — always visible so they work on touch (no hover) */}
          <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
            <ActionBtn
              label="Wishlist"
              active={hydrated && wished}
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(product.id);
              }}
            >
              <Heart className={cn("h-4 w-4", hydrated && wished && "fill-sale text-sale")} />
            </ActionBtn>
          </div>

          {/* Add to cart — always visible so it works on touch (no hover) */}
          {product.inStock && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                addToCart(product);
              }}
              className="absolute inset-x-3 bottom-3 z-10 flex items-center justify-center gap-2 rounded-full bg-brand py-2.5 text-xs font-semibold text-white shadow-lg transition-colors duration-300 hover:bg-brand-dark"
            >
              <ShoppingBag className="h-4 w-4" />
              Add to Cart
            </button>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-wide text-brand">
              {product.categoryName}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-medium text-coffee">{product.rating}</span>
              <span className="hidden sm:inline">({product.reviews})</span>
            </div>
          </div>

          <Link
            href={`/product/${product.id}`}
            onClick={(e) => e.stopPropagation()}
            className="mt-1.5 line-clamp-2 text-sm font-semibold text-ink transition hover:text-brand"
          >
            {product.name}
          </Link>

          <div className="mt-auto flex items-center justify-between pt-3">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-espresso">
                {format(product.price)}
              </span>
              {product.oldPrice && (
                <span className="text-sm text-muted line-through">
                  {format(product.oldPrice)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {product.colors.slice(0, 3).map((c) => (
                <span
                  key={c}
                  className="h-3.5 w-3.5 rounded-full border border-line"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
  );
}

function ActionBtn({
  children,
  label,
  active,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-coffee shadow-sm backdrop-blur transition-colors duration-300 hover:bg-brand hover:text-white",
        active && "text-brand",
      )}
    >
      {children}
    </button>
  );
}
