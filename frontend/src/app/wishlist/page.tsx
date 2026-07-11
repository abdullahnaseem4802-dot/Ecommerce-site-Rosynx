"use client";

import { Heart } from "lucide-react";
import { useAllProducts } from "@/lib/catalog-client";
import { useHydrated, useShop } from "@/lib/store";
import { Container } from "@/components/ui/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ButtonLink } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";

export default function WishlistPage() {
  const hydrated = useHydrated();
  const ids = useShop((s) => s.wishlist);
  const { products } = useAllProducts();
  const items = products.filter((p) => ids.includes(p.id));

  return (
    <div className="pb-20">
      <Container className="py-6">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Wishlist" }]} />
        <h1 className="mt-4 font-serif text-3xl font-bold text-espresso sm:text-4xl">
          My Wishlist
        </h1>
        {hydrated && items.length > 0 && (
          <p className="mt-1 text-sm text-muted">{items.length} saved items</p>
        )}
      </Container>

      <Container>
        {!hydrated ? null : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white py-20 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-cream-card text-brand">
              <Heart className="h-7 w-7" />
            </span>
            <h2 className="mt-4 font-serif text-xl font-bold text-espresso">
              Your wishlist is empty
            </h2>
            <p className="mt-1 text-sm text-muted">
              Tap the heart on any product to save it here.
            </p>
            <ButtonLink href="/shop" className="mt-5">
              Discover Products
            </ButtonLink>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
