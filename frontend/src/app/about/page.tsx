import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { PageBanner } from "@/components/ui/page-banner";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { WhyChooseUs } from "@/components/home/why-choose-us";
import { artisans, timeline, workshopImages } from "@/lib/content";

export const metadata: Metadata = {
  title: "About Us — ROSYNX",
  description: "The story behind ROSYNX — a marketplace for handcrafted luxury décor.",
};

export default function AboutPage() {
  return (
    <div className="pb-10">
      <PageBanner
        title="Our Story"
        subtitle="Connecting master artisans with homes that value craft."
        crumb="About Us"
      />
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="relative h-80 overflow-hidden rounded-3xl">
            <Image src="/images/hero/hero-2.jpg" alt="Artisan at work" fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
          </div>
          <div className="space-y-4 text-coffee/80">
            <h2 className="font-serif text-3xl font-bold text-espresso">
              Made by Hands, Chosen with Heart
            </h2>
            <p>
              ROSYNX began with a simple belief: the objects we live with should
              be made with intention. We partner directly with skilled artisans
              working in rosewood, onyx, stone, brass and full-grain leather to
              bring their craft to a global audience.
            </p>
            <p>
              Every piece is handmade in small batches, ethically sourced, and
              built to last for generations — never mass-produced. When you buy
              from ROSYNX, you support the makers and the traditions behind each
              creation.
            </p>
            <div className="grid grid-cols-3 gap-4 pt-2">
              {[
                ["120+", "Artisans"],
                ["12k+", "Happy Homes"],
                ["60+", "Countries"],
              ].map(([n, l]) => (
                <div key={l} className="rounded-2xl bg-cream-card p-4 text-center">
                  <p className="font-serif text-2xl font-bold text-espresso">{n}</p>
                  <p className="text-xs text-muted">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
      <WhyChooseUs />

      {/* Timeline */}
      <Container className="mt-16">
        <Reveal>
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
              Our Journey
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-espresso sm:text-4xl">
              A Decade of Craft
            </h2>
          </div>
        </Reveal>
        <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {timeline.map((m) => (
            <RevealItem key={m.year}>
              <div className="relative h-full rounded-2xl border border-line/60 bg-cream-card p-6">
                <span className="absolute -top-3 left-6 h-2 w-2 rounded-full bg-brand ring-4 ring-cream" />
                <p className="font-serif text-3xl font-bold text-brand">{m.year}</p>
                <h3 className="mt-2 text-sm font-semibold text-espresso">{m.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-coffee/70">{m.text}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>

      {/* Meet the Artisans */}
      <Container className="mt-20">
        <Reveal>
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
              The Makers
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-espresso sm:text-4xl">
              Meet the Artisans
            </h2>
          </div>
        </Reveal>
        <RevealGroup className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
          {artisans.map((a) => (
            <RevealItem key={a.name}>
              <div className="group relative overflow-hidden rounded-2xl">
                <div className="relative h-56">
                  <Image
                    src={a.image}
                    alt={a.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 16vw"
                    className="object-cover transition duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-espresso/90 via-espresso/30 to-transparent" />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="font-serif text-base font-semibold text-cream">{a.name}</p>
                  <p className="text-xs text-brand-light">{a.role}</p>
                  <p className="mt-0.5 text-[11px] text-cream/60">{a.country}</p>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>

      {/* Behind the scenes */}
      <Container className="mt-20">
        <Reveal>
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
              Inside the Workshop
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-espresso sm:text-4xl">
              Behind the Scenes
            </h2>
          </div>
        </Reveal>
        <RevealGroup className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {workshopImages.map((src, i) => (
            <RevealItem key={src}>
              <div className="relative h-52 overflow-hidden rounded-2xl">
                <Image
                  src={src}
                  alt={`Workshop ${i + 1}`}
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition duration-700 hover:scale-110"
                />
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </div>
  );
}
