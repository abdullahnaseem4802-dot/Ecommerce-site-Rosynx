"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { heroSlides } from "@/lib/data";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";

const AUTOPLAY_MS = 3000;

export function Hero() {
  const [index, setIndex] = useState(0);
  const slide = heroSlides[index];
  const touchX = useRef<number | null>(null);

  const go = useCallback(
    (dir: number) =>
      setIndex((i) => (i + dir + heroSlides.length) % heroSlides.length),
    [],
  );

  // Autoplay never stops — continuous, non-stop sliding.
  useEffect(() => {
    const id = setInterval(() => go(1), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [go, index]);

  return (
    <Container className="pt-6">
      <div
        className="relative h-[300px] overflow-hidden rounded-3xl bg-espresso sm:h-[420px] lg:h-[480px]"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
      >
        {/* Background image with slow zoom (parallax feel) */}
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 0.5 }, scale: { duration: 5, ease: "linear" } }}
            className="absolute inset-0"
          >
            <Image
              src={slide.image}
              alt={slide.title.join(" ")}
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
            {/* Lighter scrim — keeps the product image visible while the
                left-side text stays legible on any image / screen. */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/10 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* Text */}
        <div className="relative flex h-full max-w-xl flex-col justify-center gap-4 px-7 sm:px-12 lg:px-16">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-4"
            >
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-light" />
                {slide.eyebrow}
              </span>
              <h1 className="font-serif text-[2rem] font-bold leading-[1.08] text-white drop-shadow-md sm:text-4xl lg:text-5xl">
                {slide.title.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </h1>
              <p className="max-w-md text-sm text-white/90 drop-shadow sm:text-base">
                {slide.description}
              </p>
              <div>
                <ButtonLink href="/shop" size="lg" className="w-fit pr-2">
                  Shop Now
                  <span className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </ButtonLink>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Container>
  );
}
