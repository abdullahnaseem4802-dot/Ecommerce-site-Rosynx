"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Trash2, Eye, Send, Lock, RotateCcw } from "lucide-react";
import { api, ContactMessage, TicketStatus } from "@/lib/api";
import { Button, Card, Modal, Spinner } from "@/components/ui";
import { useCached } from "@/lib/use-cached";

const STATUSES: TicketStatus[] = ["OPEN", "ANSWERED", "CLOSED"];

// `pillColors` in components/ui.tsx has no entries for ticket statuses, so all
// three would fall back to the same muted grey. Local map instead.
const ticketPill: Record<TicketStatus, string> = {
  OPEN: "bg-warn/15 text-warn",
  ANSWERED: "bg-good/15 text-good",
  CLOSED: "bg-panel-2 text-muted",
};

function TicketPill({ status }: { status: TicketStatus }) {
  return (
    <span
      className={
        "inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide " +
        ticketPill[status]
      }
    >
      {status}
    </span>
  );
}

export default function MessagesPage() {
  const {
    data: items,
    reload: load,
    setData: setItems,
  } = useCached("admin/contact", () =>
    api.get<ContactMessage[]>("/admin/contact"),
  );
  const [filter, setFilter] = useState<TicketStatus | "">("");
  const [open, setOpen] = useState<ContactMessage | null>(null);
  const [confirmDel, setConfirmDel] = useState<ContactMessage | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [closing, setClosing] = useState(false);

  /** Replace a ticket in the list and in the open modal, keeping both in sync. */
  function apply(updated: ContactMessage) {
    setItems((list) =>
      list ? list.map((x) => (x.id === updated.id ? updated : x)) : list,
    );
    setOpen((cur) => (cur && cur.id === updated.id ? updated : cur));
  }

  async function openMessage(m: ContactMessage) {
    setOpen(m);
    setReply("");
    setError("");
    if (!m.isRead) {
      try {
        await api.patch(`/admin/contact/${m.id}`, { isRead: true });
        setItems((list) =>
          list
            ? list.map((x) => (x.id === m.id ? { ...x, isRead: true } : x))
            : list,
        );
        setOpen((cur) => (cur && cur.id === m.id ? { ...cur, isRead: true } : cur));
      } catch {
        /* ignore */
      }
    }
  }

  async function sendReply(m: ContactMessage) {
    const body = reply.trim();
    if (!body) return;
    setSending(true);
    setError("");
    try {
      const updated = await api.post<ContactMessage>(
        `/admin/contact/${m.id}/reply`,
        { body },
      );
      apply(updated);
      setReply("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send the reply.");
    } finally {
      setSending(false);
    }
  }

  async function setStatus(m: ContactMessage, status: TicketStatus) {
    setClosing(true);
    setError("");
    try {
      const updated = await api.patch<ContactMessage>(`/admin/contact/${m.id}`, {
        status,
      });
      apply(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the ticket.");
    } finally {
      setClosing(false);
    }
  }

  async function del(m: ContactMessage) {
    await api.del(`/admin/contact/${m.id}`);
    setConfirmDel(null);
    setOpen(null);
    await load();
  }

  // The backend's GET /admin/contact takes no query params, so filter here and
  // keep a single cache key.
  const shown = items?.filter((m) => !filter || m.status === filter) ?? null;
  const openCount = items?.filter((m) => m.status === "OPEN").length ?? 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
          <p className="mt-1 text-sm text-muted">
            {items
              ? `${items.length} tickets · ${openCount} open`
              : "Loading…"}
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as TicketStatus | "")}
          className="rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm outline-none focus:border-copper"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 space-y-3">
        {!shown ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))
        ) : shown.length === 0 ? (
          <p className="text-sm text-muted">
            {filter ? "No tickets with this status." : "No messages yet."}
          </p>
        ) : (
          shown.map((m, i) => (
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
                    <TicketPill status={m.status} />
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
                  {m.replies.length > 0 && (
                    <span className="text-[11px] text-muted">
                      {m.replies.length}{" "}
                      {m.replies.length === 1 ? "reply" : "replies"}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openMessage(m);
                    }}
                    className="rounded-lg p-1.5 text-muted hover:bg-panel-2 hover:text-copper-light"
                    title="View ticket"
                  >
                    <Eye size={15} />
                  </button>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Ticket thread */}
      <Modal
        open={!!open}
        onClose={() => setOpen(null)}
        title={open?.subject || "Ticket"}
      >
        {open && (
          <div className="max-h-[70vh] space-y-4 overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm">
                <p className="font-medium text-fg">{open.name}</p>
                <p className="text-muted">{open.email}</p>
              </div>
              <TicketPill status={open.status} />
            </div>

            {/* Thread: original message, then every reply oldest-first */}
            <div className="space-y-3">
              <div className="rounded-lg border border-line bg-panel-2 p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-fg">
                    {open.name}
                  </span>
                  <span className="text-[11px] text-muted">
                    {new Date(open.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-fg">
                  {open.message}
                </p>
              </div>

              {open.replies.map((r) => (
                <div
                  key={r.id}
                  className={
                    "rounded-lg border p-3 " +
                    (r.fromAdmin
                      ? "ml-6 border-copper/30 bg-copper/[0.06]"
                      : "mr-6 border-line bg-panel-2")
                  }
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span
                      className={
                        "text-xs font-semibold " +
                        (r.fromAdmin ? "text-copper-light" : "text-fg")
                      }
                    >
                      {r.authorName}
                      {r.fromAdmin && (
                        <span className="ml-1.5 font-normal text-muted">
                          · Support
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] text-muted">
                      {new Date(r.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-fg">{r.body}</p>
                </div>
              ))}
            </div>

            {/* Reply box */}
            {open.status === "CLOSED" ? (
              <p className="rounded-lg border border-line bg-panel-2 p-3 text-xs text-muted">
                This ticket is closed. Reopen it to reply — the customer cannot
                reply to a closed ticket either.
              </p>
            ) : (
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted">
                  Reply to {open.name}
                </span>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={4}
                  placeholder="Type your reply…"
                  disabled={sending}
                  className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm text-fg outline-none transition focus:border-copper focus:ring-2 focus:ring-copper/20 disabled:opacity-50"
                />
              </label>
            )}

            {error && <p className="text-sm text-bad">{error}</p>}

            {open.status !== "CLOSED" && (
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] text-muted">
                  Sending also emails this reply to {open.email}.
                </p>
                <Button
                  onClick={() => sendReply(open)}
                  disabled={sending || !reply.trim()}
                >
                  {sending ? <Spinner /> : <Send size={15} />}
                  {sending ? "Sending…" : "Send reply"}
                </Button>
              </div>
            )}

            <div className="flex justify-between gap-2 border-t border-line pt-3">
              <Button variant="danger" onClick={() => setConfirmDel(open)}>
                <Trash2 size={15} /> Delete
              </Button>
              <div className="flex gap-2">
                {open.status === "CLOSED" ? (
                  <Button
                    variant="subtle"
                    disabled={closing}
                    onClick={() => setStatus(open, "OPEN")}
                  >
                    <RotateCcw size={15} /> Reopen
                  </Button>
                ) : (
                  <Button
                    variant="subtle"
                    disabled={closing}
                    onClick={() => setStatus(open, "CLOSED")}
                  >
                    <Lock size={15} /> Close ticket
                  </Button>
                )}
                <Button variant="ghost" onClick={() => setOpen(null)}>
                  Close
                </Button>
              </div>
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
