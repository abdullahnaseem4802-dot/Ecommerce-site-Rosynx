"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { AccountShell } from "@/components/account/account-shell";

export default function ProfilePage() {
  const user = useAuth((s) => s.user);
  const login = useAuth((s) => s.login);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(t);
  }, [saved]);

  return (
    <AccountShell title="Profile">
      <div className="max-w-xl rounded-2xl border border-line/60 bg-white p-6">
        <h2 className="font-serif text-xl font-bold text-espresso">Personal Details</h2>
        <p className="mt-1 text-sm text-muted">Update your account information.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email.includes("@")) {
              login(email, name);
              setSaved(true);
            }
          }}
          className="mt-6 space-y-4"
        >
          <Field label="Full name" value={name} onChange={setName} />
          <Field label="Email" type="email" value={email} onChange={setEmail} />
          <Field label="Phone" value={phone} onChange={setPhone} placeholder="+20 100 000 0000" />
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            {saved ? (
              <>
                <Check className="h-4 w-4" /> Saved
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </form>
      </div>
    </AccountShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-coffee">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-line bg-cream-soft px-4 py-3 text-sm focus:border-brand focus:outline-none"
      />
    </div>
  );
}
