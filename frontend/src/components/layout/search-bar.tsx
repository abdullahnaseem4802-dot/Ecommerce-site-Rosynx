"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, Search, TrendingUp, X } from "lucide-react";
import { useAllProducts } from "@/lib/catalog-client";
import { useMoney } from "@/lib/currency";
import { cn } from "@/lib/utils";

const POPULAR = ["Rosewood box", "Onyx bowl", "Leather bag", "Brass vase", "Ceramic"];
const RECENT_KEY = "rosynx-recent-search";

export function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const { products } = useAllProducts();
  const { format } = useMoney();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"));
    } catch {}
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q) ||
          p.material.toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [query, products]);

  const saveRecent = (term: string) => {
    const next = [term, ...recent.filter((r) => r !== term)].slice(0, 5);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {}
  };

  const submit = (term: string) => {
    const t = term.trim();
    if (!t) return;
    saveRecent(t);
    setOpen(false);
    setQuery(t);
    const hit = products.find((p) =>
      p.name.toLowerCase().includes(t.toLowerCase()),
    );
    router.push(hit ? `/product/${hit.id}` : `/shop`);
  };

  return (
    <div ref={ref} className={cn("relative flex-1", className)}>
      <div className="flex items-stretch">
        <div className="flex flex-1 items-center border-y border-l border-line bg-white px-4">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => e.key === "Enter" && submit(query)}
            placeholder="Search for handmade products..."
            className="w-full bg-transparent py-3 text-sm text-ink placeholder:text-muted focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear">
              <X className="h-4 w-4 text-muted hover:text-coffee" />
            </button>
          )}
        </div>
        <button
          type="button"
          aria-label="Search"
          onClick={() => submit(query)}
          className="flex w-14 items-center justify-center rounded-r-full border border-brand bg-brand text-white transition hover:bg-brand-dark"
        >
          <Search className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-line bg-white shadow-xl shadow-espresso/10">
          {matches.length > 0 ? (
            <ul className="max-h-[360px] overflow-y-auto py-2">
              {matches.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/product/${p.id}`}
                    onClick={() => {
                      saveRecent(query);
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-2 transition hover:bg-cream"
                  >
                    <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-cream-card">
                      <Image src={p.images[0]} alt="" fill sizes="44px" className="object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-coffee">
                        {p.name}
                      </span>
                      <span className="text-xs text-muted">{p.categoryName}</span>
                    </span>
                    <span className="text-sm font-semibold text-espresso">
                      {format(p.price)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : query ? (
            <div className="px-4 py-6 text-center text-sm text-muted">
              No matches for &ldquo;{query}&rdquo;. Try another term.
            </div>
          ) : (
            <div className="p-4">
              {recent.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                    <Clock className="h-3.5 w-3.5" /> Recent
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recent.map((r) => (
                      <button
                        key={r}
                        onClick={() => submit(r)}
                        className="rounded-full bg-cream-card px-3 py-1 text-xs text-coffee transition hover:bg-blush"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                <TrendingUp className="h-3.5 w-3.5" /> Popular searches
              </p>
              <div className="flex flex-wrap gap-2">
                {POPULAR.map((p) => (
                  <button
                    key={p}
                    onClick={() => submit(p)}
                    className="rounded-full bg-cream-card px-3 py-1 text-xs text-coffee transition hover:bg-blush"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
