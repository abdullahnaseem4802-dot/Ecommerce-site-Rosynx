"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCategories } from "@/lib/catalog-client";
import type { ApiCategory } from "@/lib/catalog";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "./section-heading";

export function FeaturedCategories() {
  const categories = useCategories();
  const flagged = categories.filter((c) => c.isFeatured);
  // Show every flagged category (not just the first four) — the carousel below
  // loops through all of them.
  const featured = flagged.length ? flagged : categories;

  return (
    <Container className="pt-10 sm:pt-14">
      <Reveal>
        <SectionHeading
          title="Featured Categories"
          viewAllLabel="View All Categories"
          viewAllHref="/shop"
        />
      </Reveal>

      {featured.length > 0 && <CategoryCarousel categories={featured} />}
    </Container>
  );
}

function CategoryCarousel({ categories }: { categories: ApiCategory[] }) {
  // Continuous marquee via a CSS transform (GPU-composited, so it slides the
  // same on every browser/device regardless of scroll-container quirks). The
  // list is rendered twice and translated by exactly -50%, so the moment the
  // first copy scrolls fully off, the second copy is pixel-aligned where it
  // began — a seamless, non-stop loop. Each card carries its gap as a right
  // margin (not flex `gap`) so -50% lands exactly on one copy's width.
  const loop = [...categories, ...categories];
  // Keep a constant reading speed regardless of how many categories there are:
  // ~one card every 5s, minimum 20s per full pass.
  const duration = Math.max(20, categories.length * 5);

  return (
    <div className="overflow-hidden">
      <motion.div
        className="flex w-max"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration, ease: "linear", repeat: Infinity }}
      >
        {loop.map((cat, i) => (
          <div
            key={`${cat.slug}-${i}`}
            className="mr-5 w-[78vw] max-w-[320px] shrink-0 sm:w-[320px] lg:w-[300px]"
          >
            <CategoryCard cat={cat} />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function CategoryCard({ cat }: { cat: ApiCategory }) {
  return (
    <Link
      href={`/shop?category=${cat.slug}`}
      className="group relative block h-[200px] overflow-hidden rounded-2xl"
    >
      <Image
        src={cat.imageUrl || `/images/categories/${cat.slug}.jpg`}
        alt={cat.name}
        fill
        sizes="(max-width: 640px) 78vw, (max-width: 1024px) 320px, 300px"
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
  );
}
