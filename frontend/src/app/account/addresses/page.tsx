"use client";

import { useState } from "react";
import { MapPin, Plus, Star, Trash2 } from "lucide-react";
import { AccountShell } from "@/components/account/account-shell";
import { cn } from "@/lib/utils";

type Address = {
  id: number;
  label: string;
  name: string;
  line: string;
  city: string;
  country: string;
  phone: string;
  default: boolean;
};

const initial: Address[] = [
  {
    id: 1,
    label: "Home",
    name: "Jane Doe",
    line: "24 Garden Street, Apt 5",
    city: "Cairo",
    country: "Egypt",
    phone: "+20 100 000 0000",
    default: true,
  },
  {
    id: 2,
    label: "Office",
    name: "Jane Doe",
    line: "12 Business Park, Floor 3",
    city: "Giza",
    country: "Egypt",
    phone: "+20 122 222 2222",
    default: false,
  },
];

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>(initial);

  const makeDefault = (id: number) =>
    setAddresses((a) => a.map((x) => ({ ...x, default: x.id === id })));
  const remove = (id: number) =>
    setAddresses((a) => a.filter((x) => x.id !== id));

  return (
    <AccountShell title="Addresses">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-serif text-xl font-bold text-espresso">Saved Addresses</h2>
        <button className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark">
          <Plus className="h-4 w-4" /> Add New
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {addresses.map((a) => (
          <div
            key={a.id}
            className={cn(
              "rounded-2xl border bg-white p-5",
              a.default ? "border-brand" : "border-line/60",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-coffee">
                <MapPin className="h-4 w-4 text-brand" />
                {a.label}
              </span>
              {a.default && (
                <span className="rounded-full bg-brand/15 px-2.5 py-0.5 text-[11px] font-medium text-brand">
                  Default
                </span>
              )}
            </div>
            <div className="mt-3 space-y-0.5 text-sm text-coffee/80">
              <p className="font-medium text-coffee">{a.name}</p>
              <p>{a.line}</p>
              <p>
                {a.city}, {a.country}
              </p>
              <p>{a.phone}</p>
            </div>
            <div className="mt-4 flex items-center gap-3 text-xs">
              {!a.default && (
                <button
                  onClick={() => makeDefault(a.id)}
                  className="inline-flex items-center gap-1 font-medium text-brand hover:underline"
                >
                  <Star className="h-3.5 w-3.5" /> Set default
                </button>
              )}
              <button
                onClick={() => remove(a.id)}
                className="inline-flex items-center gap-1 font-medium text-muted hover:text-sale"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </AccountShell>
  );
}
