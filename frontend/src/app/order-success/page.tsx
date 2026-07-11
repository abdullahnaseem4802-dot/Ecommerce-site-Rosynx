import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Package, ShoppingBag, Truck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { OrderTotal } from "./order-total";

export const metadata: Metadata = {
  title: "Order Confirmed — ROSYNX",
};

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; total?: string }>;
}) {
  const { id, total } = await searchParams;
  const orderId = id ?? "RX-000000";
  const amount = total ? Number(total) : undefined;

  return (
    <div className="py-16">
      <Container className="max-w-2xl">
        <div className="rounded-3xl border border-line/60 bg-white p-8 text-center sm:p-12">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-newtag/15">
            <CheckCircle2 className="h-11 w-11 text-newtag" />
          </span>
          <h1 className="mt-6 font-serif text-3xl font-bold text-espresso">
            Order Placed Successfully
          </h1>
          <p className="mt-2 text-sm text-muted">
            Thank you for your purchase. A confirmation email is on its way.
          </p>

          <div className="mx-auto mt-6 flex max-w-sm items-center justify-between rounded-2xl bg-cream-soft px-5 py-4 text-sm">
            <div className="text-left">
              <p className="text-xs text-muted">Order number</p>
              <p className="font-semibold text-coffee">{orderId}</p>
            </div>
            {amount !== undefined && (
              <div className="text-right">
                <p className="text-xs text-muted">Total paid</p>
                <OrderTotal amount={amount} />
              </div>
            )}
          </div>

          {/* Steps */}
          <div className="mt-8 grid grid-cols-3 gap-3 text-center">
            {[
              { icon: CheckCircle2, label: "Confirmed", done: true },
              { icon: Package, label: "Packed", done: false },
              { icon: Truck, label: "Shipped", done: false },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-2">
                <span
                  className={
                    "flex h-11 w-11 items-center justify-center rounded-full " +
                    (s.done ? "bg-brand text-white" : "bg-cream-card text-muted")
                  }
                >
                  <s.icon className="h-5 w-5" />
                </span>
                <span className="text-xs font-medium text-coffee">{s.label}</span>
              </div>
            ))}
          </div>

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
        </div>
      </Container>
    </div>
  );
}
