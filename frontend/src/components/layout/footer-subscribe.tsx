"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { api } from "@/lib/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function FooterSubscribe() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  // Start read-only so the browser can't auto-fill a saved email on load — the
  // field opens empty and only becomes editable (and shows suggestions) on tap.
  const [ro, setRo] = useState(true);

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

  if (done) {
    return (
      <div className="flex w-full max-w-md items-center justify-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-medium text-cream sm:justify-start">
        <Check className="h-5 w-5 text-brand-light" />
        You&apos;re subscribed 🎉
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
        <input
          type="email"
          required
          autoComplete="email"
          readOnly={ro}
          onFocus={() => setRo(false)}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          className="h-12 w-full rounded-full border border-white/15 bg-white/5 px-5 text-sm text-cream placeholder:text-cream/50 focus:border-brand-light focus:outline-none"
        />
        <button
          type="submit"
          disabled={submitting}
          className="h-12 shrink-0 rounded-full bg-brand px-6 text-sm font-semibold text-white transition hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "..." : "Subscribe"}
        </button>
      </form>
      {error && <p className="mt-2 text-xs font-medium text-red-300">{error}</p>}
    </div>
  );
}
