"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Package } from "lucide-react";
import { api, type OrderSummary } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { AccountShell } from "@/components/account/account-shell";
import { useMoney } from "@/lib/currency";
import { cn } from "@/lib/utils";
import {
  DeliveryAddress,
  OrderTracker,
} from "@/app/order-success/order-tracker";

const statusColor: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-600",
  ON_HOLD: "bg-blue-500/15 text-blue-600",
  PAID: "bg-newtag/15 text-newtag",
  PROCESSING: "bg-blue-500/15 text-blue-600",
  SHIPPED: "bg-brand/15 text-brand",
  COMPLETED: "bg-newtag/15 text-newtag",
  CANCELLED: "bg-sale/15 text-sale",
  REFUNDED: "bg-sale/15 text-sale",
};

function Pill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium capitalize",
        statusColor[status] ?? "bg-cream-card text-coffee",
      )}
    >
      {status.replace(/_/g, " ").toLowerCase()}
    </span>
  );
}

export default function OrdersPage() {
  const user = useAuth((s) => s.user);
  const ready = useAuth((s) => s.ready);
  const { format } = useMoney();
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    api
      .myOrders()
      .then(setOrders)
      .catch(() => setOrders([]));
  }, [user]);

  return (
    <AccountShell title="My Orders">
      {!ready || (user && orders === null) ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-cream-card" />
          ))}
        </div>
      ) : !orders || orders.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-white py-16 text-center">
          <Package className="h-8 w-8 text-brand" />
          <p className="mt-3 text-sm text-muted">You have no orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const expanded = open === o.orderNumber;
            return (
              <div
                key={o.orderNumber}
                className="overflow-hidden rounded-2xl border border-line/60 bg-white"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 bg-cream-soft px-5 py-3">
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-coffee">
                      {o.orderNumber}
                    </span>
                    <span className="text-xs text-muted">
                      {new Date(o.createdAt).toLocaleDateString()} ·{" "}
                      {o.paymentMethod.replace(/_/g, " ").toLowerCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Pill status={o.status} />
                    <span className="font-bold text-espresso">
                      {format(o.total)}
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-line/60">
                  {o.items.map((it, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-cream-card text-brand">
                        <Package className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-coffee">
                          {it.name}
                        </p>
                        <span className="text-xs text-muted">
                          Qty {it.qty} · {format(it.price)}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-espresso">
                        {format(it.lineTotal)}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : o.orderNumber)}
                  aria-expanded={expanded}
                  className="flex w-full items-center justify-center gap-2 border-t border-line/60 px-5 py-3 text-sm font-semibold text-brand transition hover:bg-cream-soft"
                >
                  {expanded ? "Hide tracking" : "Track order"}
                  <motion.span
                    animate={{ rotate: expanded ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div
                      key="panel"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden border-t border-line/60 bg-cream-soft"
                    >
                      <div className="grid gap-6 p-5 sm:grid-cols-2">
                        <OrderTracker
                          status={o.status}
                          events={o.events}
                          createdAt={o.createdAt}
                        />
                        <div className="space-y-4">
                          <DeliveryAddress address={o.shipping} />
                          <div className="rounded-card border border-line/60 bg-white p-5">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted">
                              Payment
                            </p>
                            <div className="mt-2 space-y-1.5 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted">Subtotal</span>
                                <span className="text-coffee">
                                  {format(o.subtotal)}
                                </span>
                              </div>
                              {o.discount > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-muted">Discount</span>
                                  <span className="font-medium text-sale">
                                    − {format(o.discount)}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-muted">Status</span>
                                <span className="capitalize text-coffee">
                                  {o.paymentStatus.replace(/_/g, " ").toLowerCase()}
                                </span>
                              </div>
                              <div className="flex justify-between border-t border-line/60 pt-1.5">
                                <span className="font-semibold text-coffee">
                                  Total
                                </span>
                                <span className="font-bold text-espresso">
                                  {format(o.total)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </AccountShell>
  );
}
