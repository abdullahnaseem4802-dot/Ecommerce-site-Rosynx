import {
  BadgeCheck,
  Gem,
  Globe,
  Hand,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { whyChooseUs } from "@/lib/data";
import { Container } from "@/components/ui/container";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";

const icons = {
  hand: Hand,
  gem: Gem,
  globe: Globe,
  shield: ShieldCheck,
  badge: BadgeCheck,
  rotate: RotateCcw,
};

export function WhyChooseUs() {
  return (
    <div className="mt-16 bg-espresso py-16">
      <Container>
        <Reveal>
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-light">
              The ROSYNX Promise
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-cream sm:text-4xl">
              Why Choose Us
            </h2>
          </div>
        </Reveal>
        <RevealGroup className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {whyChooseUs.map((item) => {
            const Icon = icons[item.icon as keyof typeof icons];
            return (
              <RevealItem key={item.title}>
                <div className="group flex h-full flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 text-center transition hover:border-brand-light/40 hover:bg-white/10">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/20 text-brand-light transition group-hover:scale-110">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="text-sm font-semibold text-cream">{item.title}</h3>
                  <p className="text-xs leading-relaxed text-cream/60">{item.text}</p>
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </Container>
    </div>
  );
}
