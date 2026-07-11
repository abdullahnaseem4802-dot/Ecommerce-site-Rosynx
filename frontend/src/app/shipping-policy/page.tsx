import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PageBanner } from "@/components/ui/page-banner";

export const metadata: Metadata = {
  title: "Shipping Policy — ROSYNX",
  description: "Delivery times, costs and how ROSYNX ships your handmade order.",
};

export default function ShippingPolicyPage() {
  return (
    <div className="pb-20">
      <PageBanner
        title="Shipping Policy"
        subtitle="How and when your handmade order reaches you."
        crumb="Shipping Policy"
      />
      <Container>
        <article className="mx-auto max-w-3xl space-y-8 text-coffee/80">
          <p className="text-sm text-muted">Last updated: June 2026</p>

          <p>
            Every ROSYNX piece is carefully packed by hand to survive its
            journey and arrive exactly as the artisan intended. Below is what to
            expect once your order is placed.
          </p>

          <section className="space-y-3">
            <h2 className="font-serif text-2xl font-bold text-espresso">
              Processing Time
            </h2>
            <p>
              Orders are prepared within 1–3 business days. Because items are
              handmade in small batches, an occasional piece may require an extra
              day or two — we will always let you know if so.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-2xl font-bold text-espresso">
              Delivery Times
            </h2>
            <p>
              Domestic orders typically arrive within 3–5 business days.
              International delivery to our 60+ supported countries usually takes
              7–14 business days, depending on destination and customs.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-2xl font-bold text-espresso">
              Shipping Costs
            </h2>
            <p>
              Shipping is calculated at checkout based on weight and destination.
              We offer complimentary standard shipping on qualifying orders —
              the threshold is shown in your cart.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-2xl font-bold text-espresso">
              Tracking & Customs
            </h2>
            <p>
              A tracking link is emailed as soon as your order ships.
              International customers are responsible for any import duties or
              taxes levied by their local authorities.
            </p>
          </section>
        </article>
      </Container>
    </div>
  );
}
