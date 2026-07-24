"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ChevronRight, LifeBuoy, Lock, Send } from "lucide-react";
import { api, type Ticket } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { refreshSupportUnread } from "@/lib/use-support-unread";
import { AccountShell } from "@/components/account/account-shell";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const statusColor: Record<Ticket["status"], string> = {
  OPEN: "bg-amber-500/15 text-amber-600",
  ANSWERED: "bg-newtag/15 text-newtag",
  CLOSED: "bg-cream-card text-muted",
};

function Pill({ status }: { status: Ticket["status"] }) {
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium capitalize",
        statusColor[status],
      )}
    >
      {status.toLowerCase()}
    </span>
  );
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function SupportPage() {
  const user = useAuth((s) => s.user);
  const ready = useAuth((s) => s.ready);
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [active, setActive] = useState<Ticket | null>(null);

  useEffect(() => {
    if (!user) return;
    api
      .myTickets()
      .then(setTickets)
      .catch(() => setTickets([]));
  }, [user]);

  /** Open a thread, refreshing it so the customer sees the newest replies. */
  const openTicket = (t: Ticket) => {
    setActive(t);
    api
      .getTicket(t.id)
      .then((fresh) => {
        setActive((cur) => (cur?.id === fresh.id ? fresh : cur));
        setTickets((list) =>
          list ? list.map((x) => (x.id === fresh.id ? fresh : x)) : list,
        );
        // Opening the thread clears its unread flag server-side — refresh the
        // header/sidebar badge so it drops immediately.
        refreshSupportUnread();
      })
      .catch(() => {
        /* keep the copy we already have from the list */
      });
  };

  const onReplied = (fresh: Ticket) => {
    setActive(fresh);
    setTickets((list) =>
      list ? list.map((x) => (x.id === fresh.id ? fresh : x)) : list,
    );
  };

  return (
    <AccountShell title="Support">
      {!ready || (user && tickets === null) ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-cream-card" />
          ))}
        </div>
      ) : active ? (
        <Thread
          ticket={active}
          onBack={() => setActive(null)}
          onReplied={onReplied}
        />
      ) : !tickets || tickets.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-white py-16 text-center">
          <LifeBuoy className="h-8 w-8 text-brand" />
          <p className="mt-3 text-sm text-muted">No support enquiries yet.</p>
          <Link
            href="/contact"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            Contact Us
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => openTicket(t)}
              className="flex w-full items-center gap-4 rounded-2xl border border-line/60 bg-white p-5 text-left transition hover:border-brand"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="truncate font-semibold text-coffee">
                    {t.subject?.trim() || "Support enquiry"}
                  </p>
                  <Pill status={t.status} />
                </div>
                <p className="mt-1 truncate text-sm text-muted">{t.message}</p>
                <p className="mt-1 text-xs text-muted">
                  {formatWhen(t.createdAt)} ·{" "}
                  {t.replies.length === 1
                    ? "1 reply"
                    : `${t.replies.length} replies`}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
            </button>
          ))}
        </div>
      )}
    </AccountShell>
  );
}

function Thread({
  ticket,
  onBack,
  onReplied,
}: {
  ticket: Ticket;
  onBack: () => void;
  onReplied: (t: Ticket) => void;
}) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const closed = ticket.status === "CLOSED";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const fresh = await api.replyToTicket(ticket.id, text);
      onReplied(fresh);
      setBody("");
      toast.success("Reply sent");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't send your reply",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-coffee transition hover:text-brand"
      >
        <ArrowLeft className="h-4 w-4" /> All enquiries
      </button>

      <div className="overflow-hidden rounded-2xl border border-line/60 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 bg-cream-soft px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate font-serif text-lg font-bold text-espresso">
              {ticket.subject?.trim() || "Support enquiry"}
            </h2>
            <p className="text-xs text-muted">{formatWhen(ticket.createdAt)}</p>
          </div>
          <Pill status={ticket.status} />
        </div>

        <div className="space-y-4 p-5">
          <Bubble
            fromAdmin={false}
            author="You"
            body={ticket.message}
            at={ticket.createdAt}
          />
          <AnimatePresence initial={false}>
            {ticket.replies.map((r) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <Bubble
                  fromAdmin={r.fromAdmin}
                  author={r.authorName}
                  body={r.body}
                  at={r.createdAt}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {closed ? (
          <div className="flex items-center justify-center gap-2 border-t border-line/60 bg-cream-soft px-5 py-4 text-sm text-muted">
            <Lock className="h-4 w-4" />
            This enquiry is closed.{" "}
            <Link href="/contact" className="font-medium text-brand hover:underline">
              Start a new one
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="border-t border-line/60 p-5">
            <label
              htmlFor="reply"
              className="mb-1.5 block text-sm font-medium text-coffee"
            >
              Reply
            </label>
            <textarea
              id="reply"
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your message…"
              className="w-full rounded-xl border border-line bg-cream-soft px-4 py-3 text-sm focus:border-brand focus:outline-none"
            />
            <button
              type="submit"
              disabled={sending || !body.trim()}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {sending ? "Sending…" : "Send Reply"}
            </button>
          </form>
        )}
      </div>
    </motion.div>
  );
}

function Bubble({
  fromAdmin,
  author,
  body,
  at,
}: {
  fromAdmin: boolean;
  author: string;
  body: string;
  at: string;
}) {
  return (
    <div className={cn("flex", fromAdmin ? "justify-start" : "justify-end")}>
      <div className={cn("max-w-[85%]", fromAdmin ? "text-left" : "text-right")}>
        <p className="mb-1 text-xs font-medium text-muted">
          {/* authorName already carries "ROSYNX Support" for admin replies —
              don't append it again. */}
          {author}
        </p>
        <div
          className={cn(
            "rounded-card px-4 py-3 text-left text-sm whitespace-pre-wrap",
            fromAdmin
              ? "bg-brand/10 text-coffee"
              : "bg-cream-card text-coffee",
          )}
        >
          {body}
        </div>
        <p className="mt-1 text-xs text-muted">{formatWhen(at)}</p>
      </div>
    </div>
  );
}
