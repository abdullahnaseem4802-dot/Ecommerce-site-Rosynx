"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, HelpCircle } from "lucide-react";
import { api, FaqItem } from "@/lib/api";
import { Button, Card, Input, Modal, Spinner } from "@/components/ui";
import { useCached } from "@/lib/use-cached";

interface FormState {
  id?: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: string;
  isPublished: boolean;
}

const empty: FormState = {
  question: "",
  answer: "",
  category: "General",
  sortOrder: "",
  isPublished: true,
};

export default function FaqPage() {
  const { data: faqs, reload: load } = useCached("admin/faqs", () =>
    api.get<FaqItem[]>("/admin/faqs"),
  );
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDel, setConfirmDel] = useState<FaqItem | null>(null);

  function openCreate() {
    setForm(empty);
    setError("");
    setOpen(true);
  }
  function openEdit(f: FaqItem) {
    setForm({
      id: f.id,
      question: f.question,
      answer: f.answer,
      category: f.category ?? "General",
      sortOrder: f.sortOrder != null ? String(f.sortOrder) : "",
      isPublished: f.isPublished,
    });
    setError("");
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        question: form.question,
        answer: form.answer,
        category: form.category || undefined,
        sortOrder: form.sortOrder ? parseInt(form.sortOrder, 10) : undefined,
        isPublished: form.isPublished,
      };
      if (form.id) await api.patch(`/admin/faqs/${form.id}`, payload);
      else await api.post("/admin/faqs", payload);
      setOpen(false);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function del(f: FaqItem) {
    await api.del(`/admin/faqs/${f.id}`);
    setConfirmDel(null);
    await load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">FAQs</h1>
          <p className="mt-1 text-sm text-muted">
            {faqs ? `${faqs.length} questions` : "Loading…"}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> New FAQ
        </Button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {!faqs
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-2xl" />
            ))
          : faqs.length === 0
            ? (
              <p className="text-sm text-muted">No FAQs yet.</p>
            )
            : faqs.map((f, i) => (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (i % 12) * 0.03 }}
                  whileHover={{ y: -3 }}
                >
                  <Card className="flex items-start gap-3 p-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-copper/15 text-copper-light">
                      <HelpCircle size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{f.question}</p>
                      <p className="truncate text-xs text-muted">{f.answer}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wide text-muted">
                          {f.category || "General"}
                        </span>
                        <span
                          className={
                            "inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase " +
                            (f.isPublished
                              ? "bg-good/15 text-good"
                              : "bg-panel-2 text-muted")
                          }
                        >
                          {f.isPublished ? "published" : "draft"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 self-start">
                      <button
                        onClick={() => openEdit(f)}
                        className="rounded-lg p-1.5 text-muted hover:bg-panel-2 hover:text-copper-light"
                        title="Edit FAQ"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setConfirmDel(f)}
                        className="rounded-lg p-1.5 text-muted hover:bg-bad/10 hover:text-bad"
                        title="Delete FAQ"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </Card>
                </motion.div>
              ))}
      </div>

      {/* Create / Edit */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? "Edit FAQ" : "New FAQ"}
      >
        <form
          onSubmit={save}
          className="max-h-[70vh] space-y-4 overflow-y-auto pr-1"
        >
          <Input
            label="Question"
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
            required
          />
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">
              Answer
            </span>
            <textarea
              value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
              rows={5}
              required
              className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm text-fg outline-none transition focus:border-copper focus:ring-2 focus:ring-copper/20"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="General"
            />
            <Input
              label="Sort order"
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) =>
                setForm({ ...form, isPublished: e.target.checked })
              }
              className="accent-copper"
            />
            Published
          </label>
          {error && <p className="text-sm text-bad">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner /> : null}
              {form.id ? "Save changes" : "Create FAQ"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        title="Delete FAQ"
      >
        <p className="text-sm text-muted">
          Delete{" "}
          <span className="font-medium text-fg">{confirmDel?.question}</span>?
          This cannot be undone.
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
