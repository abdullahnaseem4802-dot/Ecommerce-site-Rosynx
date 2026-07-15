"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Users, Search, Mail, Phone, Eye, Ban } from "lucide-react";
import { api, Customer } from "@/lib/api";
import { Card } from "@/components/ui";
import { useCached } from "@/lib/use-cached";

const money = (n: number) =>
  "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CustomersPage() {
  const router = useRouter();
  const { data: customers } = useCached("admin/customers", () =>
    api.get<Customer[]>("/admin/customers").catch(() => []),
  );
  const [q, setQ] = useState("");

  const filtered = useMemo(
    () =>
      (customers ?? []).filter(
        (c) =>
          c.name.toLowerCase().includes(q.toLowerCase()) ||
          c.email.toLowerCase().includes(q.toLowerCase()),
      ),
    [customers, q],
  );

  const stats = useMemo(() => {
    const list = customers ?? [];
    const withOrders = list.filter((c) => c.orders > 0).length;
    const spend = list.reduce((s, c) => s + c.totalSpent, 0);
    return {
      total: list.length,
      withOrders,
      avg: list.length ? spend / list.length : 0,
    };
  }, [customers]);

  return (
    <div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Customers", value: stats.total },
          { label: "With Orders", value: stats.withOrders },
          { label: "Avg. Spend", value: money(stats.avg) },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted">{s.label}</p>
              <p className="mt-2 text-2xl font-bold text-fg">{s.value}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="relative mt-5 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search customers…"
          className="w-full rounded-lg border border-line bg-panel-2 py-2 pl-9 pr-3 text-sm outline-none focus:border-copper"
        />
      </div>

      <Card className="mt-5 overflow-hidden">
        {!customers ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-12 rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Users className="text-muted" />
            <p className="text-sm text-muted">No customers yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Contact</th>
                  <th className="px-5 py-3 text-center font-medium">Orders</th>
                  <th className="px-5 py-3 text-right font-medium">Total Spent</th>
                  <th className="px-5 py-3 text-right font-medium">Joined</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/customers/${c.id}`)}
                    className="cursor-pointer hover:bg-panel-2/50"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={
                            "flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold " +
                            (c.isActive
                              ? "bg-copper/12 text-copper-dark"
                              : "bg-bad/12 text-bad")
                          }
                        >
                          {c.name.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="font-medium text-fg">{c.name}</span>
                          {!c.isActive && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-bad/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-bad">
                              <Ban size={11} /> Blocked
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted">
                      <div className="flex items-center gap-1.5">
                        <Mail size={13} /> {c.email}
                      </div>
                      {c.phone && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <Phone size={12} /> {c.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center font-medium text-fg">{c.orders}</td>
                    <td className="px-5 py-3 text-right font-semibold text-fg">{money(c.totalSpent)}</td>
                    <td className="px-5 py-3 text-right text-muted">
                      {new Date(c.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <Link
                          href={`/customers/${c.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-lg p-1.5 text-muted hover:bg-panel-2 hover:text-copper-light"
                          title="View customer"
                        >
                          <Eye size={15} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
