import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PageBanner } from "@/components/ui/page-banner";

export const metadata: Metadata = {
  title: "Returns & Refunds — ROSYNX",
  description: "Our 30-day return policy and how refunds are handled at ROSYNX.",
};

export default function ReturnsPage() {
  return (
    <div className="pb-20">
      <PageBanner
        title="Returns & Refunds"
        subtitle="Our 30-day, hassle-free return promise."
        crumb="Returns & Refunds"
      />
      <Container>
        <article className="mx-auto max-w-3xl space-y-8 text-coffee/80">
          <p className="text-sm text-muted">Last updated: June 2026</p>

          <p>
            We want you to love your ROSYNX piece. If something is not right, our
            return process is simple and designed around you.
          </p>

          <section className="space-y-3">
            <h2 className="font-serif text-2xl font-bold text-espresso">
              30-Day Returns
            </h2>
            <p>
              You may return most items within 30 days of delivery for a full
              refund or exchange. Pieces must be unused, in their original
              condition and returned in their protective packaging.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-2xl font-bold text-espresso">
              How to Start a Return
            </h2>
            <p>
              Email hello@rosynx.com with your order number and the reason for
              your return. We will send a prepaid label and instructions within
              one business day.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-2xl font-bold text-espresso">
              Refunds
            </h2>
            <p>
              Once your return is received and inspected, refunds are issued to
              your original payment method within 5–7 business days. You will
              receive an email confirmation as soon as it is processed.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-2xl font-bold text-espresso">
              Non-Returnable Items
            </h2>
            <p>
              Custom commissions and personalised pieces are made to order and
              cannot be returned unless they arrive damaged. If your order
              arrives damaged, contact us within 48 hours and we will make it
              right.
            </p>
          </section>
        </article>
      </Container>
    </div>
  );
}
