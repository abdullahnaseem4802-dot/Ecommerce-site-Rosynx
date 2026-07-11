"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, Search, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { navLinks } from "@/lib/data";
import { useCategories } from "@/lib/catalog-client";
import { cn } from "@/lib/utils";
import { SearchBar } from "./search-bar";
import { HeaderActions } from "./header-actions";

export function Header() {
  const [catOpen, setCatOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const categories = useCategories();

  return (
    <div className="border-b border-line/70 bg-cream-soft">
      <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-4 py-4 sm:px-6 lg:px-10">
        <Logo />

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Open menu"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-coffee transition hover:bg-cream-card lg:h-12 lg:w-12"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Search group */}
        <div className="hidden flex-1 items-stretch md:flex">
          <div className="relative">
            <button
              type="button"
              onClick={() => setCatOpen((v) => !v)}
              onBlur={() => setTimeout(() => setCatOpen(false), 150)}
              className="flex h-full items-center gap-2 rounded-l-full border border-r-0 border-line bg-cream-soft px-5 text-sm font-medium text-coffee transition hover:bg-cream-card"
            >
              Categories
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", catOpen && "rotate-180")}
              />
            </button>
            {catOpen && (
              <ul className="absolute left-0 top-[calc(100%+6px)] z-30 grid w-[440px] grid-cols-2 gap-1 rounded-2xl border border-line bg-white p-2 shadow-xl shadow-espresso/10">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/shop?category=${c.slug}`}
                      className="block rounded-lg px-3 py-2 text-sm text-coffee transition hover:bg-cream hover:text-brand"
                    >
                      {c.name.replace(" Collection", "")}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <SearchBar />
        </div>

        <div className="flex-1 md:hidden" />

        <HeaderActions />
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-line bg-cream-soft px-4 py-4 lg:hidden">
          <div className="mb-4 flex items-center rounded-full border border-line bg-white pl-4">
            <Search className="h-4 w-4 text-muted" />
            <input
              type="search"
              placeholder="Search for handmade products..."
              className="w-full bg-transparent px-3 py-2.5 text-sm focus:outline-none"
            />
          </div>
          <nav className="grid gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-coffee transition hover:bg-cream-card"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
