"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";

const THUMB =
  "pointer-events-none absolute -top-1.5 h-4 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brand [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-brand [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow";

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

  // Two stacked range inputs overlap near the extremes. Whichever thumb the
  // user is interacting with — or, at rest, whichever thumb sits in the upper
  // half of the track (where the two collide at the right edge) — is raised to
  // the front so it always stays grabbable. This is the classic dual-range fix.
  const [active, setActive] = useState<null | "lo" | "hi">(null);
  const loOnTop =
    active === "lo" || (active !== "hi" && lo > (min + max) / 2);

  const clearActive = () => setActive(null);

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
          onMouseDown={() => setActive("lo")}
          onTouchStart={() => setActive("lo")}
          onFocus={() => setActive("lo")}
          onMouseUp={clearActive}
          onTouchEnd={clearActive}
          onBlur={clearActive}
          className={THUMB}
          style={{ zIndex: loOnTop ? 5 : 3 }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={hi}
          onChange={(e) =>
            onChange([lo, Math.max(Number(e.target.value), lo + 1)])
          }
          onMouseDown={() => setActive("hi")}
          onTouchStart={() => setActive("hi")}
          onFocus={() => setActive("hi")}
          onMouseUp={clearActive}
          onTouchEnd={clearActive}
          onBlur={clearActive}
          className={THUMB}
          style={{ zIndex: loOnTop ? 3 : 4 }}
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
