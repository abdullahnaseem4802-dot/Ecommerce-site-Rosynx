"use client";

import { useMoney } from "@/lib/currency";

/** Client-side currency-aware total for the (server-rendered) success page. */
export function OrderTotal({ amount }: { amount: number }) {
  const { format } = useMoney();
  return <p className="font-semibold text-coffee">{format(amount)}</p>;
}
