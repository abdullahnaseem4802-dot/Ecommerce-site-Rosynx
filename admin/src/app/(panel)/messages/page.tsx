"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Trash2, Eye } from "lucide-react";
import { api, ContactMessage } from "@/lib/api";
import { Button, Card, Modal } from "@/components/ui";
import { useCached } from "@/lib/use-cached";

export default function MessagesPage() {
  const {
    data: items,
    reload: load,
    setData: setItems,
  } = useCached("admin/contact", () =>
    api.get<ContactMessage[]>("/admin/contact"),
  );
  const [open, setOpen] = useState<ContactMessage | null>(null);
  const [confirmDel, setConfirmDel] = useState<ContactMessage | null>(null);

  async function openMessage(m: ContactMessage) {
    setOpen(m);
    if (!m.isRead) {
      try {
        await api.patch(`/admin/contact/${m.id}`, { isRead: true });
        setItems((list) =>
          list
            ? list.map((x) => (x.id === m.id ? { ...x, isRead: true } : x))
            : list,
        );
      } catch {
        /* ignore */
      }
    }
  }

  async function del(m: ContactMessage) {
    await api.del(`/admin/contact/${m.id}`);
    setConfirmDel(null);
    setOpen(null);
    await load();
  }

  const unread = items?.filter((m) => !m.isRead).length ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
      <p className="mt-1 text-sm text-muted">
        {items ? `${items.length} messages · ${unread} unread` : "Loading…"}
      </p>

      <div className="mt-5 space-y-3">
        {!items
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-2xl" />
            ))
          : items.length === 0
            ? (
              <p className="text-sm text-muted">No messages yet.</p>
            )
            : items.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (i % 12) * 0.03 }}
                  onClick={() => openMessage(m)}
                >
                  <Card
                    className={
                      "flex cursor-pointer items-start gap-3 p-4 transition hover:border-copper/40 " +
                      (m.isRead ? "" : "border-copper/40 bg-copper/[0.03]")
                    }
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-copper/15 text-copper-light">
                      <Mail size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {!m.isRead && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-copper" />
                        )}
                        <p
                          className={
                            "truncate text-sm " +
                            (m.isRead ? "font-medium" : "font-semibold")
                          }
                        >
                          {m.subject || "(no subject)"}
                        </p>
                      </div>
                      <p className="truncate text-xs text-muted">
                        {m.name} · {m.email}
                      </p>
                      <p className="mt-1 line-clamp-1 text-xs text-muted">
                        {m.message}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-[11px] text-muted">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openMessage(m);
                        }}
                        className="rounded-lg p-1.5 text-muted hover:bg-panel-2 hover:text-copper-light"
                        title="View message"
                      >
                        <Eye size={15} />
                      </button>
                    </div>
                  </Card>
                </motion.div>
              ))}
      </div>

      {/* Detail */}
      <Modal
        open={!!open}
        onClose={() => setOpen(null)}
        title={open?.subject || "Message"}
      >
        {open && (
          <div className="space-y-3">
            <div className="text-sm">
              <p className="font-medium text-fg">{open.name}</p>
              <p className="text-muted">{open.email}</p>
              <p className="text-[11px] text-muted">
                {new Date(open.createdAt).toLocaleString()}
              </p>
            </div>
            <p className="whitespace-pre-wrap rounded-lg bg-panel-2 p-3 text-sm text-fg">
              {open.message}
            </p>
            <div className="flex justify-between pt-2">
              <Button
                variant="danger"
                onClick={() => setConfirmDel(open)}
              >
                <Trash2 size={15} /> Delete
              </Button>
              <Button variant="ghost" onClick={() => setOpen(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        title="Delete message"
      >
        <p className="text-sm text-muted">
          Delete this message from{" "}
          <span className="font-medium text-fg">{confirmDel?.name}</span>? This
          cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmDel(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => confirmDel && del(confirmDel)}>
            <Trash2 size={15} /> Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
