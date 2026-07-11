"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { testimonials } from "@/lib/data";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const t = testimonials[index];

  const go = (d: number) => {
    setDir(d);
    setIndex((i) => (i + d + testimonials.length) % testimonials.length);
  };

  return (
    <Container className="pt-16">
      <div className="relative overflow-hidden rounded-3xl bg-cream-card px-6 py-12 sm:px-12">
        <Quote className="absolute -left-2 -top-2 h-24 w-24 text-brand/10" />
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            Loved by 12,000+ Customers
          </p>

          <div className="relative mt-6 min-h-[180px]">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={t.name}
                custom={dir}
                initial={{ opacity: 0, x: dir * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir * -40 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="mb-4 flex justify-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-5 w-5",
                        i < t.rating ? "fill-amber-400 text-amber-400" : "text-line",
                      )}
                    />
                  ))}
                </span>
                <p className="font-serif text-xl leading-relaxed text-espresso sm:text-2xl">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="mt-6 flex items-center justify-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand font-serif text-base font-bold text-white">
                    {t.name.charAt(0)}
                  </span>
                  <div className="text-left">
                    <p className="flex items-center gap-2 text-sm font-semibold text-coffee">
                      {t.name}
                      <span className="inline-flex items-center gap-1 rounded-full bg-newtag/15 px-2 py-0.5 text-[10px] font-medium text-newtag">
                        <BadgeCheck className="h-3 w-3" /> Verified
                      </span>
                    </p>
                    <p className="text-xs text-muted">
                      {t.country} · {t.product}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={() => go(-1)}
              aria-label="Previous"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-coffee transition hover:border-brand hover:text-brand"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1.5">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setDir(i > index ? 1 : -1);
                    setIndex(i);
                  }}
                  aria-label={`Testimonial ${i + 1}`}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    i === index ? "w-6 bg-brand" : "w-2 bg-coffee/20",
                  )}
                />
              ))}
            </div>
            <button
              onClick={() => go(1)}
              aria-label="Next"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-coffee transition hover:border-brand hover:text-brand"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </Container>
  );
}
