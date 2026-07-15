import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ShopView } from "@/components/shop/shop-view";
import { fetchAllProducts, fetchCategories } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop — ROSYNX Handmade Marketplace",
  description:
    "Browse handcrafted luxury décor — rosewood, onyx, stone, leather and more. Filter by category, material, price and rating.",
};

// Static + ISR: the catalog is the same regardless of the ?category= filter
// (filtering happens on the client), so this page can be edge-cached.
//
// 5 minutes, not 60s: this is the heaviest page in the app (the whole catalog
// is rendered for client-side filtering), so each regeneration is expensive.
// Regenerating it every minute kept it permanently STALE and keeps the free-tier
// API saturated. Admin edits show within 5 minutes.
export const revalidate = 300;

export default async function ShopPage() {
  const [products, categories] = await Promise.all([
    fetchAllProducts(),
    fetchCategories(),
  ]);

  return (
    <div className="pb-16">
      {/* Banner */}
      <div className="border-b border-line bg-cream-card">
        <Container className="py-5 text-center">
          <div className="flex justify-center">
            <Breadcrumb
              items={[
                { label: "Home", href: "/" },
                { label: "Shop", href: "/shop" },
              ]}
            />
          </div>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">
            ROSYNX Marketplace
          </p>
          <h1 className="mt-0.5 font-serif text-2xl font-bold text-espresso sm:text-3xl">
            Shop All
          </h1>
          <p className="mx-auto mt-1 max-w-xl text-sm text-muted">
            Explore our full collection of handcrafted treasures.
          </p>
        </Container>
      </div>

      <Container className="pt-6">
        <ShopView products={products} categories={categories} />
      </Container>
    </div>
  );
}
