"use client";

import { Mail, MapPin, Phone } from "lucide-react";
import { useSettings } from "@/lib/use-settings";

/* Sensible fallbacks used only until live store settings load. */
const FALLBACK = {
  address: "12 Artisan Lane, Cairo, Egypt",
  phone: "+20 100 000 0000",
  email: "rosynxsupport@gmail.com",
};

export function ContactInfo() {
  const settings = useSettings();

  const cards = [
    {
      icon: MapPin,
      label: "Visit our studio",
      value: settings?.addressLine || FALLBACK.address,
    },
    {
      icon: Phone,
      label: "Call us",
      value: settings?.contactPhone || FALLBACK.phone,
      href: `tel:${(settings?.contactPhone || FALLBACK.phone).replace(/\s+/g, "")}`,
    },
    {
      icon: Mail,
      label: "Email us",
      value: settings?.supportEmail || FALLBACK.email,
      href: `mailto:${settings?.supportEmail || FALLBACK.email}`,
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl font-bold text-espresso">
          Get in touch
        </h2>
        <p className="mt-1 text-sm text-coffee/75">
          Whether it&apos;s a question about an order or a custom commission,
          our team is here to help. Reach out and we&apos;ll get back to you
          within 24 hours.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-1">
        {cards.map((c) => {
          const body = (
            <>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream-card text-brand transition group-hover:bg-brand group-hover:text-white">
                <c.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted">
                  {c.label}
                </p>
                <p className="truncate font-medium text-coffee">{c.value}</p>
              </div>
            </>
          );
          return c.href ? (
            <a
              key={c.label}
              href={c.href}
              className="group flex items-center gap-4 rounded-2xl border border-line/60 bg-white p-5 transition hover:border-brand/40 hover:shadow-sm"
            >
              {body}
            </a>
          ) : (
            <div
              key={c.label}
              className="group flex items-center gap-4 rounded-2xl border border-line/60 bg-white p-5"
            >
              {body}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted">We usually reply within 24 hours.</p>
    </div>
  );
}
