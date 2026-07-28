"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Store, User } from "lucide-react";
import { api, Coupon, StoreSettings } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button, Card, Input, Spinner } from "@/components/ui";

const CURRENCIES = ["USD", "PKR", "GBP", "EUR", "AED", "SAR"];

interface StoreForm {
  storeName: string;
  supportEmail: string;
  contactPhone: string;
  whatsapp: string;
  addressLine: string;
  baseCurrency: string;
  freeShipping: boolean;
  freeShippingThreshold: string;
  flatShipping: string;
  codEnabled: boolean;
  bankTransferEnabled: boolean;
  cardEnabled: boolean;
  bankDetails: string;
  welcomeCouponCode: string;
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-copper"
      />
      {label}
    </label>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [store, setStore] = useState<StoreForm | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [savingStore, setSavingStore] = useState(false);
  const [storeMsg, setStoreMsg] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  useEffect(() => {
    api.get<StoreSettings>("/settings").then((s) =>
      setStore({
        storeName: s.storeName ?? "",
        supportEmail: s.supportEmail ?? "",
        contactPhone: s.contactPhone ?? "",
        whatsapp: s.whatsapp ?? "",
        addressLine: s.addressLine ?? "",
        baseCurrency: s.baseCurrency ?? "USD",
        freeShipping: s.freeShipping,
        freeShippingThreshold: String((s.freeShippingThresholdCents ?? 0) / 100),
        flatShipping: String((s.flatShippingCents ?? 0) / 100),
        codEnabled: s.codEnabled,
        bankTransferEnabled: s.bankTransferEnabled,
        cardEnabled: s.cardEnabled,
        bankDetails: s.bankDetails ?? "",
        welcomeCouponCode: s.welcomeCouponCode ?? "",
      }),
    );
    api
      .get<Coupon[]>("/coupons")
      .then(setCoupons)
      .catch(() => setCoupons([]));
  }, []);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (next.length < 8) {
      setMsg({ ok: false, text: "New password must be at least 8 characters." });
      return;
    }
    setSaving(true);
    try {
      await api.patch("/auth/password", { currentPassword: current, newPassword: next });
      setMsg({ ok: true, text: "Password changed successfully." });
      setCurrent("");
      setNext("");
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  async function saveStore(e: React.FormEvent) {
    e.preventDefault();
    if (!store) return;
    setStoreMsg(null);
    setSavingStore(true);
    try {
      await api.patch("/admin/settings", {
        storeName: store.storeName || undefined,
        supportEmail: store.supportEmail || undefined,
        contactPhone: store.contactPhone || undefined,
        whatsapp: store.whatsapp || undefined,
        addressLine: store.addressLine || undefined,
        baseCurrency: store.baseCurrency,
        freeShipping: store.freeShipping,
        freeShippingThresholdCents: Math.round(
          parseFloat(store.freeShippingThreshold || "0") * 100,
        ),
        flatShippingCents: Math.round(
          parseFloat(store.flatShipping || "0") * 100,
        ),
        codEnabled: store.codEnabled,
        bankTransferEnabled: store.bankTransferEnabled,
        cardEnabled: store.cardEnabled,
        bankDetails: store.bankDetails || undefined,
        welcomeCouponCode: store.welcomeCouponCode,
      });
      setStoreMsg({ ok: true, text: "Store settings saved." });
    } catch (err) {
      setStoreMsg({ ok: false, text: (err as Error).message });
    } finally {
      setSavingStore(false);
    }
  }

  function up<K extends keyof StoreForm>(key: K, value: StoreForm[K]) {
    setStore((s) => (s ? { ...s, [key]: value } : s));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Admin profile */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <User size={16} className="text-copper" />
            <h2 className="text-sm font-semibold text-fg">Admin Profile</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-copper/12 text-lg font-semibold text-copper-dark">
              {user?.name.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <p className="font-semibold text-fg">{user?.name}</p>
              <p className="text-sm text-muted">{user?.email}</p>
              <span className="mt-1 inline-block rounded-full bg-copper/12 px-2 py-0.5 text-[11px] font-semibold uppercase text-copper-dark">
                {user?.role}
              </span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Change password */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Lock size={16} className="text-copper" />
            <h2 className="text-sm font-semibold text-fg">Change Password</h2>
          </div>
          <form onSubmit={changePassword} className="grid gap-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">Current password</span>
              <input
                type={show ? "text" : "password"}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
                className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm outline-none focus:border-copper"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">New password</span>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  required
                  className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2 pr-10 text-sm outline-none focus:border-copper"
                />
                <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted hover:bg-line">
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </label>
            {msg && (
              <p className={`text-sm ${msg.ok ? "text-good" : "text-bad"}`}>{msg.text}</p>
            )}
            <div>
              <Button type="submit" disabled={saving}>
                {saving ? <Spinner /> : <Lock size={15} />}
                Update password
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>

      {/* Store details */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="lg:col-span-2"
      >
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Store size={16} className="text-copper" />
            <h2 className="text-sm font-semibold text-fg">Store Details</h2>
          </div>
          {!store ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <form onSubmit={saveStore} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Store name"
                  value={store.storeName}
                  onChange={(e) => up("storeName", e.target.value)}
                />
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-muted">
                    Base currency
                  </span>
                  <select
                    value={store.baseCurrency}
                    onChange={(e) => up("baseCurrency", e.target.value)}
                    className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm outline-none focus:border-copper"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <Input
                  label="Support email"
                  type="email"
                  value={store.supportEmail}
                  onChange={(e) => up("supportEmail", e.target.value)}
                />
                <Input
                  label="Contact phone"
                  value={store.contactPhone}
                  onChange={(e) => up("contactPhone", e.target.value)}
                />
                <Input
                  label="WhatsApp"
                  value={store.whatsapp}
                  onChange={(e) => up("whatsapp", e.target.value)}
                />
                <Input
                  label="Address line"
                  value={store.addressLine}
                  onChange={(e) => up("addressLine", e.target.value)}
                />
              </div>

              <div className="border-t border-line pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                  Shipping
                </p>
                <Toggle
                  checked={store.freeShipping}
                  onChange={(v) => up("freeShipping", v)}
                  label="Free shipping enabled"
                />
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Free shipping threshold ($)"
                    type="number"
                    step="0.01"
                    value={store.freeShippingThreshold}
                    onChange={(e) =>
                      up("freeShippingThreshold", e.target.value)
                    }
                  />
                  <Input
                    label="Flat shipping ($)"
                    type="number"
                    step="0.01"
                    value={store.flatShipping}
                    onChange={(e) => up("flatShipping", e.target.value)}
                  />
                </div>
              </div>

              <div className="border-t border-line pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                  Payment methods
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <Toggle
                    checked={store.codEnabled}
                    onChange={(v) => up("codEnabled", v)}
                    label="Cash on delivery"
                  />
                  <Toggle
                    checked={store.bankTransferEnabled}
                    onChange={(v) => up("bankTransferEnabled", v)}
                    label="Bank transfer"
                  />
                  <Toggle
                    checked={store.cardEnabled}
                    onChange={(v) => up("cardEnabled", v)}
                    label="Card"
                  />
                </div>
                <label className="mt-3 block">
                  <span className="mb-1.5 block text-xs font-medium text-muted">
                    Bank details (shown to customers for bank transfer)
                  </span>
                  <textarea
                    value={store.bankDetails}
                    onChange={(e) => up("bankDetails", e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm text-fg outline-none transition focus:border-copper focus:ring-2 focus:ring-copper/20"
                  />
                </label>
              </div>

              <div className="border-t border-line pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                  Newsletter
                </p>
                <label className="block sm:max-w-sm">
                  <span className="mb-1.5 block text-xs font-medium text-muted">
                    Welcome coupon
                  </span>
                  <select
                    value={store.welcomeCouponCode}
                    onChange={(e) => up("welcomeCouponCode", e.target.value)}
                    className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm outline-none focus:border-copper"
                  >
                    <option value="">— Any active coupon —</option>
                    {store.welcomeCouponCode &&
                      !coupons.some((c) => c.code === store.welcomeCouponCode) && (
                        <option value={store.welcomeCouponCode}>
                          {store.welcomeCouponCode}
                        </option>
                      )}
                    {coupons.map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.code}
                      </option>
                    ))}
                  </select>
                  <span className="mt-1.5 block text-xs text-muted">
                    Emailed to new newsletter subscribers. Leave as &ldquo;Any
                    active coupon&rdquo; to auto-pick.
                  </span>
                </label>
              </div>

              {storeMsg && (
                <p className={`text-sm ${storeMsg.ok ? "text-good" : "text-bad"}`}>
                  {storeMsg.text}
                </p>
              )}
              <div>
                <Button type="submit" disabled={savingStore}>
                  {savingStore ? <Spinner /> : <Store size={15} />}
                  Save settings
                </Button>
              </div>
            </form>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
