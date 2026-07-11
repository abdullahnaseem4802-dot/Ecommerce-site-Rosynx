/* ------------------------------------------------------------------ *
 *  Live catalog — fetches products & categories from the backend API.
 *  Isomorphic: safe to import from Server Components and Client Components.
 *  No next-only or browser-only APIs here.
 * ------------------------------------------------------------------ */

import type { Product, ProductBadge } from "./data";

const API =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

/** Shape returned by the backend product serializer. */
export interface ApiProduct {
  id: string;
  number: number;
  slug: string;
  name: string;
  sku: string | null;
  short: string;
  description: string;
  stockQty: number;
  stockStatus: "in" | "low" | "out";
  isActive: boolean;
  price: number;
  oldPrice: number | null;
  onSale: boolean;
  material: string | null;
  colors: string[];
  badges: string[];
  inStock: boolean;
  rating: number;
  reviews: number;
  sales: number;
  categories: { slug: string; name: string }[];
  category: string | null;
  categoryName: string | null;
  images: string[];
  image: string | null;
  dimensions: string | null;
  weight: string | null;
  finish: string | null;
  origin: string | null;
  care: string | null;
}

export interface ApiCategory {
  slug: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  isFeatured?: boolean;
  sortOrder?: number;
  productCount?: number;
  products?: number;
}

const PLACEHOLDER = "/images/placeholder.png";

/** Map a backend product to the storefront `Product` shape. */
export function mapProduct(p: ApiProduct): Product {
  return {
    id: p.number, // stable numeric id used for routing & local cart/wishlist
    apiId: p.id, // cuid — used for cart/checkout/wishlist API calls
    slug: p.slug,
    name: p.name,
    category: p.category ?? "uncategorized",
    categoryName: p.categoryName ?? "Uncategorized",
    material: (p.material ?? "").toLowerCase(),
    price: p.price,
    oldPrice: p.oldPrice ?? undefined,
    rating: p.rating ?? 0,
    reviews: p.reviews ?? 0,
    sales: p.sales ?? 0,
    badges: (p.badges ?? []) as ProductBadge[],
    colors: p.colors ?? [],
    inStock: p.inStock,
    sku: p.sku ?? "",
    images: p.images?.length ? p.images : [PLACEHOLDER],
    short: p.short ?? "",
    description: p.description ?? "",
    stockQty: p.stockQty,
    dimensions: p.dimensions ?? undefined,
    weight: p.weight ?? undefined,
    finish: p.finish ?? undefined,
    origin: p.origin ?? undefined,
    care: p.care ?? undefined,
  };
}

/**
 * Fetch + parse JSON. Reads are cached and revalidated on an interval so the
 * storefront stays fast while still picking up admin edits quickly.
 * `revalidateSeconds` controls how stale a cached response may get (default 30s).
 */
async function getJSON<T>(path: string, revalidateSeconds = 30): Promise<T> {
  // Retry a couple of times: the backend/Neon can be briefly waking from a
  // cold start, which would otherwise surface as a hard page error.
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${API}${path}`, {
        next: { revalidate: revalidateSeconds },
      });
      if (!res.ok) throw new Error(`GET ${path} failed (${res.status})`);
      return (await res.json()) as T;
    } catch (err) {
      lastErr = err;
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 600 * attempt));
      }
    }
  }
  throw lastErr;
}

interface ProductPage {
  items: ApiProduct[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/** Fetch the FULL active catalog. The API cap is 200, so all ~147 products
 * come back in ONE request; the loop stays as a fallback if pages > 1. */
export async function fetchAllProducts(): Promise<Product[]> {
  try {
    const first = await getJSON<ProductPage>(
      "/products?limit=200&page=1&sort=newest",
      30,
    );
    let items = first.items ?? [];
    const pages = first.pages ?? 1;
    for (let page = 2; page <= pages; page++) {
      const next = await getJSON<ProductPage>(
        `/products?limit=200&page=${page}&sort=newest`,
        30,
      );
      items = items.concat(next.items ?? []);
    }
    return items.map(mapProduct);
  } catch {
    // Never crash the page on a transient API failure — render an empty
    // catalog rather than a hard error screen.
    return [];
  }
}

/** Fetch a single product by its slug (full detail incl. specs). */
export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  try {
    const p = await getJSON<ApiProduct>(`/products/${slug}`, 30);
    return mapProduct(p);
  } catch {
    return null;
  }
}

/** Related products for a slug (same category, from the API). */
export async function fetchRelated(slug: string): Promise<Product[]> {
  try {
    const rows = await getJSON<ApiProduct[]>(`/products/${slug}/related`, 30);
    return rows.map(mapProduct);
  } catch {
    return [];
  }
}

/** Categories with product counts. */
export async function fetchCategories(): Promise<ApiCategory[]> {
  try {
    return await getJSON<ApiCategory[]>("/categories", 30);
  } catch {
    return [];
  }
}

export interface ApiBlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  imageUrl: string | null;
  readTime: string;
  publishedAt: string;
}

/** Published blog posts (newest first). */
export async function fetchBlogPosts(): Promise<ApiBlogPost[]> {
  try {
    return await getJSON<ApiBlogPost[]>("/blog", 300);
  } catch {
    return [];
  }
}

/** A single published blog post by slug. */
export async function fetchBlogPost(slug: string): Promise<ApiBlogPost | null> {
  try {
    return await getJSON<ApiBlogPost>(`/blog/${slug}`, 300);
  } catch {
    return null;
  }
}
