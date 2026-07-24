"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FaqEntry {
  q: string;
  a: string;
}

export function FaqAccordion({ items }: { items: FaqEntry[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {items.map((f, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-line/60 bg-white"
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
          >
            <span className="font-medium text-espresso">{f.q}</span>
            <ChevronDown
              className={cn(
                "h-5 w-5 shrink-0 text-brand transition-transform",
                open === i && "rotate-180",
              )}
            />
          </button>
          <div
            className={cn(
              "grid transition-all duration-300",
              open === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
            )}
          >
            <div className="overflow-hidden">
              <p className="whitespace-pre-line px-5 pb-4 text-sm leading-relaxed text-coffee/75">
                {f.a}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
