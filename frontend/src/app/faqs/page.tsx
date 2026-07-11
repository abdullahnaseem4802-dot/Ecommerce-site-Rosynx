"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageBanner } from "@/components/ui/page-banner";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "What does “handmade” really mean at ROSYNX?",
    a: "Every ROSYNX piece is individually made by skilled artisans, not stamped out by a machine. Because a real person shapes, carves and finishes each item by hand, no two are ever perfectly identical. Small differences in grain, tone, veining or finish are not flaws — they are the signature of authentic, one-of-a-kind craftsmanship.",
  },
  {
    q: "What materials do you use and where do they come from?",
    a: "We work with natural, responsibly sourced materials — rosewood and hardwoods, onyx and marble, natural stone, full-grain leather, ceramic and hand-worked brass and copper. Each product page lists its primary material, and wherever possible we partner directly with the makers and suppliers who share our commitment to quality and longevity.",
  },
  {
    q: "How long does shipping take?",
    a: "Orders are carefully inspected and packed within 1–3 business days. Domestic deliveries typically arrive within 3–7 business days, while international orders generally take 7–18 business days depending on the destination and customs clearance. Larger or made-to-order pieces may need a little extra time, which we’ll always note on the product page.",
  },
  {
    q: "Do you ship internationally?",
    a: "Yes — we ship worldwide to more than 60 countries. Please note that international orders may be subject to import duties, taxes or customs fees set by your local authorities. These are not included at checkout and are the responsibility of the recipient.",
  },
  {
    q: "How can I track my order?",
    a: "Once your order ships, we’ll email you a confirmation with tracking details. You can also follow your order status at any time from the “Track Order” section of your account. If your tracking hasn’t updated after a few days, our support team is happy to look into it for you.",
  },
  {
    q: "What is your returns and exchanges policy?",
    a: "If your piece isn’t quite right, you may request a return or exchange within 14 days of delivery, provided the item is unused and in its original condition and packaging. Please note that custom, personalised or commissioned pieces are made specifically for you and are non-returnable unless they arrive damaged or faulty.",
  },
  {
    q: "Can I request a custom or commissioned piece?",
    a: "Absolutely — bespoke work is one of our favourite things to do. Share your idea, dimensions, materials or occasion through our Contact page and we’ll connect you with the right artisan, discuss options and provide a quote and timeline before any work begins.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We currently offer Cash on Delivery where available, as well as secure card payments at checkout. Card payments are processed in a protected sandbox environment for now while we finalise our live payment integration, so you can order with confidence.",
  },
  {
    q: "Why do prices show in different currencies?",
    a: "To make shopping easier wherever you are, prices can be displayed in several currencies using up-to-date exchange rates. You can switch your preferred currency at any time using the currency selector. Your order is charged in our store’s base currency, and converted amounts are shown as a helpful estimate.",
  },
  {
    q: "How do I care for my handmade item?",
    a: "Care depends on the material. As a general guide, wipe wood, stone and metal gently with a soft, dry cloth, avoid harsh chemicals and prolonged direct sunlight, and condition leather occasionally to keep it supple. Any specific care instructions for your piece are listed on its product page.",
  },
  {
    q: "What if my order arrives damaged?",
    a: "We pack every order with great care, but if something arrives damaged in transit, please contact us within 48 hours of delivery with a few photos of the item and packaging. We’ll arrange a replacement, repair or refund as quickly as possible — your satisfaction matters to us.",
  },
  {
    q: "How do I contact your support team?",
    a: "We’re here to help. Reach us through our Contact page, by email, or via the WhatsApp chat button on the site. We typically reply within 24 hours on business days and will always do our best to make things right.",
  },
];

export default function FaqsPage() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="pb-20">
      <PageBanner
        title="Frequently Asked Questions"
        subtitle="Everything you need to know about ordering from ROSYNX."
        crumb="FAQ's"
      />
      <Container>
        <div className="mx-auto max-w-3xl space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-line/60 bg-white">
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
                  <p className="px-5 pb-4 text-sm leading-relaxed text-coffee/75">
                    {f.a}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
