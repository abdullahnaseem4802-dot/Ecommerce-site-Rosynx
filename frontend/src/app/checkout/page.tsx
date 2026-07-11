"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { useCartTotal, useHydrated, useShop } from "@/lib/store";
import { api, getGuestToken, type StoreSettings } from "@/lib/api";
import { Container } from "@/components/ui/container";
import { PageBanner } from "@/components/ui/page-banner";
import { useMoney } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { Combobox } from "./Combobox";
import { PhoneField } from "./PhoneField";
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

  const states = useMemo(() => stateOptions(countryIso), [countryIso]);
  const cities = useMemo(
    () => cityOptions(countryIso, stateIso),
    [countryIso, stateIso],
  );

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

    const dial =
      dialOptions.find((d) => d.isoCode === dialIso)?.dialCode ?? "";
    const phone = phoneNumber.trim()
      ? `${dial} ${phoneNumber.trim()}`.trim()
      : "N/A";

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
