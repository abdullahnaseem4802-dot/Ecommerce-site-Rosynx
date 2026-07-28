"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type DialOption = {
  isoCode: string;
  name: string;
  flag: string;
  dialCode: string; // includes leading "+"
};

/**
 * Max number of *local* digits (national number, dial code excluded) we let a
 * customer type per country. Prevents 20-digit garbage while still fitting real
 * numbers. Anything not listed falls back to DEFAULT_MAX_DIGITS.
 */
const MAX_LOCAL_DIGITS: Record<string, number> = {
  PK: 10,
  US: 10,
  GB: 10,
  IN: 10,
  AE: 9,
  SA: 9,
  CA: 10,
  AU: 9,
};
const DEFAULT_MAX_DIGITS = 15;
export const MIN_LOCAL_DIGITS = 7;

/** How many bare digits the given country's local number may contain. */
export const maxLocalDigits = (iso: string) =>
  MAX_LOCAL_DIGITS[iso] ?? DEFAULT_MAX_DIGITS;

/** Count of bare digits in a (possibly formatted) phone string. */
export const countDigits = (v: string) => (v.match(/\d/g) ?? []).length;

/**
 * Phone input: a country dial-code picker (flag + +code, searchable by
 * country name or dial code) next to a phone-number text input.
 */
export function PhoneField({
  label,
  options,
  isoCode,
  number,
  onIsoChange,
  onNumberChange,
  error = false,
  className = "",
}: {
  label: string;
  options: DialOption[];
  isoCode: string; // selected country iso2 for dial code
  number: string;
  onIsoChange: (iso: string) => void;
  onNumberChange: (v: string) => void;
  /** true/false toggles the red border; a string also renders a message below. */
  error?: boolean | string;
  className?: string;
}) {
  const hasError = Boolean(error);
  const errorMsg = typeof error === "string" ? error : "";
  const cap = maxLocalDigits(isoCode);

  // Block typing past the per-country digit cap. Formatting chars (spaces,
  // dashes) stay allowed — only the raw digit count is capped.
  const handleNumber = (next: string) => {
    if (countDigits(next) > cap && countDigits(next) > countDigits(number)) {
      return;
    }
    onNumberChange(next);
  };
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => options.find((o) => o.isoCode === isoCode) ?? options[0],
    [options, isoCode],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) =>
      `${o.name} ${o.dialCode}`.toLowerCase().includes(q),
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  return (
    <div className={className} ref={rootRef}>
      <label className="mb-1.5 block text-sm font-medium text-coffee">
        {label}
      </label>
      <div className="relative flex">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-l-xl border border-r-0 bg-cream-soft px-3 py-2.5 text-sm focus:outline-none",
            hasError ? "border-sale" : "border-line",
            open && !hasError && "border-brand",
          )}
        >
          <span className="text-base leading-none">{selected?.flag}</span>
          <span className="text-coffee">{selected?.dialCode}</span>
          <ChevronDown
            className={cn("h-4 w-4 text-muted transition", open && "rotate-180")}
          />
        </button>
        <input
          type="tel"
          inputMode="tel"
          value={number}
          onChange={(e) => handleNumber(e.target.value)}
          placeholder="Phone number"
          className={cn(
            "w-full rounded-r-xl border bg-cream-soft px-4 py-2.5 text-sm focus:outline-none",
            hasError ? "border-sale focus:border-sale" : "border-line focus:border-brand",
          )}
        />

        {open && (
          <div className="absolute left-0 top-full z-30 mt-1 w-full max-w-xs overflow-hidden rounded-xl border border-line bg-white shadow-lg">
            <div className="flex items-center gap-2 border-b border-line px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search country or code…"
                className="w-full bg-transparent text-sm text-coffee focus:outline-none"
              />
            </div>
            <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <li className="px-4 py-3 text-sm text-muted">No matches</li>
              )}
              {filtered.map((o) => (
                <li key={o.isoCode} role="option" aria-selected={o.isoCode === isoCode}>
                  <button
                    type="button"
                    onClick={() => {
                      onIsoChange(o.isoCode);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-brand/10",
                      o.isoCode === isoCode
                        ? "font-medium text-espresso"
                        : "text-coffee",
                    )}
                  >
                    <span className="text-base leading-none">{o.flag}</span>
                    <span className="min-w-0 flex-1 truncate">{o.name}</span>
                    <span className="shrink-0 text-muted">{o.dialCode}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {errorMsg && <p className="mt-1.5 text-xs text-sale">{errorMsg}</p>}
    </div>
  );
}
