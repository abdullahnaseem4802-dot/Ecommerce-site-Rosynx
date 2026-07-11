import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Reveal } from "@/components/ui/reveal";
import { ProductDetail } from "@/components/product/product-detail";
import { ProductCard } from "@/components/product/product-card";
import { SectionHeading } from "@/components/home/section-heading";
import { fetchAllProducts, fetchProductBySlug, fetchRelated } from "@/lib/catalog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const all = await fetchAllProducts();
  const product = all.find((p) => p.id === Number(id));
  if (!product) return { title: "Product not found — ROSYNX" };
  return {
    title: `${product.name} — ROSYNX`,
    description: product.short,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const all = await fetchAllProducts();
  const product = all.find((p) => p.id === Number(id));
  if (!product) notFound();

  // Fresh single-product read (ensures latest specs) + related from the API.
  const [full, related] = await Promise.all([
    fetchProductBySlug(product.slug),
    fetchRelated(product.slug),
  ]);
  const detail = full ?? product;

  return (
    <div className="pb-20">
      <Container className="py-6">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/shop" },
            {
              label: detail.categoryName.replace(" Collection", ""),
              href: `/shop?category=${detail.category}`,
            },
            { label: detail.name },
          ]}
        />
      </Container>

      <Container>
        <ProductDetail product={detail} />
      </Container>

      {related.length > 0 && (
        <Container className="pt-20">
          <Reveal>
            <SectionHeading title="You May Also Like" viewAllHref="/shop" />
          </Reveal>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </Container>
      )}
    </div>
  );
}
