"use client";

import { use, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Ban,
  Check,
  CheckCircle2,
  MapPin,
  Package,
  Pencil,
} from "lucide-react";
import { api, CustomerDetail } from "@/lib/api";
import { Button, Card, Input, Modal, Spinner, StatusPill } from "@/components/ui";
import { useCached } from "@/lib/use-cached";

const money = (n: number) =>
  "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const longDate = (s: string) =>
  new Date(s).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: customer, reload: load } = useCached<CustomerDetail>(
    `admin/customers/${id}`,
    () => api.get<CustomerDetail>(`/admin/customers/${id}`),
  );

  // Edit details
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  // Block / unblock
  const [statusTarget, setStatusTarget] = useState<CustomerDetail | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");

  function openEdit(c: CustomerDetail) {
    setForm({ name: c.name, phone: c.phone ?? "" });
    setEditError("");
    setEditOpen(true);
  }

  async function saveDetails(e: React.FormEvent) {
    e.preventDefault();
    setEditError("");
    setSavingEdit(true);
    try {
      await api.patch(`/admin/customers/${id}`, {
        name: form.name,
        phone: form.phone || null,
      });
      setEditOpen(false);
      await load();
    } catch (err) {
      setEditError((err as Error).message);
    } finally {
      setSavingEdit(false);
    }
  }

  async function saveStatus(c: CustomerDetail) {
    setStatusError("");
    setSavingStatus(true);
    try {
      await api.patch(`/admin/customers/${id}/status`, { isActive: !c.isActive });
      setStatusTarget(null);
      await load();
    } catch (err) {
      setStatusError((err as Error).message);
    } finally {
      setSavingStatus(false);
    }
  }

  if (!customer) {
    return (
      <div>
        <Link
          href="/customers"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
        >
          <ArrowLeft size={15} /> Customers
        </Link>
        <div className="mt-5 space-y-4">
          <div className="skeleton h-16 rounded-2xl" />
          <div className="skeleton h-16 rounded-2xl" />
          <div className="skeleton h-16 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/customers"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"
      >
        <ArrowLeft size={15} /> Customers
      </Link>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="mt-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span
                className={
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold " +
                  (customer.isActive
                    ? "bg-copper/12 text-copper-dark"
                    : "bg-bad/12 text-bad")
                }
              >
                {customer.name.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight">
                    {customer.name}
                  </h1>
                  <span
                    className={
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide " +
                      (customer.isActive
                        ? "bg-good/15 text-good"
                        : "bg-bad/15 text-bad")
                    }
                  >
                    {customer.isActive ? (
                      <>
                        <CheckCircle2 size={11} /> Active
                      </>
                    ) : (
                      <>
                        <Ban size={11} /> Blocked
                      </>
                    )}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {customer.email}
                  {customer.phone && ` · ${customer.phone}`}
                </p>
                <p className="text-sm text-muted">
                  Joined {longDate(customer.joinedAt)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" onClick={() => openEdit(customer)}>
                <Pencil size={15} /> Edit details
              </Button>
              <Button
                variant={customer.isActive ? "danger" : "subtle"}
                onClick={() => {
                  setStatusError("");
                  setStatusTarget(customer);
                }}
              >
                {customer.isActive ? (
                  <>
                    <Ban size={15} /> Block
                  </>
                ) : (
                  <>
                    <Check size={15} /> Unblock
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Stat tiles */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        {[
          { label: "Orders", value: customer.ordersCount },
          { label: "Total Spent", value: money(customer.totalSpent) },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 + i * 0.06 }}
          >
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted">{s.label}</p>
              <p className="mt-2 text-2xl font-bold text-fg">{s.value}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Orders */}
      <h2 className="mt-6 text-xs font-medium uppercase tracking-wide text-muted">
        Orders ({customer.orders.length})
      </h2>
      <Card className="mt-2 overflow-hidden">
        {customer.orders.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Package className="text-muted" />
            <p className="text-sm text-muted">This customer has no orders yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Total</th>
                  <th className="px-5 py-3 text-right font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {customer.orders.map((o) => (
                  <tr key={o.orderNumber} className="hover:bg-panel-2/50">
                    <td className="px-5 py-3 font-mono text-xs font-medium text-fg">
                      {o.orderNumber}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill status={o.status} />
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-fg">
                      {money(o.total)}
                    </td>
                    <td className="px-5 py-3 text-right text-muted">
                      {longDate(o.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Addresses */}
      <h2 className="mt-6 text-xs font-medium uppercase tracking-wide text-muted">
        Addresses ({customer.addresses.length})
      </h2>
      {customer.addresses.length === 0 ? (
        <Card className="mt-2">
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <MapPin className="text-muted" />
            <p className="text-sm text-muted">No saved addresses.</p>
          </div>
        </Card>
      ) : (
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {customer.addresses.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-fg">
                  {a.label ?? "Address"}
                </p>
                {a.isDefault && (
                  <span className="inline-flex rounded-full bg-copper/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-copper-dark">
                    Default
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-muted">
                {a.line1}
                {a.line2 && (
                  <>
                    <br />
                    {a.line2}
                  </>
                )}
                <br />
                {[a.city, a.state, a.postalCode].filter(Boolean).join(", ")}
                <br />
                {a.country}
              </p>
              {a.phone && <p className="mt-1 text-xs text-muted">{a.phone}</p>}
            </Card>
          ))}
        </div>
      )}

      {/* Edit details */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit details">
        <form onSubmit={saveDetails} className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="e.g. +92 300 1234567"
          />
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Email</span>
            <input
              value={customer.email}
              readOnly
              disabled
              className="w-full cursor-not-allowed rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm text-muted outline-none"
            />
            <span className="mt-1.5 block text-xs text-muted">
              Email is the customer&apos;s login identity and can&apos;t be changed here.
            </span>
          </label>
          {editError && <p className="text-sm text-bad">{editError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={savingEdit}>
              {savingEdit ? <Spinner /> : null}
              Save changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Block / Unblock confirm */}
      <Modal
        open={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        title={statusTarget?.isActive ? "Block customer" : "Unblock customer"}
      >
        <p className="text-sm text-muted">
          {statusTarget?.isActive ? (
            <>
              Block <span className="font-medium text-fg">{statusTarget?.name}</span>?
              They won&apos;t be able to log in, but their orders, addresses and data
              are kept. You can unblock them at any time.
            </>
          ) : (
            <>
              Unblock <span className="font-medium text-fg">{statusTarget?.name}</span>
              ? They&apos;ll be able to log in again with their existing password.
            </>
          )}
        </p>
        {statusError && <p className="mt-3 text-sm text-bad">{statusError}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setStatusTarget(null)}>
            Cancel
          </Button>
          <Button
            variant={statusTarget?.isActive ? "danger" : "primary"}
            disabled={savingStatus}
            onClick={() => statusTarget && saveStatus(statusTarget)}
          >
            {savingStatus ? <Spinner /> : statusTarget?.isActive ? <Ban size={15} /> : <Check size={15} />}
            {statusTarget?.isActive ? "Block" : "Unblock"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
