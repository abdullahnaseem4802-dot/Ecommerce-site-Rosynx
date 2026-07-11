import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PageBanner } from "@/components/ui/page-banner";
import { ContactInfo } from "./contact-info";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact Us — ROSYNX",
  description: "Get in touch with the ROSYNX team. We'd love to hear from you.",
};

export default function ContactPage() {
  return (
    <div className="pb-20">
      <PageBanner
        title="Contact Us"
        subtitle="Questions about an order or a custom commission? We're here to help."
        crumb="Contact Us"
      />
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
          <ContactInfo />

          <div className="lg:pt-1">
            <h2 className="font-serif text-2xl font-bold text-espresso">
              Send us a message
            </h2>
            <p className="mt-1 text-sm text-coffee/75">
              Fill in the form below and we&apos;ll be in touch shortly.
            </p>
            <div className="mt-5">
              <ContactForm />
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="mt-14">
          <h2 className="mb-1 font-serif text-2xl font-bold text-espresso">
            Find Our Studio
          </h2>
          <p className="mb-4 text-sm text-coffee/75">
            Come say hello — we love welcoming visitors to see the craft up close.
          </p>
          <div className="h-72 overflow-hidden rounded-2xl border border-line/60 shadow-sm sm:h-80">
            <iframe
              title="ROSYNX studio location"
              src="https://www.openstreetmap.org/export/embed.html?bbox=31.20%2C30.02%2C31.30%2C30.08&layer=mapnik"
              className="h-full w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </Container>
    </div>
  );
}
