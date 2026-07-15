import type { Metadata } from "next";
import { OrderSuccessView } from "./order-success-view";

export const metadata: Metadata = {
  title: "Order Confirmed — ROSYNX",
};

export default function OrderSuccessPage() {
  // The order number comes from the URL and the real order is fetched
  // client-side (see OrderSuccessView) — nothing here is SEO content.
  return <OrderSuccessView />;
}
