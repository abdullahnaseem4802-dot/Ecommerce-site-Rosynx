import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  XIcon,
} from "@/components/brand/social-icons";
import { FooterSubscribe } from "./footer-subscribe";

const columns = [
  {
    title: "Shop",
    links: [
      { label: "All Products", href: "/shop" },
      { label: "New Arrivals", href: "/shop?sort=newest" },
      { label: "Luxury", href: "/shop?category=luxury" },
      { label: "Home Decor", href: "/shop?category=home-decor" },
    ],
  },
  {
    title: "Customer Care",
    links: [
      { label: "Contact Us", href: "/contact" },
      { label: "FAQ's", href: "/faqs" },
      { label: "Shipping Policy", href: "/shipping-policy" },
      { label: "Returns & Refunds", href: "/returns" },
      { label: "Track Order", href: "/account/orders" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Blogs", href: "/blogs" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms & Conditions", href: "/terms" },
    ],
  },
];

const socials = [InstagramIcon, FacebookIcon, XIcon];

export function SiteFooter() {
  return (
    <footer className="mt-12 bg-espresso text-cream/80">
      {/* Newsletter */}
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-4 px-4 py-6 text-center sm:px-6 lg:flex-row lg:justify-between lg:px-10 lg:text-left">
          <div>
            <h3 className="font-serif text-2xl font-semibold text-cream">
              Join the ROSYNX circle
            </h3>
            <p className="mt-1 text-sm text-cream/70">
              Be first to know about new collections, stories, and exclusive offers.
            </p>
          </div>
          <FooterSubscribe />
        </div>
      </div>

      {/* Main */}
      <div className="mx-auto grid max-w-[1400px] gap-x-8 gap-y-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:px-10">
        <div>
          <div className="flex items-center">
            <Image
              src="/images/logo.png"
              alt="ROSYNX"
              width={140}
              height={140}
              className="h-14 w-auto object-contain brightness-0 invert"
            />
          </div>
          <p className="mt-4 max-w-xs text-sm text-cream/70">
            Timeless handmade treasures crafted with passion, tradition, and
            purpose — brought to your home.
          </p>
          <ul className="mt-5 space-y-2 text-sm text-cream/70">
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-light" /> 12 Artisan Lane, Cairo, EG
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-brand-light" /> +20 100 000 0000
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-brand-light" /> hello@rosynx.com
            </li>
          </ul>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="font-serif text-base font-semibold text-cream">
              {col.title}
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-cream/70 transition hover:text-brand-light"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-3 px-4 py-4 text-xs text-cream/60 sm:flex-row sm:px-6 lg:px-10">
          <p>© {new Date().getFullYear()} ROSYNX. All rights reserved.</p>
          <div className="flex items-center gap-3">
            {socials.map((Icon, i) => (
              <Link
                key={i}
                href="#"
                aria-label="Social link"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 transition hover:border-brand-light hover:text-brand-light"
              >
                <Icon className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
