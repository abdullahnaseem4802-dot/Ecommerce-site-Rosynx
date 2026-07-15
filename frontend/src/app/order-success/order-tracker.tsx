"use client";

import { motion } from "framer-motion";
import {
  Ban,
  CheckCircle2,
  Clock,
  Home,
  RotateCcw,
  ShoppingBag,
  Truck,
} from "lucide-react";
import type { OrderAddress, OrderEvent } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * The customer-visible journey. Several backend statuses collapse into one
 * step (PAID and PROCESSING both read as "Confirmed" to the customer).
 */
const STEPS = [
  {
    label: "Order Placed",
    icon: ShoppingBag,
    blurb: "We've received your order.",
  },
  {
    label: "Confirmed",
    icon: CheckCircle2,
    blurb: "Confirmed by our team — we're preparing your items.",
  },
  { label: "Shipped", icon: Truck, blurb: "Your parcel is on its way." },
  { label: "Delivered", icon: Home, blurb: "Order completed. Enjoy!" },
] as const;

/** Which visible step each backend OrderStatus belongs to. */
const STEP_OF: Record<string, number> = {
  PENDING: 0,
  ON_HOLD: 0,
  PAID: 1,
  PROCESSING: 1,
  SHIPPED: 2,
  COMPLETED: 3,
};

const TERMINAL: Record<string, { label: string; blurb: string; icon: typeof Ban }> = {
  CANCELLED: {
    label: "Order Cancelled",
    blurb: "This order was cancelled and will not be delivered.",
    icon: Ban,
  },
  REFUNDED: {
    label: "Order Refunded",
    blurb: "This order was refunded. The amount is on its way back to you.",
    icon: RotateCcw,
  },
};

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function OrderTracker({
  status,
  events,
  createdAt,
  className,
}: {
  status: string;
  events?: OrderEvent[];
  createdAt: string;
  className?: string;
}) {
  // Only events we can place on the visible journey; oldest first.
  const timeline = (events ?? []).filter((e) => STEP_OF[e.status] !== undefined);
  const latest = timeline[timeline.length - 1];

  // Fall back to the bare status when events are missing (older orders).
  const currentStep = latest
    ? STEP_OF[latest.status]
    : (STEP_OF[status] ?? 0);

  const terminal = TERMINAL[status];
  if (terminal) {
    const ev = [...(events ?? [])].reverse().find((e) => e.status === status);
    return (
      <div className={className}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="flex gap-4 rounded-card border border-sale/30 bg-sale/5 p-5 text-left"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sale/15 text-sale">
            <terminal.icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-espresso">{terminal.label}</p>
            <p className="mt-0.5 text-sm text-muted">{terminal.blurb}</p>
            {ev && (
              <p className="mt-1 text-xs text-muted">{formatWhen(ev.createdAt)}</p>
            )}
            {ev?.note && (
              <p className="mt-2 rounded-xl bg-white px-3 py-2 text-sm text-coffee">
                {ev.note}
              </p>
            )}
          </div>
        </motion.div>

        {timeline.length > 0 && (
          <div className="mt-4 rounded-card border border-line/60 bg-cream-soft p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              History
            </p>
            <ul className="mt-2 space-y-1.5">
              {timeline.map((e, i) => (
                <li
                  key={i}
                  className="flex flex-wrap justify-between gap-x-4 text-xs text-coffee"
                >
                  <span className="capitalize">
                    {e.status.replace(/_/g, " ").toLowerCase()}
                    {e.note ? ` — ${e.note}` : ""}
                  </span>
                  <span className="text-muted">{formatWhen(e.createdAt)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {status === "ON_HOLD" && (
        <div className="mb-5 flex gap-3 rounded-card border border-blue-500/25 bg-blue-500/5 p-4 text-left">
          <Clock className="h-5 w-5 shrink-0 text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-espresso">Awaiting payment</p>
            <p className="mt-0.5 text-sm text-muted">
              We&apos;re holding your order until your bank transfer clears. It
              moves to Confirmed as soon as our team verifies the payment.
            </p>
          </div>
        </div>
      )}

      <ol className="text-left">
        {STEPS.map((step, i) => {
          // First event that lands on this step carries its real timestamp.
          const ev = timeline.find((e) => STEP_OF[e.status] === i);
          // Steps behind the current one count as done even if the admin
          // skipped straight past them, so the line never looks broken.
          const state =
            i === currentStep ? "current" : i < currentStep ? "done" : "upcoming";
          const reached = state !== "upcoming";
          const when = ev?.createdAt ?? (i === 0 ? createdAt : undefined);
          const Icon = step.icon;

          return (
            <motion.li
              key={step.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.4,
                delay: i * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex gap-4"
            >
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition",
                    reached ? "bg-brand text-white" : "bg-cream-card text-muted",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {state === "current" && (
                    <motion.span
                      className="absolute inset-0 rounded-full ring-2 ring-brand"
                      animate={{ opacity: [0.9, 0.2, 0.9], scale: [1, 1.25, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </span>
                {i < STEPS.length - 1 && (
                  <span
                    className={cn(
                      "w-0.5 flex-1",
                      i < currentStep ? "bg-brand" : "bg-line",
                    )}
                  />
                )}
              </div>

              <div className={cn("min-w-0", i < STEPS.length - 1 && "pb-6")}>
                <p
                  className={cn(
                    "text-sm font-semibold",
                    reached ? "text-espresso" : "text-muted",
                  )}
                >
                  {step.label}
                </p>
                {when && reached ? (
                  <p className="mt-0.5 text-xs text-muted">{formatWhen(when)}</p>
                ) : null}
                {state === "current" && (
                  <p className="mt-1 text-sm text-coffee">{step.blurb}</p>
                )}
                {ev?.note && (
                  <p className="mt-2 rounded-xl bg-cream-soft px-3 py-2 text-sm text-coffee">
                    {ev.note}
                  </p>
                )}
              </div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}

/** Delivery address snapshot taken at checkout. */
export function DeliveryAddress({
  address,
  className,
}: {
  address?: OrderAddress | null;
  className?: string;
}) {
  if (!address) return null;
  const lines = [
    address.line1,
    address.line2,
    [address.city, address.state, address.postalCode].filter(Boolean).join(", "),
    address.country,
  ].filter((l): l is string => Boolean(l && l.trim()));

  if (!lines.length && !address.name && !address.phone) return null;

  return (
    <div className={cn("rounded-card border border-line/60 bg-white p-5", className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        Delivery address
      </p>
      {address.name && (
        <p className="mt-2 text-sm font-semibold text-coffee">{address.name}</p>
      )}
      {lines.map((l, i) => (
        <p key={i} className="text-sm text-muted">
          {l}
        </p>
      ))}
      {address.phone && (
        <p className="mt-1 text-sm text-muted">{address.phone}</p>
      )}
    </div>
  );
}
