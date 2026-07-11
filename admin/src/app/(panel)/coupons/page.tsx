"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, TicketPercent } from "lucide-react";
import { api, Coupon } from "@/lib/api";
import { Button, Card, Input, Modal, Spinner } from "@/components/ui";
import { useCached } from "@/lib/use-cached";

interface Form {
  id?: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: string;
  minSubtotal: string;
  isActive: boolean;
}
const empty: Form = {
  code: "",
  type: "PERCENT",
  value: "",
  minSubtotal: "",
  isActive: true,
};

export default function CouponsPage() {
  const { data: coupons, reload: load } = useCached("coupons", () =>
    api.get<Coupon[]>("/coupons"),
  );
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function openCreate() {
    setForm(empty);
    setError("");
    setOpen(true);
  }
  function openEdit(c: Coupon) {
    setForm({
      id: c.id,
      code: c.code,
      type: c.type,
      value: c.type === "FIXED" ? String(c.value / 100) : String(c.value),
      minSubtotal: c.minSubtotalCents ? String(c.minSubtotalCents / 100) : "",
      isActive: c.isActive,
    });
    setError("");
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        code: form.code,
        type: form.type,
        value:
          form.type === "FIXED"
            ? Math.round(parseFloat(form.value || "0") * 100)
            : Math.round(parseFloat(form.value || "0")),
        minSubtotalCents: form.minSubtotal
          ? Math.round(parseFloat(form.minSubtotal) * 100)
          : 0,
        isActive: form.isActive,
      };
      if (form.id) await api.patch(`/coupons/${form.id}`, payload);
      else await api.post("/coupons", payload);
      setOpen(false);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function del(c: Coupon) {
    await api.del(`/coupons/${c.id}`);
    await load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Coupons</h1>
          <p className="mt-1 text-sm text-muted">Discount codes</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> New coupon
        </Button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {!coupons
          ? Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-2xl" />
            ))
          : coupons.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="flex items-center gap-4 p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-copper/15 text-copper-light">
                    <TicketPercent size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-mono text-sm font-semibold">{c.code}</p>
                    <p className="text-xs text-muted">
                      {c.type === "PERCENT"
                        ? `${c.value}% off`
                        : `$${c.value / 100} off`}
                      {c.minSubtotalCents
                        ? ` · min $${c.minSubtotalCents / 100}`
                        : ""}
                      {" · "}
                      <span className={c.isActive ? "text-good" : "text-bad"}>
                        {c.isActive ? "active" : "inactive"}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => openEdit(c)}
                    className="rounded-lg p-1.5 text-muted hover:bg-panel-2 hover:text-copper-light"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => del(c)}
                    className="rounded-lg p-1.5 text-muted hover:bg-bad/10 hover:text-bad"
                  >
                    <Trash2 size={15} />
                  </button>
                </Card>
              </motion.div>
            ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? "Edit coupon" : "New coupon"}>
        <form onSubmit={save} className="space-y-4">
          <Input
            label="Code"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">Type</span>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as "PERCENT" | "FIXED" })
                }
                className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm outline-none focus:border-copper"
              >
                <option value="PERCENT">Percent %</option>
                <option value="FIXED">Fixed $</option>
              </select>
            </label>
            <Input
              label={form.type === "PERCENT" ? "Value (%)" : "Value ($)"}
              type="number"
              step="0.01"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              required
            />
          </div>
          <Input
            label="Min. subtotal ($, optional)"
            type="number"
            step="0.01"
            value={form.minSubtotal}
            onChange={(e) => setForm({ ...form, minSubtotal: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="accent-copper"
            />
            Active
          </label>
          {error && <p className="text-sm text-bad">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner /> : null}
              {form.id ? "Save" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
