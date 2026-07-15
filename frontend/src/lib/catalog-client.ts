"use client";

/* Client-side catalog cache. Fetches the full product list once per session
 * and memoizes it in-module so header search, wishlist and cart lookups work
 * against live data without each component re-fetching. */

import { useEffect, useState } from "react";
import { fetchAllProducts, fetchCategories, type ApiCategory } from "./catalog";
import { cachedJSON, peekCached, TTL } from "./client-cache";
import type { Product } from "./data";

// Kept as a synchronous mirror of the shared cache: cachedProducts() is called
// from non-async code (the cart store) and must not await.
let cache: Product[] | null = null;

/** Synchronous snapshot of the client catalog cache (empty until primed). */
export const cachedProducts = (): Product[] =>
  cache ?? peekCached<Product[]>("catalog", TTL.catalog) ?? [];

/**
 * Loads the full catalog once and reuses it across navigations. This is the
 * single biggest client payload (~148 products), and it used to be re-fetched
 * on every page load because the cache lived only in module memory.
 */
export function primeCatalog(): Promise<Product[]> {
  if (cache) return Promise.resolve(cache);
  return cachedJSON<Product[]>("catalog", TTL.catalog, () => fetchAllProducts())
    .then((p) => {
      cache = p;
      return p;
    })
    .catch(() => []);
}

/** Returns the full live product list on the client (empty until loaded). */
export function useAllProducts(): { products: Product[]; loading: boolean } {
  const [products, setProducts] = useState<Product[]>(cache ?? []);
  const [loading, setLoading] = useState<boolean>(!cache);

  useEffect(() => {
    if (cache) {
      setProducts(cache);
      setLoading(false);
      return;
    }
    let alive = true;
    primeCatalog().then((p) => {
      if (!alive) return;
      setProducts(p);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  return { products, loading };
}

export const findByNumber = (products: Product[], id: number) =>
  products.find((p) => p.id === id);
export const findBySlug = (products: Product[], slug: string) =>
  products.find((p) => p.slug === slug);

/* --- categories client cache --- */

export function useCategories(): ApiCategory[] {
  const [cats, setCats] = useState<ApiCategory[]>(
    () => peekCached<ApiCategory[]>("categories", TTL.categories) ?? [],
  );
  useEffect(() => {
    let alive = true;
    cachedJSON<ApiCategory[]>("categories", TTL.categories, () =>
      fetchCategories(),
    )
      .then((c) => alive && setCats(c))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return cats;
}
