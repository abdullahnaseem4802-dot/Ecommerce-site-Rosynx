"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, Loader2, Lock, MapPin } from "lucide-react";
import { useCartTotal, useHydrated, useShop } from "@/lib/store";
import {
  api,
  getGuestToken,
  type AddressInput,
  type ApiAddress,
  type StoreSettings,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Container } from "@/components/ui/container";
import { PageBanner } from "@/components/ui/page-banner";
import { useMoney } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { Combobox } from "./Combobox";
import { PhoneField, type DialOption } from "./PhoneField";
import {
  countryOptions,
  dialOptions,
  stateOptions,
  cityOptions,
} from "./location-data";

type PaymentValue = "COD" | "BANK_TRANSFER" | "CARD";

type Form = {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postal: string;
  country: string;
  phone: string;
};

const empty: Form = {
  firstName: "",
  lastName: "",
  email: "",
  address: "",
  city: "",
  state: "",
  postal: "",
  country: "",
  phone: "",
};

const required: (keyof Form)[] = [
  "firstName",
  "lastName",
  "email",
  "address",
  "city",
  "country",
];

/**
 * Saved addresses persist country/state as *names*, matching what the order
 * shipping snapshot stores and what the Comboboxes display (their options are
 * `{ value: iso2, label: name }` and they select by label). Mapping a name back
 * to its ISO2 is what re-arms the cascading state/city datasets on load.
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

const norm = (v?: string | null) => (v ?? "").trim().toLowerCase();

/** Do the typed fields already describe a saved address? (phone ignored — formatting noise) */
const sameAddress = (a: ApiAddress, b: AddressInput) =>
  norm(a.line1) === norm(b.line1) &&
  norm(a.city) === norm(b.city) &&
  norm(a.state) === norm(b.state) &&
  norm(a.country) === norm(b.country) &&
  norm(a.postalCode) === norm(b.postalCode);

const summarize = (a: ApiAddress) =>
  [a.line1, a.city, a.state, a.country].filter(Boolean).join(", ");

export default function CheckoutPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const cart = useShop((s) => s.cart);
  const clearCart = useShop((s) => s.clearCart);
  const coupon = useShop((s) => s.coupon);
  const { format } = useMoney();
  const subtotal = useCartTotal();
  const shipping = 0; // free shipping (store policy)
  const discount = coupon ? Math.min(coupon.discountCents / 100, subtotal) : 0;
  const total = subtotal - discount + shipping;

  const [form, setForm] = useState<Form>(empty);
  const [payment, setPayment] = useState<PaymentValue>("COD");
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, boolean>>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  // ISO2 codes drive the cascading dropdown datasets; form stores names.
  const [countryIso, setCountryIso] = useState("");
  const [stateIso, setStateIso] = useState("");
  // Dial code for phone picker — defaults to Pakistan.
  const [dialIso, setDialIso] = useState("PK");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Saved address book (signed-in customers only).
  const user = useAuth((s) => s.user);
  const [addresses, setAddresses] = useState<ApiAddress[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // null = follow the smart default; a boolean means the customer chose.
  const [saveManual, setSaveManual] = useState<boolean | null>(null);

  // Live mirrors so async autofill never clobbers what's already been typed.
  const formRef = useRef(form);
  const phoneRef = useRef(phoneNumber);
  useEffect(() => {
    formRef.current = form;
    phoneRef.current = phoneNumber;
  });

  const states = useMemo(() => stateOptions(countryIso), [countryIso]);
  const cities = useMemo(
    () => cityOptions(countryIso, stateIso),
    [countryIso, stateIso],
  );

  /**
   * Copy a saved address into the form. With `onlyEmpty` (the on-load autofill)
   * every field the customer already filled in is left untouched.
   */
  const fillFrom = useCallback((a: ApiAddress, onlyEmpty = false) => {
    const cur = formRef.current;
    const take = (curVal: string, next: string) =>
      onlyEmpty && curVal.trim() ? curVal : next;

    const country = take(cur.country, a.country);
    const iso = isoForCountry(country);
    // If they've already picked a different country, the saved state/city
    // belong to another dataset and would desync the cascading pickers.
    const localityApplies = country === a.country;
    const state = localityApplies ? take(cur.state, a.state ?? "") : cur.state;

    setForm((f) => ({
      ...f,
      address: take(cur.address, a.line1),
      city: localityApplies ? take(cur.city, a.city) : f.city,
      state,
      postal: localityApplies ? take(cur.postal, a.postalCode ?? "") : f.postal,
      country,
    }));
    setCountryIso(iso);
    setStateIso(isoForState(iso, state));
    setErrors({});

    const phone = a.phone?.trim();
    if (phone && !(onlyEmpty && phoneRef.current.trim())) {
      const parsed = splitPhone(phone);
      setDialIso(parsed.iso || iso || "PK");
      setPhoneNumber(parsed.number);
    } else if (iso && !onlyEmpty) {
      setDialIso(iso);
    }
  }, []);

  // Once the session is known, prefill identity and the default saved address.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const apply = (list: ApiAddress[]) => {
      if (cancelled) return;

      // Identity comes from the session — the address book has no name field.
      setForm((f) => {
        const next = { ...f };
        if (!f.email.trim()) next.email = user.email;
        if (!f.firstName.trim() && !f.lastName.trim()) {
          const [first, ...rest] = user.name.trim().split(/\s+/);
          next.firstName = first ?? "";
          next.lastName = rest.join(" ");
        }
        return next;
      });

      if (list.length === 0) return;
      setAddresses(list);
      const preferred = list.find((a) => a.isDefault) ?? list[0];
      setSelectedId(preferred.id);
      fillFrom(preferred, true);
    };

    // An unreachable address book is a lost convenience, never a blocker.
    api.getAddresses().then(apply, () => apply([]));

    return () => {
      cancelled = true;
    };
  }, [user, fillFrom]);

  const dial = useMemo(
    () => dialOptions.find((d) => d.isoCode === dialIso)?.dialCode ?? "",
    [dialIso],
  );

  const composedPhone = phoneNumber.trim()
    ? `${dial} ${phoneNumber.trim()}`.trim()
    : "";

  /** The address currently described by the form, in API shape. */
  const draft: AddressInput = useMemo(
    () => ({
      line1: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim() || null,
      country: form.country.trim(),
      postalCode: form.postal.trim() || null,
      phone: composedPhone || null,
      isDefault: addresses.length === 0,
    }),
    [form, composedPhone, addresses.length],
  );

  // Checked by default when this address isn't in the book yet (which includes
  // the "no saved addresses at all" case), unless the customer says otherwise.
  const matchesSaved = useMemo(
    () => addresses.some((a) => sameAddress(a, draft)),
    [addresses, draft],
  );
  const saveAddress = saveManual ?? !matchesSaved;

  // Load store settings to know which payment methods are enabled.
  useEffect(() => {
    api
      .getSettings()
      .then((s) => setSettings(s))
      .catch(() => setSettings(null));
  }, []);

  const paymentOptions = useMemo(() => {
    const opts: { value: PaymentValue; label: string; caption?: string }[] = [];
    // Default to enabled until settings load, so the page is never empty.
    if (!settings || settings.codEnabled)
      opts.push({ value: "COD", label: "Cash on Delivery" });
    if (settings?.bankTransferEnabled)
      opts.push({ value: "BANK_TRANSFER", label: "Bank Transfer" });
    if (settings?.cardEnabled)
      opts.push({
        value: "CARD",
        label: "Debit / Credit Card",
        caption: "Secure card payment (sandbox mode)",
      });
    return opts;
  }, [settings]);

  // If the selected method becomes unavailable after settings load, fall back.
  useEffect(() => {
    if (
      paymentOptions.length > 0 &&
      !paymentOptions.some((o) => o.value === payment)
    ) {
      setPayment(paymentOptions[0].value);
    }
  }, [paymentOptions, payment]);

  const set = (k: keyof Form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: false }));
  };

  const onCountryChange = (name: string, iso?: string) => {
    setForm((f) => ({ ...f, country: name, state: "", city: "" }));
    setCountryIso(iso ?? "");
    setStateIso("");
    if (iso) setDialIso(iso); // sync phone dial code to shipping country
    if (errors.country) setErrors((e) => ({ ...e, country: false }));
  };

  const onStateChange = (name: string, iso?: string) => {
    setForm((f) => ({ ...f, state: name, city: "" }));
    setStateIso(iso ?? "");
  };

  const placeOrder = async () => {
    setServerError("");
    const nextErrors: Partial<Record<keyof Form, boolean>> = {};
    required.forEach((k) => {
      if (!form[k].trim()) nextErrors[k] = true;
    });
    if (!form.email.includes("@")) nextErrors.email = true;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (cart.length === 0) return;

    const phone = composedPhone || "N/A";

    setLoading(true);
    try {
      const res = await api.checkout({
        email: form.email,
        paymentMethod: payment,
        couponCode: coupon?.code,
        guestToken: getGuestToken(),
        shipping: {
          name: `${form.firstName} ${form.lastName}`.trim(),
          phone,
          line1: form.address,
          city: form.city,
          state: form.state || undefined,
          postalCode: form.postal || undefined,
          country: form.country,
        },
        items: cart.map((l) => ({ productId: l.apiId, qty: l.qty })),
      });

      // The order is placed — saving the address is a bonus. Swallow any
      // failure so it can never surface as a checkout error, but await it so
      // the request isn't cancelled by the redirect below.
      if (user && saveAddress && draft.line1) {
        try {
          await api.createAddress(draft);
        } catch {
          /* ignore — the order went through, which is what matters */
        }
      }

      clearCart();
      if (res.paymentUrl) {
        window.location.href = res.paymentUrl;
        return;
      }
      router.push(`/order-success?id=${res.orderNumber}&total=${res.total}`);
    } catch (err) {
      setServerError((err as Error).message);
      setLoading(false);
    }
  };

  if (hydrated && cart.length === 0) {
    return (
      <div className="pb-20">
        <PageBanner title="Checkout" crumb="Checkout" />
        <Container>
          <div className="rounded-2xl border border-dashed border-line bg-white py-20 text-center">
            <p className="text-sm text-muted">Your cart is empty.</p>
            <button
              onClick={() => router.push("/shop")}
              className="mt-4 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white"
            >
              Continue Shopping
            </button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <PageBanner title="Checkout" crumb="Checkout" />
      <Container>
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <Section title="Shipping Address">
              {addresses.length > 1 && (
                <div className="mb-5">
                  <p className="mb-2 text-sm font-medium text-coffee">
                    Deliver to a saved address
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {addresses.map((a) => {
                      const active = a.id === selectedId;
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => {
                            setSelectedId(a.id);
                            setSaveManual(null);
                            fillFrom(a);
                          }}
                          className={cn(
                            "flex items-start gap-2 rounded-xl border px-3 py-2.5 text-left text-xs transition",
                            active
                              ? "border-brand bg-brand/5"
                              : "border-line bg-cream-soft hover:border-brand/50",
                          )}
                        >
                          <MapPin
                            className={cn(
                              "mt-0.5 h-4 w-4 shrink-0",
                              active ? "text-brand" : "text-muted",
                            )}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              <span className="truncate font-semibold text-coffee">
                                {a.label || "Address"}
                              </span>
                              {a.isDefault && (
                                <span className="rounded-full bg-brand/15 px-1.5 py-0.5 text-[10px] font-medium text-brand">
                                  Default
                                </span>
                              )}
                            </span>
                            <span className="mt-0.5 block truncate text-muted">
                              {summarize(a)}
                            </span>
                          </span>
                          {active && (
                            <Check className="h-4 w-4 shrink-0 text-brand" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="First name" value={form.firstName} onChange={(v) => set("firstName", v)} error={errors.firstName} />
                <Input label="Last name" value={form.lastName} onChange={(v) => set("lastName", v)} error={errors.lastName} />
                <Input label="Email" type="email" value={form.email} onChange={(v) => set("email", v)} error={errors.email} className="sm:col-span-2" />
                <Input label="Address" value={form.address} onChange={(v) => set("address", v)} error={errors.address} className="sm:col-span-2" />
                <Combobox
                  label="Country"
                  options={countryOptions}
                  value={form.country}
                  onChange={(name, o) => onCountryChange(name, o?.value)}
                  placeholder="Select country"
                  error={errors.country}
                />
                {states.length > 0 ? (
                  <Combobox
                    label="State / Province"
                    options={states}
                    value={form.state}
                    onChange={(name, o) => onStateChange(name, o?.value)}
                    placeholder="Select state"
                    disabled={!countryIso}
                    error={errors.state}
                  />
                ) : (
                  <Input
                    label="State / Province"
                    value={form.state}
                    onChange={(v) => set("state", v)}
                  />
                )}
                {cities.length > 0 ? (
                  <Combobox
                    label="City"
                    options={cities}
                    value={form.city}
                    onChange={(name) => set("city", name)}
                    placeholder="Select city"
                    error={errors.city}
                    allowFreeText
                  />
                ) : (
                  <Input
                    label="City"
                    value={form.city}
                    onChange={(v) => set("city", v)}
                    error={errors.city}
                  />
                )}
                <Input label="Postal / ZIP code" value={form.postal} onChange={(v) => set("postal", v)} />
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
              {user && (
                <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-sm text-coffee">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={(e) => setSaveManual(e.target.checked)}
                    className="accent-[#8a5d3e]"
                  />
                  Save this address for next time
                </label>
              )}
            </Section>

            <Section title="Payment Method">
              <div className="space-y-2">
                {paymentOptions.map((m) => (
                  <div key={m.value}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm text-coffee transition",
                        payment === m.value
                          ? "border-brand bg-brand/5"
                          : "border-line bg-cream-soft",
                      )}
                    >
                      <input
                        type="radio"
                        name="pay"
                        checked={payment === m.value}
                        onChange={() => setPayment(m.value)}
                        className="accent-[#8a5d3e]"
                      />
                      <span className="flex-1">
                        {m.label}
                        {m.caption && (
                          <span className="mt-0.5 block text-xs font-normal text-muted">
                            {m.caption}
                          </span>
                        )}
                      </span>
                    </label>
                    {m.value === "BANK_TRANSFER" &&
                      payment === "BANK_TRANSFER" &&
                      settings?.bankDetails && (
                        <div className="mt-2 whitespace-pre-line rounded-xl border border-line bg-cream-soft px-4 py-3 text-xs text-coffee">
                          {settings.bankDetails}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </Section>
          </div>

          <div className="h-fit rounded-2xl border border-line/60 bg-white p-6 lg:sticky lg:top-40">
            <h2 className="font-serif text-lg font-bold text-espresso">Your Order</h2>
            <ul className="mt-4 space-y-3">
              {hydrated &&
                cart.map((l) => (
                  <li key={l.id} className="flex items-center gap-3">
                    <span className="relative h-12 w-12 overflow-hidden rounded-lg bg-cream-card">
                      <Image src={l.image} alt="" fill sizes="48px" className="object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-coffee">{l.name}</span>
                      <span className="text-xs text-muted">Qty {l.qty}</span>
                    </span>
                    <span className="text-sm font-semibold text-espresso">
                      {format(l.price * l.qty)}
                    </span>
                  </li>
                ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-medium text-coffee">{format(subtotal)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-newtag">
                  <dt>Discount {coupon ? `(${coupon.code})` : ""}</dt>
                  <dd className="font-medium">−{format(discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted">Shipping</dt>
                <dd className="font-medium text-coffee">
                  {shipping === 0 ? "Free" : format(shipping)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 text-base">
                <dt className="font-semibold text-espresso">Total</dt>
                <dd className="font-bold text-espresso">{format(total)}</dd>
              </div>
            </dl>
            <button
              onClick={placeOrder}
              disabled={loading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing…
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" /> Place Order
                </>
              )}
            </button>
            {Object.keys(errors).length > 0 && (
              <p className="mt-2 text-center text-xs text-sale">
                Please fill in the required fields above.
              </p>
            )}
            {serverError && (
              <p className="mt-2 text-center text-xs text-sale">{serverError}</p>
            )}
            <p className="mt-3 text-center text-xs text-muted">
              Secure encrypted checkout · 30-day returns
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line/60 bg-white p-6">
      <h2 className="mb-4 font-serif text-lg font-bold text-espresso">{title}</h2>
      {children}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  className = "",
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
  error?: boolean;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-coffee">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full rounded-xl border bg-cream-soft px-4 py-2.5 text-sm focus:outline-none",
          error ? "border-sale focus:border-sale" : "border-line focus:border-brand",
        )}
      />
    </div>
  );
}
