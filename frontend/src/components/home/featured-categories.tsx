"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

  const step = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const amount = card ? card.offsetWidth + 20 /* gap-5 */ : el.clientWidth;
    // Loop: jump back to the start once we run past the end (or before start).
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    if (dir === 1 && atEnd) {
      el.scrollTo({ left: 0, behavior: "smooth" });
    } else if (dir === -1 && el.scrollLeft <= 4) {
      el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    } else {
      el.scrollBy({ left: amount * dir, behavior: "smooth" });
    }
  };

  // Auto-advance, pausing while the pointer is over the carousel.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let paused = false;
    const onEnter = () => (paused = true);
    const onLeave = () => (paused = false);
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    const id = setInterval(() => {
      if (!paused) step(1);
    }, 3500);
    return () => {
      clearInterval(id);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.length]);

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {categories.map((cat) => (
          <div
            key={cat.slug}
            className="w-[80%] shrink-0 snap-start sm:w-[calc((100%-20px)/2)] lg:w-[calc((100%-60px)/4)]"
          >
            <CategoryCard cat={cat} />
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label="Previous categories"
        onClick={() => step(-1)}
        className="absolute -left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-coffee shadow-md transition hover:bg-brand hover:text-white lg:-left-5"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Next categories"
        onClick={() => step(1)}
        className="absolute -right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-coffee shadow-md transition hover:bg-brand hover:text-white lg:-right-5"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
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
