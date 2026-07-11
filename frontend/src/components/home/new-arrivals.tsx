"use client";

import { useMemo } from "react";
import { useAllProducts } from "@/lib/catalog-client";
import { Container } from "@/components/ui/container";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { ProductCard } from "@/components/product/product-card";
import { SectionHeading } from "./section-heading";

export function NewArrivals() {
  const { products } = useAllProducts();
  const newArrivals = useMemo(() => {
    const tagged = products.filter((p) => p.badges.includes("new"));
    const list = tagged.length
      ? tagged
      : [...products].sort((a, b) => b.id - a.id);
    return list.slice(0, 8);
  }, [products]);

  return (
    <Container className="pt-14">
      <Reveal>
        <SectionHeading title="New Arrivals" viewAllHref="/shop?sort=newest" />
      </Reveal>
      <RevealGroup className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {newArrivals.map((product) => (
          <RevealItem key={product.id}>
            <ProductCard product={product} />
          </RevealItem>
        ))}
      </RevealGroup>
    </Container>
  );
}
