"use client";

import Image from "next/image";
import Link from "next/link";
import { useCategories } from "@/lib/catalog-client";
import { Container } from "@/components/ui/container";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { SectionHeading } from "./section-heading";

export function FeaturedCategories() {
  const categories = useCategories();
  const flagged = categories.filter((c) => c.isFeatured);
  const featured = (flagged.length ? flagged : categories).slice(0, 4);

  return (
    <Container className="pt-14">
      <Reveal>
        <SectionHeading
          title="Featured Categories"
          viewAllLabel="View All Categories"
          viewAllHref="/shop"
        />
      </Reveal>
      <RevealGroup className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {featured.map((cat) => (
          <RevealItem key={cat.slug}>
            <Link
              href={`/shop?category=${cat.slug}`}
              className="group relative block h-[200px] overflow-hidden rounded-2xl"
            >
              <Image
                src={cat.imageUrl || `/images/categories/${cat.slug}.jpg`}
                alt={cat.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-espresso/80 via-espresso/25 to-transparent" />
              <div className="absolute inset-x-4 bottom-4 text-white">
                <h3 className="font-serif text-xl font-semibold">
                  {cat.name.replace(" Collection", "")}
                </h3>
                <p className="text-xs text-white/80">{cat.productCount ?? 0} Items</p>
                <span className="mt-2 inline-flex translate-y-1 items-center gap-1 text-xs font-medium text-white/0 transition-all duration-300 group-hover:translate-y-0 group-hover:text-white">
                  View Collection →
                </span>
              </div>
            </Link>
          </RevealItem>
        ))}
      </RevealGroup>
    </Container>
  );
}
