"use client";

import { formatPrice } from "@/lib/utils";

export function PriceRange({
  min,
  max,
  value,
  onChange,
}: {
  min: number;
  max: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
}) {
  const [lo, hi] = value;
  const pct = (v: number) => ((v - min) / (max - min)) * 100;

  return (
    <div className="space-y-4">
      <div className="relative h-1.5">
        <div className="absolute inset-0 rounded-full bg-line" />
        <div
          className="absolute h-1.5 rounded-full bg-brand"
          style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={lo}
          onChange={(e) =>
            onChange([Math.min(Number(e.target.value), hi - 1), hi])
          }
          className="pointer-events-none absolute -top-1.5 h-4 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brand [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={hi}
          onChange={(e) =>
            onChange([lo, Math.max(Number(e.target.value), lo + 1)])
          }
          className="pointer-events-none absolute -top-1.5 h-4 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brand [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow"
        />
      </div>
      <div className="flex items-center justify-between text-sm text-coffee">
        <span className="rounded-md bg-cream-card px-2 py-1 font-medium">
          {formatPrice(lo)}
        </span>
        <span className="rounded-md bg-cream-card px-2 py-1 font-medium">
          {formatPrice(hi)}
        </span>
      </div>
    </div>
  );
}
