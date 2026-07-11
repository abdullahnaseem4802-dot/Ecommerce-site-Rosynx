import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PageBanner } from "@/components/ui/page-banner";

export const metadata: Metadata = {
  title: "Privacy Policy — ROSYNX",
  description: "How ROSYNX collects, uses and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="pb-20">
      <PageBanner
        title="Privacy Policy"
        subtitle="How we collect, use and protect your information."
        crumb="Privacy Policy"
      />
      <Container>
        <article className="mx-auto max-w-3xl space-y-8 text-coffee/80">
          <p className="text-sm text-muted">Last updated: June 2026</p>

          <p>
            At ROSYNX, your privacy matters as much as the craft we sell. This
            policy explains what information we collect when you visit our store,
            why we collect it, and the choices you have. By using our site you
            agree to the practices described below.
          </p>

          <section className="space-y-3">
            <h2 className="font-serif text-2xl font-bold text-espresso">
              Information We Collect
            </h2>
            <p>
              We collect information you provide directly — such as your name,
              shipping address, email and payment details when you place an
              order or create an account. We also gather limited technical data
              like browser type and pages visited to keep the site secure and
              improve your experience.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-2xl font-bold text-espresso">
              How We Use Your Information
            </h2>
            <p>
              Your information is used to process and deliver orders, respond to
              enquiries, prevent fraud and, where you have opted in, to send you
              occasional updates about new collections. We never sell your
              personal data to third parties.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-2xl font-bold text-espresso">
              Cookies
            </h2>
            <p>
              We use cookies to remember your cart, keep you signed in and
              understand how the store is used. You can disable cookies in your
              browser settings, though some features may not work as intended.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-2xl font-bold text-espresso">
              Your Rights
            </h2>
            <p>
              You may request access to, correction of, or deletion of your
              personal data at any time. To exercise these rights, contact us at
              hello@rosynx.com and we will respond within 30 days.
            </p>
          </section>
        </article>
      </Container>
    </div>
  );
}
