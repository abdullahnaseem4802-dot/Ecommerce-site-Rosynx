"use client";

import { useEffect, useState } from "react";
import { Check, Mail } from "lucide-react";
import { Container } from "@/components/ui/container";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function NewsletterCTA() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const user = useAuth((s) => s.user);

  // Prefill a logged-in visitor's email, but only while the field is untouched.
  useEffect(() => {
    if (user?.email) setEmail((cur) => cur || user.email);
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await api.subscribe(email.trim());
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container className="pt-16">
      <div className="relative overflow-hidden rounded-3xl bg-espresso px-6 py-14 text-center sm:px-12">
        <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_15%_20%,#a9764f_0,transparent_35%),radial-gradient(circle_at_85%_80%,#8a5d3e_0,transparent_40%)]" />
        <div className="relative mx-auto max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-light">
            <Mail className="h-4 w-4" /> Get 10% OFF your first order
          </span>
          <h2 className="mt-4 font-serif text-3xl font-bold text-cream sm:text-4xl">
            Join the ROSYNX Circle
          </h2>
          <p className="mt-2 text-sm text-cream/70">
            Subscribe for new collections, artisan stories, and an exclusive 10%
            welcome discount.
          </p>

          {done ? (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-newtag/20 px-5 py-3 text-sm font-medium text-cream">
              <Check className="h-5 w-5 text-newtag" />
              You&apos;re in! Check your inbox for your 10% code.
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row"
            >
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="h-12 w-full rounded-full border border-white/15 bg-white/5 px-5 text-sm text-cream placeholder:text-cream/50 focus:border-brand-light focus:outline-none"
              />
              <button
                type="submit"
                disabled={submitting}
                className="h-12 shrink-0 rounded-full bg-brand px-7 text-sm font-semibold text-white transition hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Joining..." : "Get My Code"}
              </button>
            </form>
          )}
          {error && !done && (
            <p className="mt-3 text-xs font-medium text-red-300">{error}</p>
          )}
          <p className="mt-3 text-xs text-cream/50">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </Container>
  );
}
