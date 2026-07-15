"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MapPin, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { AccountShell } from "@/components/account/account-shell";
import { api, type AddressInput, type ApiAddress } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Combobox } from "@/app/checkout/Combobox";
import { PhoneField, type DialOption } from "@/app/checkout/PhoneField";
import {
  cityOptions,
  countryOptions,
  dialOptions,
  stateOptions,
} from "@/app/checkout/location-data";

/**
 * Country/state are stored as *names* so they round-trip through the checkout
 * Comboboxes (whose options are `{ value: iso2, label: name }` and which select
 * by label). The same pickers are reused here to keep those names canonical.
 */
const isoForCountry = (name: string) =>
  countryOptions.find((o) => o.label === name)?.value ?? "";

const isoForState = (countryIso: string, name: string) =>
  countryIso && name
    ? (stateOptions(countryIso).find((o) => o.label === name)?.value ?? "")
    : "";

/** Split a stored "+92 300…" phone back into a dial ISO + local number. */
function splitPhone(value: string): { iso?: string; number: string } {
  const raw = value.trim();
  let best: DialOption | undefined;
  for (const d of dialOptions) {
    if (raw.startsWith(d.dialCode) && (!best || d.dialCode.length > best.dialCode.length)) {
      best = d;
    }
  }
  if (!best) return { number: raw };
  return { iso: best.isoCode, number: raw.slice(best.dialCode.length).trim() };
}

export default function AddressesPage() {
  const user = useAuth((s) => s.user);
  const [addresses, setAddresses] = useState<ApiAddress[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState<ApiAddress | null>(null);
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Signed-out visitors never see this content — AccountShell renders a gate.
  const loading = !!user && !loaded;

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    api
      .getAddresses()
      .then((list) => {
        if (!cancelled) setAddresses(list);
      })
      .catch((err: Error) => {
        if (!cancelled) toast.error("Couldn't load addresses", { description: err.message });
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const makeDefault = async (id: string) => {
    const prev = addresses;
    // optimistic — only one address can hold the default flag
    setAddresses((a) => a.map((x) => ({ ...x, isDefault: x.id === id })));
    setBusyId(id);
    try {
      await api.updateAddress(id, { isDefault: true });
      toast.success("Default address updated");
    } catch (err) {
      setAddresses(prev);
      toast.error("Couldn't set default", { description: (err as Error).message });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    const prev = addresses;
    setAddresses((a) => a.filter((x) => x.id !== id));
    setBusyId(id);
    try {
      await api.deleteAddress(id);
      toast.success("Address removed");
    } catch (err) {
      setAddresses(prev);
      toast.error("Couldn't remove address", { description: (err as Error).message });
    } finally {
      setBusyId(null);
    }
  };

  const onSaved = (saved: ApiAddress) => {
    setAddresses((a) => {
      const exists = a.some((x) => x.id === saved.id);
      const next = exists
        ? a.map((x) => (x.id === saved.id ? saved : x))
        : [...a, saved];
      // the server owns the default flag — mirror it locally
      return saved.isDefault
        ? next.map((x) => ({ ...x, isDefault: x.id === saved.id }))
        : next;
    });
    setEditing(null);
    setAdding(false);
  };

  return (
    <AccountShell title="Addresses">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-serif text-xl font-bold text-espresso">Saved Addresses</h2>
        <button
          onClick={() => {
            setEditing(null);
            setAdding(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          <Plus className="h-4 w-4" /> Add New
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-line/60 bg-white py-20">
          <Loader2 className="h-5 w-5 animate-spin text-brand" />
        </div>
      ) : addresses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white py-20 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cream-card text-brand">
            <MapPin className="h-7 w-7" />
          </span>
          <h3 className="mt-4 font-serif text-lg font-bold text-espresso">
            No saved addresses
          </h3>
          <p className="mt-1 text-sm text-muted">
            Add one to check out faster next time.
          </p>
          <button
            onClick={() => setAdding(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            <Plus className="h-4 w-4" /> Add Address
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <div
              key={a.id}
              className={cn(
                "rounded-2xl border bg-white p-5 transition",
                a.isDefault ? "border-brand" : "border-line/60",
                busyId === a.id && "opacity-60",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-coffee">
                  <MapPin className="h-4 w-4 text-brand" />
                  {a.label || "Address"}
                </span>
                {a.isDefault && (
                  <span className="rounded-full bg-brand/15 px-2.5 py-0.5 text-[11px] font-medium text-brand">
                    Default
                  </span>
                )}
              </div>
              <div className="mt-3 space-y-0.5 text-sm text-coffee/80">
                <p className="font-medium text-coffee">{a.line1}</p>
                {a.line2 && <p>{a.line2}</p>}
                <p>
                  {[a.city, a.state, a.country].filter(Boolean).join(", ")}
                  {a.postalCode ? ` ${a.postalCode}` : ""}
                </p>
                {a.phone && <p>{a.phone}</p>}
              </div>
              <div className="mt-4 flex items-center gap-3 text-xs">
                {!a.isDefault && (
                  <button
                    onClick={() => makeDefault(a.id)}
                    disabled={busyId === a.id}
                    className="inline-flex items-center gap-1 font-medium text-brand hover:underline disabled:opacity-60"
                  >
                    <Star className="h-3.5 w-3.5" /> Set default
                  </button>
                )}
                <button
                  onClick={() => {
                    setAdding(false);
                    setEditing(a);
                  }}
                  className="inline-flex items-center gap-1 font-medium text-coffee hover:text-brand"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => remove(a.id)}
                  disabled={busyId === a.id}
                  className="inline-flex items-center gap-1 font-medium text-muted hover:text-sale disabled:opacity-60"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {(adding || editing) && (
          <AddressDialog
            address={editing}
            isFirst={addresses.length === 0}
            onClose={() => {
              setAdding(false);
              setEditing(null);
            }}
            onSaved={onSaved}
          />
        )}
      </AnimatePresence>
    </AccountShell>
  );
}

function AddressDialog({
  address,
  isFirst,
  onClose,
  onSaved,
}: {
  address: ApiAddress | null;
  isFirst: boolean;
  onClose: () => void;
  onSaved: (a: ApiAddress) => void;
}) {
  const [label, setLabel] = useState(address?.label ?? "");
  const [line1, setLine1] = useState(address?.line1 ?? "");
  const [line2, setLine2] = useState(address?.line2 ?? "");
  const [city, setCity] = useState(address?.city ?? "");
  const [state, setState] = useState(address?.state ?? "");
  const [country, setCountry] = useState(address?.country ?? "");
  const [postal, setPostal] = useState(address?.postalCode ?? "");

  const initialIso = isoForCountry(address?.country ?? "");
  const [countryIso, setCountryIso] = useState(initialIso);
  const [stateIso, setStateIso] = useState(
    isoForState(initialIso, address?.state ?? ""),
  );

  const initialPhone = splitPhone(address?.phone ?? "");
  const [dialIso, setDialIso] = useState(initialPhone.iso || initialIso || "PK");
  const [phoneNumber, setPhoneNumber] = useState(initialPhone.number);

  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const states = useMemo(() => stateOptions(countryIso), [countryIso]);
  const cities = useMemo(
    () => cityOptions(countryIso, stateIso),
    [countryIso, stateIso],
  );

  const onCountryChange = (name: string, iso?: string) => {
    setCountry(name);
    setState("");
    setCity("");
    setCountryIso(iso ?? "");
    setStateIso("");
    if (iso) setDialIso(iso);
    setErrors((e) => ({ ...e, country: false }));
  };

  const onStateChange = (name: string, iso?: string) => {
    setState(name);
    setCity("");
    setStateIso(iso ?? "");
  };

  const submit = async () => {
    const next: Record<string, boolean> = {};
    if (!line1.trim()) next.line1 = true;
    if (!city.trim()) next.city = true;
    if (!country.trim()) next.country = true;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const dial = dialOptions.find((d) => d.isoCode === dialIso)?.dialCode ?? "";
    const phone = phoneNumber.trim() ? `${dial} ${phoneNumber.trim()}`.trim() : null;

    const body: AddressInput = {
      label: label.trim() || null,
      line1: line1.trim(),
      line2: line2.trim() || null,
      city: city.trim(),
      state: state.trim() || null,
      country: country.trim(),
      postalCode: postal.trim() || null,
      phone,
      // the first address a customer saves becomes their default
      isDefault: address?.isDefault ?? isFirst,
    };

    setSaving(true);
    try {
      const saved = address
        ? await api.updateAddress(address.id, body)
        : await api.createAddress(body);
      toast.success(address ? "Address updated" : "Address saved");
      onSaved(saved);
    } catch (err) {
      toast.error("Couldn't save address", { description: (err as Error).message });
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/40 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line/60 bg-white p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-espresso">
            {address ? "Edit Address" : "Add Address"}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-muted transition hover:bg-cream hover:text-coffee"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Label"
            value={label}
            onChange={setLabel}
            placeholder="Home, Office…"
            className="sm:col-span-2"
          />
          <Field
            label="Address"
            value={line1}
            onChange={setLine1}
            error={errors.line1}
            className="sm:col-span-2"
          />
          <Field
            label="Apartment, suite, etc. (optional)"
            value={line2}
            onChange={setLine2}
            className="sm:col-span-2"
          />
          <Combobox
            label="Country"
            options={countryOptions}
            value={country}
            onChange={(name, o) => onCountryChange(name, o?.value)}
            placeholder="Select country"
            error={errors.country}
          />
          {states.length > 0 ? (
            <Combobox
              label="State / Province"
              options={states}
              value={state}
              onChange={(name, o) => onStateChange(name, o?.value)}
              placeholder="Select state"
              disabled={!countryIso}
            />
          ) : (
            <Field label="State / Province" value={state} onChange={setState} />
          )}
          {cities.length > 0 ? (
            <Combobox
              label="City"
              options={cities}
              value={city}
              onChange={(name) => {
                setCity(name);
                setErrors((e) => ({ ...e, city: false }));
              }}
              placeholder="Select city"
              error={errors.city}
              allowFreeText
            />
          ) : (
            <Field label="City" value={city} onChange={setCity} error={errors.city} />
          )}
          <Field label="Postal / ZIP code" value={postal} onChange={setPostal} />
          <PhoneField
            label="Phone"
            options={dialOptions}
            isoCode={dialIso}
            number={phoneNumber}
            onIsoChange={setDialIso}
            onNumberChange={setPhoneNumber}
            className="sm:col-span-2"
          />
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-full px-5 py-2.5 text-sm font-medium text-muted transition hover:text-coffee"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-70"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {address ? "Save Changes" : "Add Address"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  className = "",
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-coffee">{label}</label>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full rounded-xl border bg-cream-soft px-4 py-2.5 text-sm focus:outline-none",
          error ? "border-sale focus:border-sale" : "border-line focus:border-brand",
        )}
      />
    </div>
  );
}
