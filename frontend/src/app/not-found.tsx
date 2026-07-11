import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page Not Found — ROSYNX",
};

export default function NotFound() {
  return (
    <div className="bg-cream">
      <Container className="flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
        <p className="font-serif text-[7rem] font-bold leading-none text-brand sm:text-[9rem]">
          404
        </p>
        <h1 className="mt-2 font-serif text-3xl font-bold text-espresso sm:text-4xl">
          This page wandered off
        </h1>
        <p className="mt-3 max-w-md text-sm text-coffee/70">
          The page you are looking for doesn&apos;t exist or has been moved. Let&apos;s
          get you back to something beautiful.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink href="/" variant="primary">
            Back to Home
          </ButtonLink>
          <ButtonLink href="/shop" variant="outline">
            Browse the Shop
          </ButtonLink>
        </div>
      </Container>
    </div>
  );
}
