"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Eye } from "lucide-react";
import { api, Order } from "@/lib/api";
import { Card, StatusPill } from "@/components/ui";
import { useCached } from "@/lib/use-cached";

const STATUSES = [
  "PENDING",
  "ON_HOLD",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
];

export default function OrdersPage() {
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const { data: orders, setData: setOrders } = useCached(
    `orders?status=${filter}`,
    () => api.get<Order[]>(`/orders${filter ? `?status=${filter}` : ""}`),
  );

  async function updateStatus(o: Order, status: string) {
    const updated = await api.patch<Order>(`/orders/${o.id}/status`, { status });
    setOrders((prev) =>
      prev ? prev.map((x) => (x.id === o.id ? { ...x, ...updated } : x)) : prev,
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="mt-1 text-sm text-muted">
            {orders ? `${orders.length} orders` : "Loading…"}
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm outline-none focus:border-copper"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 space-y-3">
        {!orders ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-2xl" />
          ))
        ) : orders.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 p-12 text-center">
            <ShoppingCart className="text-muted" />
            <p className="text-sm text-muted">No orders yet.</p>
          </Card>
        ) : (
          orders.map((o, i) => (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="overflow-hidden">
                <div className="flex w-full items-center gap-4 px-5 py-4">
                  <button
                    onClick={() => setOpen(open === o.id ? null : o.id)}
                    className="flex min-w-0 flex-1 items-center gap-4 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{o.orderNumber}</p>
                      <p className="truncate text-xs text-muted">
                        {o.email} · {new Date(o.createdAt).toLocaleDateString()}{" "}
                        · {o.paymentMethod.replace(/_/g, " ")}
                      </p>
                    </div>
                    <StatusPill status={o.status} />
                    <span className="w-16 text-right text-sm font-semibold">
                      ${o.total}
                    </span>
                  </button>
                  <button
                    onClick={() => setOpen(open === o.id ? null : o.id)}
                    className="rounded-lg p-1.5 text-muted hover:bg-panel-2 hover:text-copper-light"
                    title="View order"
                  >
                    <Eye size={15} />
                  </button>
                </div>

                <AnimatePresence initial={false}>
                  {open === o.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-line"
                    >
                      <div className="grid gap-5 p-5 sm:grid-cols-2">
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase text-muted">
                            Items
                          </p>
                          <ul className="space-y-1 text-sm">
                            {o.items.map((it, idx) => (
                              <li key={idx} className="flex justify-between">
                                <span>
                                  {it.qty} × {it.name}
                                </span>
                                <span className="text-muted">${it.lineTotal}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
                            <Row label="Subtotal" value={`$${o.subtotal}`} />
                            {o.discount > 0 && (
                              <Row
                                label={`Discount ${o.couponCode ? `(${o.couponCode})` : ""}`}
                                value={`-$${o.discount}`}
                              />
                            )}
                            <Row label="Total" value={`$${o.total}`} bold />
                          </div>
                        </div>
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase text-muted">
                            Ship to
                          </p>
                          <p className="text-sm text-fg">
                            {o.shippingAddress?.name}
                          </p>
                          <p className="text-sm text-muted">
                            {o.shippingAddress?.line1}
                            {o.shippingAddress?.city
                              ? `, ${o.shippingAddress.city}`
                              : ""}
                            {o.shippingAddress?.country
                              ? `, ${o.shippingAddress.country}`
                              : ""}
                          </p>
                          <p className="text-sm text-muted">
                            {o.shippingAddress?.phone}
                          </p>

                          <p className="mb-2 mt-4 text-xs font-semibold uppercase text-muted">
                            Payment
                          </p>
                          <div className="space-y-1 text-sm">
                            <Row
                              label="Method"
                              value={o.paymentMethod.replace(/_/g, " ")}
                            />
                            <Row label="Status" value={o.paymentStatus} />
                            {o.paymentReference && (
                              <Row
                                label="Transaction ID"
                                value={o.paymentReference}
                              />
                            )}
                          </div>

                          <p className="mb-2 mt-4 text-xs font-semibold uppercase text-muted">
                            Update status
                          </p>
                          <select
                            value={o.status}
                            onChange={(e) => updateStatus(o, e.target.value)}
                            className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm outline-none focus:border-copper"
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s.replace(/_/g, " ")}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className={bold ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}
