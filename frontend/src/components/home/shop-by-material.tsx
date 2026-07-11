import Image from "next/image";
import Link from "next/link";
import { materials } from "@/lib/data";
import { Container } from "@/components/ui/container";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { SectionHeading } from "./section-heading";

export function ShopByMaterial() {
  return (
    <Container className="pt-16">
      <Reveal>
        <SectionHeading title="Shop by Material" viewAllHref="/shop" />
      </Reveal>
      <RevealGroup className="grid grid-cols-4 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        {materials.map((m) => (
          <RevealItem key={m.slug}>
            <Link
              href={`/shop?material=${m.slug}`}
              className="group flex flex-col items-center gap-2.5"
            >
              <span className="relative h-20 w-20 overflow-hidden rounded-full border border-line ring-2 ring-transparent transition group-hover:ring-brand">
                <Image
                  src={m.image}
                  alt={m.name}
                  fill
                  sizes="80px"
                  className="object-cover transition duration-500 group-hover:scale-110"
                />
              </span>
              <span className="text-sm font-medium text-coffee transition group-hover:text-brand">
                {m.name}
              </span>
            </Link>
          </RevealItem>
        ))}
      </RevealGroup>
    </Container>
  );
}
