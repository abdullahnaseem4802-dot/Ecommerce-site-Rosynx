import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { ButtonLink } from "@/components/ui/button";

export function PromoBanner() {
  return (
    <Container className="pt-16">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-blush-deep">
          <Image
            src="/images/hero/hero-3.jpg"
            alt="Seasonal collection"
            fill
            sizes="100vw"
            className="object-cover object-right opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-espresso/85 via-espresso/55 to-transparent" />
          <div className="relative flex flex-col gap-4 px-8 py-14 sm:px-14 sm:py-20 lg:max-w-xl">
            <span className="w-fit rounded-full bg-brand/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
              Limited Edition
            </span>
            <h2 className="font-serif text-3xl font-bold leading-tight text-cream sm:text-4xl">
              Summer Artisan Collection
            </h2>
            <p className="max-w-md text-sm text-cream/80">
              Hand-selected pieces from master makers — up to 25% off for a
              limited time. Bring home something with a story.
            </p>
            <ButtonLink href="/shop?sort=newest" size="lg" className="w-fit">
              Explore the Collection
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </div>
      </Reveal>
    </Container>
  );
}
