import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PageBanner } from "@/components/ui/page-banner";

export const metadata: Metadata = {
  title: "Terms & Conditions — ROSYNX",
  description: "The terms that govern your use of the ROSYNX store and services.",
};

export default function TermsPage() {
  return (
    <div className="pb-20">
      <PageBanner
        title="Terms & Conditions"
        subtitle="The agreement between you and ROSYNX."
        crumb="Terms & Conditions"
      />
      <Container>
        <article className="mx-auto max-w-3xl space-y-8 text-coffee/80">
          <p className="text-sm text-muted">Last updated: June 2026</p>

          <p>
            These Terms & Conditions govern your access to and use of the ROSYNX
            website and the purchase of products through it. By placing an order
            you confirm that you accept these terms.
          </p>

          <section className="space-y-3">
            <h2 className="font-serif text-2xl font-bold text-espresso">
              Use of the Site
            </h2>
            <p>
              You agree to use the site only for lawful purposes and not to
              attempt to interfere with its operation or security. All content,
              imagery and branding remain the property of ROSYNX and may not be
              reproduced without permission.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-2xl font-bold text-espresso">
              Orders & Pricing
            </h2>
            <p>
              All orders are subject to acceptance and availability. Because each
              item is handmade, slight variations in colour, grain and finish are
              natural and not considered defects. Prices are listed in your local
              currency and may change without notice prior to purchase.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-2xl font-bold text-espresso">
              Payment
            </h2>
            <p>
              Payment is taken at checkout through encrypted, trusted providers.
              We reserve the right to cancel any order where payment cannot be
              verified or where fraud is suspected.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-2xl font-bold text-espresso">
              Limitation of Liability
            </h2>
            <p>
              ROSYNX is not liable for indirect or consequential losses arising
              from the use of our products beyond the value of the goods
              purchased. Nothing in these terms limits your statutory rights as a
              consumer.
            </p>
          </section>
        </article>
      </Container>
    </div>
  );
}
