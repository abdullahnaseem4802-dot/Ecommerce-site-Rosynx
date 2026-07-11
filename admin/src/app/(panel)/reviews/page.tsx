"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Check, X, Trash2, MessageSquare } from "lucide-react";
import { api, AdminReview } from "@/lib/api";
import { Button, Card } from "@/components/ui";
import { useCached } from "@/lib/use-cached";

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={13}
          className={i < n ? "fill-copper text-copper" : "text-line"}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const { data: reviews, setData: setReviews } = useCached(
    "admin/reviews",
    () => api.get<AdminReview[]>("/admin/reviews").catch(() => []),
  );
  const [filter, setFilter] = useState<"all" | "approved" | "pending">("all");

  async function toggle(r: AdminReview) {
    await api.patch(`/admin/reviews/${r.id}`, { isApproved: !r.isApproved });
    setReviews((prev) =>
      prev ? prev.map((x) => (x.id === r.id ? { ...x, isApproved: !x.isApproved } : x)) : prev,
    );
  }
  async function del(r: AdminReview) {
    await api.del(`/admin/reviews/${r.id}`);
    setReviews((prev) => (prev ? prev.filter((x) => x.id !== r.id) : prev));
  }

  const list = (reviews ?? []).filter((r) =>
    filter === "all" ? true : filter === "approved" ? r.isApproved : !r.isApproved,
  );

  return (
    <div>
      <div className="mb-5 flex gap-2">
        {(["all", "approved", "pending"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={
              "rounded-full px-4 py-1.5 text-sm font-medium capitalize transition " +
              (filter === f
                ? "bg-copper text-white"
                : "border border-line text-muted hover:text-fg")
            }
          >
            {f}
          </button>
        ))}
      </div>

      {!reviews ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-16 text-center">
          <MessageSquare className="text-muted" />
          <p className="text-sm text-muted">No {filter === "all" ? "" : filter} reviews.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Stars n={r.rating} />
                      <span className="text-xs text-muted">on</span>
                      <span className="truncate text-sm font-semibold text-fg">{r.product}</span>
                      {!r.isApproved && (
                        <span className="rounded-full bg-warn/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-warn">
                          pending
                        </span>
                      )}
                    </div>
                    {r.title && <p className="mt-1.5 text-sm font-medium text-fg">{r.title}</p>}
                    {r.body && <p className="mt-0.5 text-sm text-muted">{r.body}</p>}
                    <p className="mt-1.5 text-xs text-muted">
                      by {r.author} · {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button variant={r.isApproved ? "subtle" : "primary"} onClick={() => toggle(r)}>
                      {r.isApproved ? <X size={14} /> : <Check size={14} />}
                      {r.isApproved ? "Unapprove" : "Approve"}
                    </Button>
                    <Button variant="danger" onClick={() => del(r)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
