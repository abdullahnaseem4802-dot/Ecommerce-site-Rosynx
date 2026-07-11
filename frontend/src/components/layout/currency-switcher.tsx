"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useMoney } from "@/lib/currency";
import { useHydrated } from "@/lib/store";
import { cn } from "@/lib/utils";

/** Compact currency selector for the header utility area. */
export function CurrencySwitcher() {
  const { currency, setCurrency, currencies } = useMoney();
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const current = currencies.find((c) => c.code === currency);
  // Render a stable label during SSR / pre-hydration to avoid mismatches.
  const label = hydrated && current ? current.code : "USD";
  const symbol = hydrated && current ? current.symbol : "$";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Change currency"
        className="group flex items-center gap-1 rounded-full border border-line px-2.5 py-2 text-coffee transition hover:border-brand hover:text-brand sm:gap-1.5 sm:px-3"
      >
        <span className="text-sm font-semibold leading-none">{symbol}</span>
        <span className="hidden text-[11px] font-medium sm:inline">{label}</span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-[calc(100%+14px)] z-50 w-48 overflow-hidden rounded-2xl border border-line bg-white py-2 shadow-xl shadow-espresso/10"
          >
            {currencies.map((c) => (
              <li key={c.code}>
                <button
                  type="button"
                  disabled={!c.available}
                  onClick={() => {
                    setCurrency(c.code);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-coffee transition hover:bg-cream hover:text-brand disabled:cursor-not-allowed disabled:opacity-40",
                    currency === c.code && "font-semibold text-brand",
                  )}
                >
                  <span className="w-5 text-center text-base leading-none">
                    {c.symbol}
                  </span>
                  <span className="flex-1">
                    {c.code}
                    <span className="ml-1 text-xs text-muted">{c.label}</span>
                  </span>
                  {currency === c.code && <Check className="h-4 w-4 text-brand" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
