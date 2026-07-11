"use client";

import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import { useState, type MouseEvent } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex select-none items-center justify-center gap-2 overflow-hidden rounded-full font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-brand text-white shadow-lg shadow-brand/20 hover:bg-brand-dark hover:shadow-brand/30",
        outline:
          "border border-coffee/25 text-coffee hover:border-brand hover:text-brand",
        ghost: "text-coffee hover:bg-cream-card",
        dark: "bg-espresso text-cream hover:bg-coffee",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        md: "h-11 px-6 text-sm",
        lg: "h-[3.25rem] px-8 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type Ripple = { id: number; x: number; y: number };

type CommonProps = VariantProps<typeof buttonVariants> & {
  className?: string;
  children: React.ReactNode;
};

function useRipples() {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const add = (e: MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const id = ripples.length ? ripples[ripples.length - 1].id + 1 : 1;
    const r: Ripple = { id, x: e.clientX - rect.left, y: e.clientY - rect.top };
    setRipples((p) => [...p, r]);
    setTimeout(() => setRipples((p) => p.filter((x) => x.id !== id)), 600);
  };
  const node = (
    <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
      {ripples.map((r) => (
        <span
          key={r.id}
          className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 animate-ripple rounded-full bg-white/40"
          style={{ left: r.x, top: r.y }}
        />
      ))}
    </span>
  );
  return { add, node };
}

export function Button({
  className,
  variant,
  size,
  children,
  onClick,
  type = "button",
  disabled,
}: CommonProps & {
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const { add, node } = useRipples();
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={(e) => {
        add(e);
        onClick?.(e);
      }}
      className={cn(buttonVariants({ variant, size }), className)}
    >
      {node}
      {children}
    </button>
  );
}

export function ButtonLink({
  className,
  variant,
  size,
  children,
  href,
}: CommonProps & { href: string }) {
  const { add, node } = useRipples();
  return (
    <Link
      href={href}
      onClick={add}
      className={cn(buttonVariants({ variant, size }), className)}
    >
      {node}
      {children}
    </Link>
  );
}

export { buttonVariants };
