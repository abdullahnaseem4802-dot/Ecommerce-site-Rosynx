"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCategories } from "@/lib/catalog-client";
import type { ApiCategory } from "@/lib/catalog";
import { Container } from "@/components/ui/container";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { SectionHeading } from "./section-heading";

export function FeaturedCategories() {
  const categories = useCategories();
  const flagged = categories.filter((c) => c.isFeatured);
  // Show every flagged category (not just the first four) — the carousel below
  // loops through all of them when there are more than fit in one row.
  const featured = flagged.length ? flagged : categories;

  return (
    <Container className="pt-14">
      <Reveal>
        <SectionHeading
          title="Featured Categories"
          viewAllLabel="View All Categories"
          viewAllHref="/shop"
        />
      </Reveal>

      {featured.length > 4 ? (
        <CategoryCarousel categories={featured} />
      ) : (
        <RevealGroup className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((cat) => (
            <RevealItem key={cat.slug}>
              <CategoryCard cat={cat} />
            </RevealItem>
          ))}
        </RevealGroup>
      )}
    </Container>
  );
}

function CategoryCarousel({ categories }: { categories: ApiCategory[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  // Continuous marquee: scroll left at a slow, constant speed with no snapping,
  // so the row glides non-stop instead of the old step-and-pause behaviour. The
  // list is rendered twice; once we've scrolled past the first copy we subtract
  // its width to loop seamlessly. Pauses while the pointer is over the row.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let paused = false;
    let raf = 0;
    const SPEED = 0.4; // px per frame ≈ 24px/s — slow enough to read

    const onEnter = () => (paused = true);
    const onLeave = () => (paused = false);
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);

    const tick = () => {
      if (!paused) {
        el.scrollLeft += SPEED;
        // scrollWidth is the doubled track; half is one full copy.
        const half = el.scrollWidth / 2;
        if (half > 0 && el.scrollLeft >= half) el.scrollLeft -= half;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [categories.length]);

  // Duplicate the list so the loop point is invisible.
  const loop = [...categories, ...categories];

  return (
    <div
      ref={trackRef}
      className="flex gap-5 overflow-x-hidden pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {loop.map((cat, i) => (
        <div
          key={`${cat.slug}-${i}`}
          className="w-[80%] shrink-0 sm:w-[calc((100%-20px)/2)] lg:w-[calc((100%-60px)/4)]"
        >
          <CategoryCard cat={cat} />
        </div>
      ))}
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
  );
}
