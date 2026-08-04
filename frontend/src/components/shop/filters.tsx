"use client";

import { Star } from "lucide-react";
import { materials, priceBounds } from "@/lib/data";
import type { ApiCategory } from "@/lib/catalog";
import { PriceRange } from "./price-range";
import { cn } from "@/lib/utils";

export type ShopFilters = {
  categories: string[];
  materials: string[];
  price: [number, number];
  inStockOnly: boolean;
  minRating: number;
};

export const defaultFilters: ShopFilters = {
  categories: [],
  materials: [],
  price: [priceBounds.min, priceBounds.max],
  inStockOnly: false,
  minRating: 0,
};

function toggle(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-line/70 py-5 first:pt-0">
      <h3 className="mb-3 text-sm font-semibold text-espresso">{title}</h3>
      {children}
    </div>
  );
}

function Check({
  checked,
  onChange,
  label,
  count,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  count?: number;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between py-1 text-sm text-coffee transition hover:text-brand">
      <span className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded border transition",
            checked ? "border-brand bg-brand" : "border-line bg-white",
          )}
        >
          {checked && (
            <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" fill="none">
              <path d="M2.5 6.5 5 9l4.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
        {label}
      </span>
      {count !== undefined && (
        <span className="text-xs text-muted">{count}</span>
      )}
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
    </label>
  );
}

export function Filters({
  filters,
  setFilters,
  onReset,
  categories,
  categoryCounts,
  bounds,
}: {
  filters: ShopFilters;
  setFilters: (f: ShopFilters) => void;
  onReset: () => void;
  categories: ApiCategory[];
  categoryCounts?: Record<string, number>;
  bounds: { min: number; max: number };
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-serif text-lg font-bold text-espresso">Filters</h2>
        <button
          onClick={onReset}
          className="text-xs font-medium text-brand transition hover:underline"
        >
          Reset all
        </button>
      </div>

      <Section title="Category">
        <div className="max-h-56 space-y-0.5 overflow-y-auto pr-1">
          {categories.map((c) => (
            <Check
              key={c.slug}
              label={c.name.replace(" Collection", "")}
              count={categoryCounts?.[c.slug] ?? c.productCount ?? c.products}
              checked={filters.categories.includes(c.slug)}
              onChange={() =>
                setFilters({
                  ...filters,
                  categories: toggle(filters.categories, c.slug),
                })
              }
            />
          ))}
        </div>
      </Section>

      <Section title="Price">
        <PriceRange
          min={bounds.min}
          max={bounds.max}
          value={filters.price}
          onChange={(price) => setFilters({ ...filters, price })}
        />
      </Section>

      <Section title="Material">
        <div className="space-y-0.5">
          {materials.map((m) => (
            <Check
              key={m.slug}
              label={m.name}
              checked={filters.materials.includes(m.slug)}
              onChange={() =>
                setFilters({
                  ...filters,
                  materials: toggle(filters.materials, m.slug),
                })
              }
            />
          ))}
        </div>
      </Section>

      <Section title="Rating">
        <div className="space-y-0.5">
          {[4, 3, 2].map((r) => (
            <button
              key={r}
              onClick={() =>
                setFilters({
                  ...filters,
                  minRating: filters.minRating === r ? 0 : r,
                })
              }
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition",
                filters.minRating === r
                  ? "bg-cream-card text-brand"
                  : "text-coffee hover:bg-cream",
              )}
            >
              <span className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-3.5 w-3.5",
                      i < r ? "fill-amber-400 text-amber-400" : "text-line",
                    )}
                  />
                ))}
              </span>
              & up
            </button>
          ))}
        </div>
      </Section>

      <Section title="Availability">
        <Check
          label="In stock only"
          checked={filters.inStockOnly}
          onChange={() =>
            setFilters({ ...filters, inStockOnly: !filters.inStockOnly })
          }
        />
      </Section>
    </div>
  );
}
