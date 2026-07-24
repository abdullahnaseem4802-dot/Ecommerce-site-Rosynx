"use client";

/**
 * Shared client-side read cache for store-wide data (settings, FX rates, the
 * catalog) that is identical for every visitor and changes rarely.
 *
 * Why: these were fetched fresh on every page load — and settings twice, from
 * two modules that each kept their own in-memory cache. In-module caches also
 * die on every hard navigation, so a visitor browsing five pages paid for the
 * same five requests five times over, against a free-tier backend.
 *
 * Three layers, cheapest first:
 *   1. in-memory   — instant within a page
 *   2. in-flight   — concurrent callers share one request instead of racing
 *   3. sessionStorage — survives navigation and reload, expires via TTL
 */

type Entry = { v: unknown; t: number };

const mem = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

const PREFIX = "rosynx-cache:";

function readStore(key: string, ttlMs: number): unknown | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    if (!raw) return undefined;
    const e = JSON.parse(raw) as Entry;
    if (!e || typeof e.t !== "number" || Date.now() - e.t > ttlMs) return undefined;
    return e.v;
  } catch {
    return undefined; // corrupt or unavailable — just refetch
  }
}

function writeStore(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify({ v: value, t: Date.now() }));
  } catch {
    /* quota / private mode — the memory cache still applies */
  }
}

/**
 * Returns cached data if fresh, otherwise fetches once and caches it.
 * A rejected fetch is never cached, and concurrent callers share one request.
 */
export async function cachedJSON<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const hit = mem.get(key);
  if (hit && Date.now() - hit.t <= ttlMs) return hit.v as T;

  const stored = readStore(key, ttlMs);
  if (stored !== undefined) {
    mem.set(key, { v: stored, t: Date.now() });
    return stored as T;
  }

  const running = inflight.get(key);
  if (running) return running as Promise<T>;

  const p = fetcher()
    .then((v) => {
      mem.set(key, { v, t: Date.now() });
      writeStore(key, v);
      inflight.delete(key);
      return v;
    })
    .catch((e) => {
      inflight.delete(key); // never cache a failure
      throw e;
    });

  inflight.set(key, p);
  return p;
}

/** Synchronous peek — used where a hook needs an initial value without waiting. */
export function peekCached<T>(key: string, ttlMs: number): T | null {
  const hit = mem.get(key);
  if (hit && Date.now() - hit.t <= ttlMs) return hit.v as T;
  const stored = readStore(key, ttlMs);
  if (stored !== undefined) {
    mem.set(key, { v: stored, t: Date.now() });
    return stored as T;
  }
  return null;
}

/** TTLs. Store-wide config changes rarely; the catalog is revalidated server-side too. */
export const TTL = {
  settings: 5 * 60_000,
  rates: 30 * 60_000,
  catalog: 10 * 60_000,
  // Short TTL so the header reflects admin category add/delete within ~1 min
  // (the shop sidebar is server-rendered and already fresh). Still cached
  // within a page session, so we don't refetch on every render/navigation.
  categories: 60_000,
};
