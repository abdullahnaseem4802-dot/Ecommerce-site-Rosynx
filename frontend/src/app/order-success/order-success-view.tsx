"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Package, ShoppingBag } from "lucide-react";
import { Container } from "@/components/ui/container";
import { api, type OrderSummary } from "@/lib/api";
import { useMoney } from "@/lib/currency";
import { OrderTotal } from "./order-total";
import { DeliveryAddress, OrderTracker } from "./order-tracker";

type State =
  | { phase: "loading"; orderNumber: string | null }
  | { phase: "ready"; order: OrderSummary }
  | { phase: "error"; orderNumber: string | null };

export function OrderSuccessView() {
  const { format } = useMoney();
  const [state, setState] = useState<State>({
    phase: "loading",
    orderNumber: null,
  });

  useEffect(() => {
    // useSearchParams() would force a CSR bailout, so read the URL directly.
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) {
      setState({ phase: "error", orderNumber: null });
      return;
    }
    let alive = true;
    setState({ phase: "loading", orderNumber: id });
    api
      .getOrder(id)
      .then((order) => {
        if (alive) setState({ phase: "ready", order });
      })
      .catch(() => {
        if (alive) setState({ phase: "error", orderNumber: id });
      });
    return () => {
      alive = false;
    };
  }, []);

  const order = state.phase === "ready" ? state.order : null;
  const orderNumber =
    order?.orderNumber ??
    (state.phase !== "ready" ? state.orderNumber : null) ??
    null;

  return (
    <div className="py-16">
      <Container className="max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl border border-line/60 bg-white p-8 text-center sm:p-12"
        >
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-newtag/15"
          >
            <CheckCircle2 className="h-11 w-11 text-newtag" />
          </motion.span>
          <h1 className="mt-6 font-serif text-3xl font-bold text-espresso">
            Order Placed Successfully
          </h1>
          <p className="mt-2 text-sm text-muted">
            Thank you for your purchase. A confirmation email is on its way.
          </p>

          {orderNumber && (
            <div className="mx-auto mt-6 flex max-w-sm items-center justify-between rounded-2xl bg-cream-soft px-5 py-4 text-sm">
              <div className="text-left">
                <p className="text-xs text-muted">Order number</p>
                <p className="font-semibold text-coffee">{orderNumber}</p>
              </div>
              {order && (
                <div className="text-right">
                  <p className="text-xs text-muted">Total</p>
                  <OrderTotal amount={order.total} />
                </div>
              )}
            </div>
          )}

          {state.phase === "loading" && (
            <div className="mt-8 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-2xl bg-cream-card"
                />
              ))}
            </div>
          )}

          {state.phase === "error" && (
            <p className="mx-auto mt-8 max-w-sm rounded-2xl bg-cream-soft px-5 py-4 text-sm text-muted">
              We couldn&apos;t load the live status for this order right now. Your
              order is safe — you can track it any time from your account.
            </p>
          )}

          {order && (
            <>
              <div className="mt-8">
                <OrderTracker
                  status={order.status}
                  events={order.events}
                  createdAt={order.createdAt}
                />
              </div>

              <div className="mt-8 rounded-card border border-line/60 bg-cream-soft p-5 text-left">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  Order summary
                </p>
                <ul className="mt-3 space-y-2">
                  {order.items.map((it, i) => (
                    <li key={i} className="flex items-start justify-between gap-4">
                      <span className="min-w-0 text-sm text-coffee">
                        {it.name}
                        <span className="text-muted"> × {it.qty}</span>
                      </span>
                      <span className="shrink-0 text-sm font-medium text-espresso">
                        {format(it.lineTotal)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 space-y-1.5 border-t border-line/60 pt-4 text-sm">
                  <Row label="Subtotal" value={format(order.subtotal)} />
                  {order.discount > 0 && (
                    <Row
                      label="Discount"
                      value={`− ${format(order.discount)}`}
                      accent
                    />
                  )}
                  <Row
                    label="Payment"
                    value={`${order.paymentMethod.replace(/_/g, " ").toLowerCase()} · ${order.paymentStatus
                      .replace(/_/g, " ")
                      .toLowerCase()}`}
                  />
                  <div className="flex items-center justify-between pt-1.5">
                    <span className="font-semibold text-coffee">Total</span>
                    <span className="font-bold text-espresso">
                      {format(order.total)}
                    </span>
                  </div>
                </div>
              </div>

              <DeliveryAddress
                address={order.shipping}
                className="mt-4 text-left"
              />
            </>
          )}

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/account/orders"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              <Package className="h-4 w-4" /> Track Order
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-line px-6 py-3 text-sm font-semibold text-coffee transition hover:border-brand"
            >
              <ShoppingBag className="h-4 w-4" /> Continue Shopping
            </Link>
          </div>
        </motion.div>
      </Container>
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted capitalize">{label}</span>
      <span className={accent ? "font-medium text-sale" : "text-coffee capitalize"}>
        {value}
      </span>
    </div>
  );
}
