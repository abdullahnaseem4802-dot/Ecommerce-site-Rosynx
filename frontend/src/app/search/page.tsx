import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { fetchAllProducts } from "@/lib/catalog";
import { Container } from "@/components/ui/container";
import { PageBanner } from "@/components/ui/page-banner";
import { ButtonLink } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";

export const metadata: Metadata = {
  title: "Search — ROSYNX",
  description: "Search the ROSYNX handmade marketplace.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const lower = query.toLowerCase();

  const products = await fetchAllProducts();
  const results = query
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.categoryName.toLowerCase().includes(lower) ||
          p.material.toLowerCase().includes(lower),
      )
    : [];

  return (
    <div className="pb-20">
      <PageBanner
        title="Search"
        subtitle={query ? `Results for “${query}”` : "Find your next handmade treasure."}
        crumb="Search"
      />
      <Container>
        {query && results.length > 0 && (
          <p className="mb-6 text-sm text-muted">
            Showing {results.length} result{results.length === 1 ? "" : "s"} for{" "}
            <span className="font-medium text-coffee">&ldquo;{query}&rdquo;</span>
          </p>
        )}

        {results.length > 0 ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {results.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-cream-card text-brand">
              <SearchX className="h-7 w-7" />
            </span>
            <h2 className="font-serif text-2xl font-bold text-espresso">
              No results found
            </h2>
            <p className="max-w-md text-sm text-coffee/70">
              {query
                ? `We couldn't find anything matching “${query}”. Try a different keyword or browse the full collection.`
                : "Enter a keyword to search our handmade collection."}
            </p>
            <ButtonLink href="/shop" variant="primary">
              Browse the Shop
            </ButtonLink>
          </div>
        )}
      </Container>
    </div>
  );
}
