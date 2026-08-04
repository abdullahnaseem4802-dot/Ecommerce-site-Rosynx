"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useCategories } from "@/lib/catalog-client";
import { Container } from "@/components/ui/container";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";

export function CategoryStrip() {
  const categories = useCategories();
  const strip = categories.slice(0, 5);
  return (
    <Container className="pt-5 sm:pt-6">
      <RevealGroup className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        {strip.map((cat) => (
          <RevealItem key={cat.slug}>
            <Link
              href={`/shop?category=${cat.slug}`}
              className="group relative flex h-[118px] items-center overflow-hidden rounded-2xl border border-line/60 bg-cream-card px-4 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-espresso/5 sm:h-[150px] sm:px-5"
            >
              <div className="relative z-10 flex h-full flex-col justify-center">
                <h3 className="font-serif text-lg font-semibold text-espresso">
                  {cat.name.replace(" Collection", "")}
                </h3>
                <p className="mt-1 text-xs text-muted">{cat.productCount ?? 0} Products</p>
                <span className="mt-4 flex h-9 w-9 items-center justify-center rounded-full border border-coffee/30 text-coffee transition group-hover:border-brand group-hover:bg-brand group-hover:text-white">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
              <div className="absolute bottom-0 right-0 top-0 w-[52%]">
                <Image
                  src={cat.imageUrl || `/images/categories/${cat.slug}.jpg`}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 1024px) 40vw, 16vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-cream-card via-cream-card/40 to-transparent" />
              </div>
            </Link>
          </RevealItem>
        ))}
      </RevealGroup>
    </Container>
  );
}
