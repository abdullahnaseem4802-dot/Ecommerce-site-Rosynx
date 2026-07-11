"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Heart,
  LayoutDashboard,
  LogIn,
  LogOut,
  MapPin,
  Package,
  ShoppingBag,
  Trash2,
  User,
  UserPlus,
} from "lucide-react";
import { useAllProducts } from "@/lib/catalog-client";
import { useAuth } from "@/lib/auth";
import { useCartCount, useCartTotal, useHydrated, useShop } from "@/lib/store";
import { useMoney } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { CurrencySwitcher } from "./currency-switcher";

type Key = "account" | "wishlist" | "cart" | null;

export function HeaderActions() {
  const [open, setOpen] = useState<Key>(null);
  const ref = useRef<HTMLDivElement>(null);
  const hydrated = useHydrated();

  const cartCount = useCartCount();
  const wishlistCount = useShop((s) => s.wishlist.length);
  const user = useAuth((s) => s.user);
  const accountLabel = hydrated && user ? user.name.split(" ")[0] : "Account";

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="flex items-center gap-3 sm:gap-6">
      {/* Currency */}
      <CurrencySwitcher />

      {/* Account */}
      <div className="relative">
        <Trigger
          label={accountLabel}
          icon={<User className="h-6 w-6" />}
          onClick={() => setOpen(open === "account" ? null : "account")}
        />
        <Dropdown open={open === "account"} align="right" width="w-56">
          <AccountMenu onNavigate={() => setOpen(null)} />
        </Dropdown>
      </div>

      {/* Wishlist */}
      <div className="relative">
        <Trigger
          label="Wishlist"
          icon={<Heart className="h-6 w-6" />}
          count={hydrated ? wishlistCount : 0}
          onClick={() => setOpen(open === "wishlist" ? null : "wishlist")}
        />
        <Dropdown open={open === "wishlist"} align="right" width="w-80">
          <WishlistPreview onNavigate={() => setOpen(null)} />
        </Dropdown>
      </div>

      {/* Cart */}
      <div className="relative">
        <Trigger
          label="Cart"
          icon={<ShoppingBag className="h-6 w-6" />}
          count={hydrated ? cartCount : 0}
          onClick={() => setOpen(open === "cart" ? null : "cart")}
        />
        <Dropdown open={open === "cart"} align="right" width="w-80">
          <CartPreview onNavigate={() => setOpen(null)} />
        </Dropdown>
      </div>
    </div>
  );
}

function Trigger({
  label,
  icon,
  count,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-0.5 text-coffee transition hover:text-brand"
    >
      <span className="relative">
        {icon}
        {count !== undefined && count > 0 && (
          <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white">
            {count}
          </span>
        )}
      </span>
      <span className="hidden text-[11px] font-medium sm:block">{label}</span>
    </button>
  );
}

function Dropdown({
  open,
  width,
  children,
}: {
  open: boolean;
  align?: "right";
  width: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.18 }}
          className={cn(
            "absolute right-0 top-[calc(100%+14px)] z-50 rounded-2xl border border-line bg-white py-2 shadow-xl shadow-espresso/10",
            width,
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AccountMenu({ onNavigate }: { onNavigate: () => void }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  if (!hydrated || !user) {
    return (
      <div onClick={onNavigate}>
        <p className="px-4 pb-2 pt-1 text-sm font-semibold text-espresso">
          Welcome to ROSYNX
        </p>
        <MenuLink href="/account" icon={<LogIn className="h-4 w-4" />} label="Sign In" />
        <MenuLink href="/account" icon={<UserPlus className="h-4 w-4" />} label="Create Account" />
        <div className="my-1 border-t border-line" />
        <MenuLink href="/wishlist" icon={<Heart className="h-4 w-4" />} label="Wishlist" />
      </div>
    );
  }

  return (
    <div onClick={onNavigate}>
      <div className="px-4 pb-2 pt-1">
        <p className="text-sm font-semibold text-espresso">Hi, {user.name.split(" ")[0]}</p>
        <p className="truncate text-xs text-muted">{user.email}</p>
      </div>
      <div className="my-1 border-t border-line" />
      <MenuLink href="/account" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" />
      <MenuLink href="/account/orders" icon={<Package className="h-4 w-4" />} label="My Orders" />
      <MenuLink href="/account/addresses" icon={<MapPin className="h-4 w-4" />} label="Addresses" />
      <MenuLink href="/account/profile" icon={<User className="h-4 w-4" />} label="Profile" />
      <MenuLink href="/wishlist" icon={<Heart className="h-4 w-4" />} label="Wishlist" />
      <div className="my-1 border-t border-line" />
      <button
        onClick={() => {
          logout();
          router.push("/");
        }}
        className="flex w-full items-center gap-3 px-4 py-2 text-sm text-sale transition hover:bg-sale/10"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </div>
  );
}

function MenuLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-2 text-sm text-coffee transition hover:bg-cream hover:text-brand"
    >
      {icon}
      {label}
    </Link>
  );
}

function WishlistPreview({ onNavigate }: { onNavigate: () => void }) {
  const ids = useShop((s) => s.wishlist);
  const toggle = useShop((s) => s.toggleWishlist);
  const { format } = useMoney();
  const { products } = useAllProducts();
  const items = products.filter((p) => ids.includes(p.id)).slice(0, 4);

  if (items.length === 0) {
    return <Empty label="Your wishlist is empty" icon={<Heart className="h-6 w-6" />} />;
  }
  return (
    <div className="px-2">
      <p className="px-2 pb-2 text-sm font-semibold text-espresso">
        Wishlist ({ids.length})
      </p>
      <ul className="max-h-72 space-y-1 overflow-y-auto">
        {items.map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-cream">
            <Link href={`/product/${p.id}`} onClick={onNavigate} className="relative h-12 w-12 overflow-hidden rounded-lg bg-cream-card">
              <Image src={p.images[0]} alt="" fill sizes="48px" className="object-cover" />
            </Link>
            <Link href={`/product/${p.id}`} onClick={onNavigate} className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-coffee">{p.name}</span>
              <span className="text-sm font-semibold text-espresso">{format(p.price)}</span>
            </Link>
            <button onClick={() => toggle(p.id)} aria-label="Remove" className="text-muted hover:text-sale">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      <Link
        href="/wishlist"
        onClick={onNavigate}
        className="mt-2 block rounded-full border border-line py-2 text-center text-sm font-medium text-coffee transition hover:border-brand hover:text-brand"
      >
        View wishlist
      </Link>
    </div>
  );
}

function CartPreview({ onNavigate }: { onNavigate: () => void }) {
  const cart = useShop((s) => s.cart);
  const total = useCartTotal();
  const remove = useShop((s) => s.removeFromCart);
  const { format } = useMoney();

  if (cart.length === 0) {
    return <Empty label="Your cart is empty" icon={<ShoppingBag className="h-6 w-6" />} />;
  }
  return (
    <div className="px-2">
      <p className="px-2 pb-2 text-sm font-semibold text-espresso">
        My Cart ({cart.reduce((n, l) => n + l.qty, 0)})
      </p>
      <ul className="max-h-72 space-y-1 overflow-y-auto">
        {cart.map((l) => (
          <li key={l.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-cream">
            <Link href={`/product/${l.id}`} onClick={onNavigate} className="relative h-12 w-12 overflow-hidden rounded-lg bg-cream-card">
              <Image src={l.image} alt="" fill sizes="48px" className="object-cover" />
            </Link>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-coffee">{l.name}</span>
              <span className="text-xs text-muted">
                {l.qty} × {format(l.price)}
              </span>
            </div>
            <button onClick={() => remove(l.id)} aria-label="Remove" className="text-muted hover:text-sale">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-center justify-between px-2 py-2 text-sm">
        <span className="text-muted">Subtotal</span>
        <span className="font-bold text-espresso">{format(total)}</span>
      </div>
      <div className="flex gap-2 px-1 pb-1">
        <Link
          href="/cart"
          onClick={onNavigate}
          className="flex-1 rounded-full border border-line py-2 text-center text-sm font-medium text-coffee transition hover:border-brand"
        >
          View Cart
        </Link>
        <Link
          href="/checkout"
          onClick={onNavigate}
          className="flex-1 rounded-full bg-brand py-2 text-center text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          Checkout
        </Link>
      </div>
    </div>
  );
}

function Empty({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cream-card text-brand">
        {icon}
      </span>
      <p className="text-sm text-muted">{label}</p>
      <Link href="/shop" className="text-sm font-medium text-brand hover:underline">
        Start shopping
      </Link>
    </div>
  );
}
