"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Trash2 } from "lucide-react";
import { api, Subscriber } from "@/lib/api";
import { Button, Card, Modal, Spinner } from "@/components/ui";
import { useCached } from "@/lib/use-cached";

interface SubscriberList {
  items: Subscriber[];
  total: number;
}

export default function SubscribersPage() {
  const { data, reload: load } = useCached("admin/subscribers", () =>
    api.get<SubscriberList>("/admin/subscribers"),
  );
  const [confirmDel, setConfirmDel] = useState<Subscriber | null>(null);

  async function del(s: Subscriber) {
    await api.del(`/admin/subscribers/${s.id}`);
    setConfirmDel(null);
    await load();
  }

  function exportCsv() {
    if (!data) return;
    const rows = [
      "email,subscribed_at",
      ...data.items.map(
        (s) => `${s.email},${new Date(s.createdAt).toISOString()}`,
      ),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Subscribers</h1>
          <p className="mt-1 text-sm text-muted">
            {data ? `${data.total} subscribers` : "Loading…"}
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={exportCsv}
          disabled={!data || data.items.length === 0}
        >
          <Download size={16} /> Export CSV
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-5"
      >
        <Card className="overflow-hidden">
          {!data ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : data.items.length === 0 ? (
            <p className="p-6 text-sm text-muted">No subscribers yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Subscribed</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-line/60 last:border-0 hover:bg-panel-2/50"
                    >
                      <td className="px-4 py-3 font-medium text-fg">
                        {s.email}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setConfirmDel(s)}
                          className="rounded-lg p-1.5 text-muted hover:bg-bad/10 hover:text-bad"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>

      <Modal
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        title="Remove subscriber"
      >
        <p className="text-sm text-muted">
          Remove{" "}
          <span className="font-medium text-fg">{confirmDel?.email}</span> from
          the list?
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmDel(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => confirmDel && del(confirmDel)}>
            <Trash2 size={15} /> Remove
          </Button>
        </div>
      </Modal>
    </div>
  );
}
