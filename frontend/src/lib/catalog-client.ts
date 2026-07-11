"use client";

/* Client-side catalog cache. Fetches the full product list once per session
 * and memoizes it in-module so header search, wishlist and cart lookups work
 * against live data without each component re-fetching. */

import { useEffect, useState } from "react";
import { fetchAllProducts, fetchCategories, type ApiCategory } from "./catalog";
import type { Product } from "./data";

let cache: Product[] | null = null;
let inflight: Promise<Product[]> | null = null;

/** Synchronous snapshot of the client catalog cache (empty until primed). */
export const cachedProducts = (): Product[] => cache ?? [];

export function primeCatalog(): Promise<Product[]> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetchAllProducts()
      .then((p) => {
        cache = p;
        return p;
      })
      .catch(() => {
        inflight = null;
        return [];
      });
  }
  return inflight;
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
let catCache: ApiCategory[] | null = null;
let catInflight: Promise<ApiCategory[]> | null = null;

export function useCategories(): ApiCategory[] {
  const [cats, setCats] = useState<ApiCategory[]>(catCache ?? []);
  useEffect(() => {
    if (catCache) {
      setCats(catCache);
      return;
    }
    let alive = true;
    if (!catInflight)
      catInflight = fetchCategories()
        .then((c) => {
          catCache = c;
          return c;
        })
        .catch(() => {
          catInflight = null;
          return [];
        });
    catInflight.then((c) => alive && setCats(c));
    return () => {
      alive = false;
    };
  }, []);
  return cats;
}
