"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Search, Check, Pencil } from "lucide-react";
import { api, InventoryStats, Paginated, Product } from "@/lib/api";
import { Card } from "@/components/ui";
import { useCached } from "@/lib/use-cached";

const money = (n: number) => "$" + n.toLocaleString(undefined, { maximumFractionDigits: 0 });

const stockBadge: Record<string, string> = {
  in: "bg-good/12 text-good",
  low: "bg-warn/15 text-warn",
  out: "bg-bad/12 text-bad",
};

export default function InventoryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const { data, reload: load } = useCached(
    `inventory/products?page=${page}&search=${search}`,
    () => {
      const q = new URLSearchParams({ page: String(page), limit: "12" });
      if (search) q.set("search", search);
      return api.get<Paginated<Product>>(`/products?${q}`);
    },
  );
  const { data: stats, reload: reloadStats } = useCached(
    "admin/inventory-stats",
    () => api.get<InventoryStats>("/admin/inventory-stats").catch(() => null),
  );

  async function saveStock(p: Product) {
    const qty = Math.max(0, parseInt(draft || "0", 10));
    await api.patch(`/products/${p.id}`, { stockQty: qty });
    setEditing(null);
    await load();
    reloadStats();
  }

  const cards = [
    { label: "Total Products", value: stats?.totalProducts ?? "—" },
    { label: "Total Stock", value: stats ? stats.totalStock.toLocaleString() : "—" },
    { label: "Low Stock", value: stats?.lowStock ?? "—", accent: "text-warn" },
    { label: "Out of Stock", value: stats?.outOfStock ?? "—", accent: "text-bad" },
    { label: "Stock Value", value: stats ? money(stats.stockValue) : "—", accent: "text-good" },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted">{c.label}</p>
              <p className={`mt-2 text-xl font-bold ${c.accent ?? "text-fg"}`}>{c.value}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="relative mt-5 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Search products…"
          className="w-full rounded-lg border border-line bg-panel-2 py-2 pl-9 pr-3 text-sm outline-none focus:border-copper"
        />
      </div>

      <Card className="mt-5 overflow-hidden">
        {!data ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-12 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-5 py-3 font-medium">SKU</th>
                  <th className="px-5 py-3 text-center font-medium">Stock</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.items.map((p) => (
                  <tr key={p.id} className="hover:bg-panel-2/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-panel-2">
                          {p.image && <Image src={p.image} alt="" fill sizes="36px" className="object-cover" />}
                        </div>
                        <span className="font-medium text-fg">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted">{p.sku ?? "—"}</td>
                    <td className="px-5 py-3 text-center">
                      {editing === p.id ? (
                        <input
                          autoFocus
                          type="number"
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && saveStock(p)}
                          className="w-20 rounded-lg border border-copper bg-panel-2 px-2 py-1 text-center text-sm outline-none"
                        />
                      ) : (
                        <span className="font-semibold text-fg">{p.stockQty}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${stockBadge[p.stockStatus]}`}>
                        {p.stockStatus === "in" ? "In stock" : p.stockStatus === "low" ? "Low" : "Out"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {editing === p.id ? (
                        <button onClick={() => saveStock(p)} className="rounded-lg bg-copper px-2.5 py-1.5 text-white">
                          <Check size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setEditing(p.id);
                            setDraft(String(p.stockQty));
                          }}
                          className="rounded-lg p-1.5 text-muted hover:bg-panel-2 hover:text-copper"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {data && data.pages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-2 text-sm">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-line px-3 py-1.5 disabled:opacity-40">
            Prev
          </button>
          <span className="text-muted">{page} / {data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-line px-3 py-1.5 disabled:opacity-40">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
