"use client";

import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  XIcon,
} from "@/components/brand/social-icons";
import { businessHours } from "@/lib/content";
import { useSettings, whatsappDigits } from "@/lib/use-settings";

const socials = [
  { label: "Instagram", href: "https://instagram.com", Icon: InstagramIcon },
  { label: "Facebook", href: "https://facebook.com", Icon: FacebookIcon },
  { label: "X", href: "https://x.com", Icon: XIcon },
];

/* Sensible fallbacks used only until live store settings load. */
const FALLBACK = {
  address: "12 Artisan Lane, Cairo, Egypt",
  phone: "+20 100 000 0000",
  email: "hello@rosynx.com",
};

export function ContactInfo() {
  const settings = useSettings();
  const whatsapp = whatsappDigits(settings);

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

      {/* Business hours */}
      <div className="rounded-2xl border border-line/60 bg-white p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cream-card text-brand">
            <Clock className="h-5 w-5" />
          </span>
          <p className="font-serif text-lg font-semibold text-espresso">
            Business Hours
          </p>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          {businessHours.map((h) => (
            <li
              key={h.day}
              className="flex items-center justify-between border-b border-line/50 pb-2 last:border-0 last:pb-0"
            >
              <span className="text-coffee/80">{h.day}</span>
              <span className="font-medium text-coffee">{h.hours}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">
          We usually reply within 24 hours.
        </p>
      </div>

      {/* WhatsApp + socials */}
      <div className="space-y-4">
        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
          >
            <MessageCircle className="h-4 w-4" />
            Chat on WhatsApp
          </a>
        )}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">Follow us</span>
          {socials.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-coffee transition hover:border-brand hover:bg-brand hover:text-white"
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
