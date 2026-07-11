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

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const categorySlug = typeof sp.category === "string" ? sp.category : undefined;

  const [products, categories] = await Promise.all([
    fetchAllProducts(),
    fetchCategories(),
  ]);
  const category = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : undefined;

  const title = category ? category.name.replace(" Collection", "") : "Shop All";
  const subtitle = category
    ? category.description ?? "Explore our full collection of handcrafted treasures."
    : "Explore our full collection of handcrafted treasures.";

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
                ...(category ? [{ label: title }] : []),
              ]}
            />
          </div>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">
            ROSYNX Marketplace
          </p>
          <h1 className="mt-0.5 font-serif text-2xl font-bold text-espresso sm:text-3xl">
            {title}
          </h1>
          <p className="mx-auto mt-1 max-w-xl text-sm text-muted">{subtitle}</p>
        </Container>
      </div>

      <Container className="pt-6">
        <ShopView
          initialCategory={categorySlug}
          products={products}
          categories={categories}
        />
      </Container>
    </div>
  );
}
