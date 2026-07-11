"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinks } from "@/lib/data";
import { cn } from "@/lib/utils";

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden border-b border-line/70 bg-cream-soft lg:block">
      <ul className="mx-auto flex max-w-[1400px] items-center justify-center gap-10 px-4 sm:px-6 lg:px-10">
        {navLinks.map((link) => {
          const active =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "relative block py-3.5 text-[15px] font-medium text-coffee/80 transition hover:text-brand",
                  active && "text-brand",
                )}
              >
                {link.label}
                <span
                  className={cn(
                    "absolute -bottom-px left-0 h-0.5 w-full origin-left rounded-full bg-brand transition-transform duration-300",
                    active ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
