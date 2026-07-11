"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  User,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useHydrated } from "@/lib/store";
import { Container } from "@/components/ui/container";
import { PageBanner } from "@/components/ui/page-banner";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/profile", label: "Profile", icon: User },
];

export function AccountShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const hydrated = useHydrated();
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const ready = useAuth((s) => s.ready);
  const logout = useAuth((s) => s.logout);

  if (!hydrated || !ready) return <div className="min-h-[60vh]" />;

  if (!user) {
    return (
      <div className="pb-20">
        <PageBanner title="My Account" crumb="Account" />
        <Container>
          <div className="mx-auto max-w-md rounded-2xl border border-line/60 bg-white p-10 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cream-card text-brand">
              <User className="h-7 w-7" />
            </span>
            <h2 className="mt-4 font-serif text-xl font-bold text-espresso">
              Please sign in
            </h2>
            <p className="mt-1 text-sm text-muted">
              You need to be signed in to view this page.
            </p>
            <ButtonLink href="/account" className="mt-5">
              Sign In
            </ButtonLink>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <PageBanner title={title} crumb="Account" />
      <Container>
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="h-fit rounded-2xl border border-line/60 bg-white p-3 lg:sticky lg:top-40">
            <div className="mb-2 flex items-center gap-3 rounded-xl bg-cream-card px-3 py-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand font-serif text-base font-bold text-white">
                {user.name.charAt(0)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-coffee">{user.name}</p>
                <p className="truncate text-xs text-muted">{user.email}</p>
              </div>
            </div>
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                    active
                      ? "bg-brand text-white"
                      : "text-coffee hover:bg-cream",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sale transition hover:bg-sale/10"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </aside>

          <div>{children}</div>
        </div>
      </Container>
    </div>
  );
}
