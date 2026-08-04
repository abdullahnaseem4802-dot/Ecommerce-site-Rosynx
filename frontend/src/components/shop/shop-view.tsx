"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutGrid,
  List,
  ShoppingBag,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import { sortOptions } from "@/lib/data";
import type { Product } from "@/lib/data";
import type { ApiCategory } from "@/lib/catalog";
import { useShop } from "@/lib/store";
import { useAddToCart } from "@/lib/use-add-to-cart";
import { useMoney } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/product/product-card";
import { ProductCardSkeleton } from "@/components/ui/skeleton";
import { Filters, defaultFilters, type ShopFilters } from "./filters";

const PAGE_SIZES = [12, 24, 48];

// Reactively track the URL query string WITHOUT useSearchParams() (which would
// force a client-side bailout and break /shop's static/edge caching — see the
// project convention). Because a header/category link to `/shop?category=x`
// while already on /shop is a client nav that does NOT remount this component,
// we also listen for pushState/replaceState (patched to emit an event) so the
// deep-link re-applies every time, not just on first mount.
function useLocationSearch(): string {
  const [search, setSearch] = useState(() =>
    typeof window === "undefined" ? "" : window.location.search,
  );
  useEffect(() => {
    const update = () => setSearch(window.location.search);
    update();

    const origPush = window.history.pushState;
    const origReplace = window.history.replaceState;
    const emit = () => window.dispatchEvent(new Event("rosynx:locationchange"));
    window.history.pushState = function (...args) {
      const r = origPush.apply(this, args);
      emit();
      return r;
    };
    window.history.replaceState = function (...args) {
      const r = origReplace.apply(this, args);
      emit();
      return r;
    };

    window.addEventListener("popstate", update);
    window.addEventListener("rosynx:locationchange", update);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener("rosynx:locationchange", update);
      window.history.pushState = origPush;
      window.history.replaceState = origReplace;
    };
  }, []);
  return search;
}

export function ShopView({
  products,
  categories,
}: {
  products: Product[];
  categories: ApiCategory[];
}) {
  const ALL = products;
  // Real per-category counts computed from the SAME catalog the filter matches
  // against — so the number next to each category equals exactly how many
  // products appear when you tick it (the backend `productCount` could include
  // drafts/out-of-catalog items and drift from what the storefront shows).
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of ALL) {
      const slugs = p.categorySlugs?.length ? p.categorySlugs : [p.category];
      for (const s of new Set(slugs)) counts[s] = (counts[s] ?? 0) + 1;
    }
    return counts;
  }, [ALL]);

  const bounds = useMemo(() => {
    if (!products.length) return { min: 0, max: 1000 };
    const prices = products.map((p) => p.price);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [products]);

  const [filters, setFilters] = useState<ShopFilters>({
    ...defaultFilters,
    price: [bounds.min, bounds.max],
  });

  // Apply a ?category= deep-link on the client (never via server searchParams,
  // which would break /shop's static/edge caching). Re-runs on every URL change
  // so selecting a header category filters even when already on /shop.
  const search = useLocationSearch();
  useEffect(() => {
    const cat = new URLSearchParams(search).get("category");
    setFilters((f) =>
      cat
        ? f.categories.length === 1 && f.categories[0] === cat
          ? f
          : { ...f, categories: [cat] }
        : f,
    );
  }, [search]);
  const [sort, setSort] = useState("featured");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [pageSize, setPageSize] = useState(12);
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState(false);
  const [drawer, setDrawer] = useState(false);

  // Simulate a short loading transition for skeletons on any change.
  useEffect(() => {
    setPending(true);
    setPage(1);
    const t = setTimeout(() => setPending(false), 350);
    return () => clearTimeout(t);
  }, [filters, sort]);

  const filtered = useMemo(() => {
    let list = ALL.filter((p) => {
      if (filters.categories.length) {
        const slugs = p.categorySlugs?.length ? p.categorySlugs : [p.category];
        if (!filters.categories.some((c) => slugs.includes(c))) return false;
      }
      if (filters.materials.length && !filters.materials.includes(p.material))
        return false;
      if (p.price < filters.price[0] || p.price > filters.price[1]) return false;
      if (filters.inStockOnly && !p.inStock) return false;
      if (filters.minRating && p.rating < filters.minRating) return false;
      return true;
    });

    switch (sort) {
      case "price-asc":
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case "rating":
        list = [...list].sort((a, b) => b.rating - a.rating);
        break;
      case "bestselling":
        list = [...list].sort((a, b) => b.sales - a.sales);
        break;
      case "newest":
        list = [...list].sort((a, b) => b.id - a.id);
        break;
      case "oldest":
        list = [...list].sort((a, b) => a.id - b.id);
        break;
      case "az":
        list = [...list].sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return list;
  }, [filters, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, filtered.length);

  const activeChips = [
    ...filters.categories.map((c) => ({ type: "categories" as const, value: c })),
    ...filters.materials.map((m) => ({ type: "materials" as const, value: m })),
  ];

  const removeChip = (type: "categories" | "materials", value: string) =>
    setFilters({ ...filters, [type]: filters[type].filter((v) => v !== value) });

  const reset = () =>
    setFilters({ ...defaultFilters, price: [bounds.min, bounds.max] });

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:block">
        <div className="sticky top-40 rounded-2xl border border-line/60 bg-white p-5">
          <Filters
            filters={filters}
            setFilters={setFilters}
            onReset={reset}
            categories={categories}
            categoryCounts={categoryCounts}
            bounds={bounds}
          />
        </div>
      </aside>

      {/* Main */}
      <div>
        {/* Toolbar */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line/60 bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawer(true)}
              className="flex items-center gap-2 rounded-full border border-line px-3 py-2 text-sm font-medium text-coffee lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </button>
            <p className="text-sm text-muted">
              Showing{" "}
              <span className="font-semibold text-coffee">
                {rangeStart}–{rangeEnd}
              </span>{" "}
              of <span className="font-semibold text-coffee">{filtered.length}</span>{" "}
              products
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="hidden items-center gap-2 text-sm text-muted sm:flex">
              Show
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-lg border border-line bg-white px-2 py-1.5 text-sm text-coffee focus:outline-none"
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-coffee focus:outline-none"
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <div className="flex items-center rounded-lg border border-line">
              <button
                onClick={() => setView("grid")}
                aria-label="Grid view"
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-l-lg",
                  view === "grid" ? "bg-brand text-white" : "text-coffee",
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("list")}
                aria-label="List view"
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-r-lg",
                  view === "list" ? "bg-brand text-white" : "text-coffee",
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active chips */}
        {activeChips.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {activeChips.map((chip) => (
              <button
                key={chip.type + chip.value}
                onClick={() => removeChip(chip.type, chip.value)}
                className="flex items-center gap-1.5 rounded-full bg-cream-card px-3 py-1 text-xs font-medium text-coffee transition hover:bg-blush"
              >
                {chip.value.replace(/-/g, " ")}
                <X className="h-3 w-3" />
              </button>
            ))}
            <button
              onClick={reset}
              className="text-xs font-medium text-brand hover:underline"
            >
              Clear
            </button>
          </div>
        )}

        {/* Grid */}
        {pending ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: pageSize > 12 ? 12 : pageSize }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onReset={reset} />
        ) : view === "grid" ? (
          <motion.div
            key={`${page}-${sort}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-4"
          >
            {pageItems.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </motion.div>
        ) : (
          <div className="flex flex-col gap-4">
            {pageItems.map((p) => (
              <ProductRow key={p.id} product={p} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!pending && totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setPage(i + 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={cn(
                  "h-9 min-w-9 rounded-lg px-3 text-sm font-medium transition",
                  page === i + 1
                    ? "bg-brand text-white"
                    : "border border-line text-coffee hover:border-brand",
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawer && (
          <motion.div
            className="fixed inset-0 z-[90] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-espresso/50" onClick={() => setDrawer(false)} />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.3 }}
              className="absolute left-0 top-0 h-full w-[85%] max-w-sm overflow-y-auto bg-cream-soft p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-lg font-bold">Filters</h2>
                <button onClick={() => setDrawer(false)} aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <Filters
                filters={filters}
                setFilters={setFilters}
                onReset={reset}
                categories={categories}
                categoryCounts={categoryCounts}
                bounds={bounds}
              />
              <button
                onClick={() => setDrawer(false)}
                className="mt-6 w-full rounded-full bg-brand py-3 text-sm font-semibold text-white"
              >
                Show {filtered.length} results
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cream-card">
        <ShoppingBag className="h-7 w-7 text-brand" />
      </div>
      <h3 className="mt-4 font-serif text-xl font-bold text-espresso">
        No products found
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted">
        Try adjusting or clearing your filters to see more handcrafted pieces.
      </p>
      <button
        onClick={onReset}
        className="mt-5 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
      >
        Reset filters
      </button>
    </div>
  );
}

function ProductRow({ product }: { product: Product }) {
  const addToCart = useAddToCart();
  const { format } = useMoney();
  return (
    <div className="flex gap-4 overflow-hidden rounded-2xl border border-line/60 bg-white p-3 transition hover:shadow-lg hover:shadow-espresso/5 sm:gap-6 sm:p-4">
      <Link
        href={`/product/${product.id}`}
        className="relative h-32 w-32 shrink-0 overflow-hidden rounded-xl bg-cream-card sm:h-40 sm:w-40"
      >
        <Image src={product.images[0]} alt={product.name} fill sizes="160px" className="object-cover" />
      </Link>
      <div className="flex flex-1 flex-col">
        <p className="text-[11px] font-medium uppercase tracking-wide text-brand">
          {product.categoryName}
        </p>
        <Link
          href={`/product/${product.id}`}
          className="mt-1 font-serif text-lg font-semibold text-espresso transition hover:text-brand"
        >
          {product.name}
        </Link>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="font-medium text-coffee">{product.rating}</span>
          <span>({product.reviews} reviews)</span>
        </div>
        <p className="mt-2 line-clamp-2 max-w-xl text-sm text-coffee/70">
          {product.short}
        </p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-espresso">
              {format(product.price)}
            </span>
            {product.oldPrice && (
              <span className="text-sm text-muted line-through">
                {format(product.oldPrice)}
              </span>
            )}
          </div>
          <button
            onClick={() => addToCart(product)}
            disabled={!product.inStock}
            className="flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
          >
            <ShoppingBag className="h-4 w-4" />
            {product.inStock ? "Add to Cart" : "Sold Out"}
          </button>
        </div>
      </div>
    </div>
  );
}
