import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { featuredCollections } from "@/lib/data";
import { Container } from "@/components/ui/container";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { SectionHeading } from "./section-heading";

export function FeaturedCollections() {
  return (
    <Container className="pt-16">
      <Reveal>
        <SectionHeading title="Featured Collections" viewAllHref="/shop" />
      </Reveal>
      <RevealGroup className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {featuredCollections.map((c) => (
          <RevealItem key={c.name}>
            <Link
              href={c.href}
              className="group relative flex h-56 flex-col justify-end overflow-hidden rounded-2xl p-5"
            >
              <Image
                src={c.image}
                alt={c.name}
                fill
                sizes="(max-width: 768px) 50vw, 20vw"
                className="object-cover transition duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-espresso/85 via-espresso/30 to-transparent" />
              <div className="relative text-white">
                <h3 className="font-serif text-lg font-semibold">{c.name}</h3>
                <p className="text-xs text-white/75">{c.tagline}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-light opacity-0 transition group-hover:opacity-100">
                  Shop Collection <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          </RevealItem>
        ))}
      </RevealGroup>
    </Container>
  );
}
