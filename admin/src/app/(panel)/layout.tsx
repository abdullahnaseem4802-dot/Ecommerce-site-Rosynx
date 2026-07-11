"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tags,
  Boxes,
  Users,
  Star,
  TicketPercent,
  Settings,
  Mail,
  AtSign,
  Newspaper,
  LogOut,
  ExternalLink,
  Search,
  Menu,
  X,
} from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/lib/auth";
import { Spinner } from "@/components/ui";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/products", label: "Products", icon: Package },
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/reviews", label: "Reviews", icon: Star },
  { href: "/coupons", label: "Coupons", icon: TicketPercent },
  { href: "/messages", label: "Messages", icon: Mail },
  { href: "/subscribers", label: "Subscribers", icon: AtSign },
  { href: "/blog", label: "Blog", icon: Newspaper },
  { href: "/settings", label: "Settings", icon: Settings },
];

const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL ?? "http://localhost:3000";

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const title =
    nav.find((n) => (n.href === "/" ? pathname === "/" : pathname.startsWith(n.href)))
      ?.label ?? "Admin";

  const navLinks = (onNavigate?: () => void) =>
    nav.map((item) => {
      const active =
        item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
      const Icon = item.icon;
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={clsx(
            "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
            active
              ? "text-copper-dark"
              : "text-muted hover:bg-panel-2 hover:text-fg",
          )}
        >
          {active && (
            <motion.span
              layoutId={onNavigate ? "nav-active-mobile" : "nav-active"}
              className="absolute inset-0 rounded-xl bg-copper/10 ring-1 ring-copper/20"
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            />
          )}
          <Icon size={18} className="relative z-10" />
          <span className="relative z-10 font-medium">{item.label}</span>
        </Link>
      );
    });

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line bg-panel lg:flex">
        <div className="flex items-center px-6 py-6">
          <Image
            src="/images/logo.png"
            alt="ROSYNX"
            width={200}
            height={60}
            className="h-14 w-auto object-contain"
            priority
          />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {navLinks()}
        </nav>

        <div className="space-y-1 border-t border-line px-3 py-4">
          <a
            href={STORE_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-panel-2 hover:text-fg"
          >
            <ExternalLink size={18} /> View store
          </a>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-bad/10 hover:text-bad"
          >
            <LogOut size={18} /> Sign out
          </button>
          <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-panel-2 px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-copper/15 text-xs font-semibold text-copper-dark">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-fg">{user.name}</p>
              <p className="truncate text-[11px] text-muted">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile drawer + backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-line bg-panel">
            <div className="flex items-center justify-between px-5 py-5">
              <Image
                src="/images/logo.png"
                alt="ROSYNX"
                width={180}
                height={52}
                className="h-12 w-auto object-contain"
                priority
              />
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-1.5 text-muted hover:bg-panel-2 hover:text-fg"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
              {navLinks(() => setMobileOpen(false))}
            </nav>

            <div className="space-y-1 border-t border-line px-3 py-4">
              <a
                href={STORE_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-panel-2 hover:text-fg"
              >
                <ExternalLink size={18} /> View store
              </a>
              <button
                onClick={() => {
                  setMobileOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-bad/10 hover:text-bad"
              >
                <LogOut size={18} /> Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-line bg-panel/80 px-5 backdrop-blur-md sm:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="-ml-1 rounded-lg p-1.5 text-muted hover:bg-panel-2 hover:text-fg lg:hidden"
          >
            <Menu size={22} />
          </button>
          <h1 className="font-serif text-lg font-bold text-fg">{title}</h1>
          <div className="ml-auto hidden items-center sm:flex">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                placeholder="Search…"
                className="w-56 rounded-lg border border-line bg-panel-2 py-2 pl-9 pr-3 text-sm outline-none focus:border-copper"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-line bg-panel px-2 py-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-copper/15 text-xs font-semibold text-copper-dark">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <span className="hidden pr-1 text-sm font-medium text-fg md:inline">
              {user.name.split(" ")[0]}
            </span>
          </div>
        </header>

        <motion.main
          initial={{ opacity: 0, scale: 0.985, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-6xl px-5 py-8 sm:px-8"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
