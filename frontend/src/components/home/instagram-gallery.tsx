import Image from "next/image";
import { instagramImages } from "@/lib/data";
import { Container } from "@/components/ui/container";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { InstagramIcon } from "@/components/brand/social-icons";

export function InstagramGallery() {
  return (
    <Container className="pt-16">
      <Reveal>
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            ROSYNX on Instagram
          </p>
          <h2 className="mt-2 font-serif text-2xl font-bold text-espresso sm:text-3xl">
            Follow @ROSYNX
          </h2>
          <p className="mt-1 text-sm text-muted">
            Tag us to be featured — #MadeByHands
          </p>
        </div>
      </Reveal>
      <RevealGroup className="grid grid-cols-4 gap-2 sm:gap-3 lg:grid-cols-8">
        {instagramImages.map((img, i) => (
          <RevealItem key={img + i}>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block aspect-square overflow-hidden rounded-xl"
            >
              <Image
                src={img}
                alt="ROSYNX Instagram post"
                fill
                sizes="(max-width: 1024px) 25vw, 12vw"
                className="object-cover transition duration-500 group-hover:scale-110"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-espresso/0 text-white opacity-0 transition group-hover:bg-espresso/50 group-hover:opacity-100">
                <InstagramIcon className="h-6 w-6" />
              </span>
            </a>
          </RevealItem>
        ))}
      </RevealGroup>
    </Container>
  );
}
