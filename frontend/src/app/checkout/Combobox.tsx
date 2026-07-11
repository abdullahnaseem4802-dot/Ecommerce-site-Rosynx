"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type ComboOption = {
  value: string; // stable key (iso code or name)
  label: string; // human-readable name submitted / shown
  prefix?: string; // e.g. flag emoji
  search?: string; // extra searchable text (e.g. dial code)
};

/**
 * Accessible combobox: a button that opens a filtered, scrollable dropdown.
 * Keyboard friendly (arrow keys, enter, escape), closes on outside click.
 */
export function Combobox({
  label,
  options,
  value,
  onChange,
  placeholder = "Select…",
  disabled = false,
  error = false,
  className = "",
  allowFreeText = false,
  emptyText = "No matches",
}: {
  label: string;
  options: ComboOption[];
  value: string; // current label / free text
  onChange: (label: string, option?: ComboOption) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  allowFreeText?: boolean;
  emptyText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = useMemo(
    () => options.find((o) => o.label === value),
    [options, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) =>
      `${o.label} ${o.search ?? ""}`.toLowerCase().includes(q),
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        commitFreeText();
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      // focus the search input once open
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  // keep active option in view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const commitFreeText = () => {
    if (allowFreeText && query.trim()) {
      onChange(query.trim());
    }
  };

  const pick = (o: ComboOption) => {
    onChange(o.label, o);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[active]) pick(filtered[active]);
      else commitFreeText(), setOpen(false);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div className={className} ref={rootRef}>
      <label className="mb-1.5 block text-sm font-medium text-coffee">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            "flex w-full items-center gap-2 rounded-xl border bg-cream-soft px-4 py-2.5 text-left text-sm focus:outline-none",
            error ? "border-sale" : "border-line focus:border-brand",
            disabled && "cursor-not-allowed opacity-60",
            open && !error && "border-brand",
          )}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2">
            {selected?.prefix && (
              <span className="text-base leading-none">{selected.prefix}</span>
            )}
            <span
              className={cn(
                "truncate",
                value ? "text-coffee" : "text-muted",
              )}
            >
              {value || placeholder}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted transition",
              open && "rotate-180",
            )}
          />
        </button>

        {open && (
          <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-line bg-white shadow-lg">
            <div className="flex items-center gap-2 border-b border-line px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search…"
                className="w-full bg-transparent text-sm text-coffee focus:outline-none"
              />
            </div>
            <ul
              ref={listRef}
              role="listbox"
              className="max-h-60 overflow-y-auto py-1"
            >
              {filtered.length === 0 && (
                <li className="px-4 py-3 text-sm text-muted">
                  {allowFreeText && query.trim()
                    ? `Use “${query.trim()}”`
                    : emptyText}
                </li>
              )}
              {filtered.map((o, i) => {
                const isSel = o.label === value;
                return (
                  <li key={o.value} role="option" aria-selected={isSel}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => pick(o)}
                      className={cn(
                        "flex w-full items-center gap-2 px-4 py-2 text-left text-sm",
                        i === active ? "bg-brand/10" : "bg-white",
                        isSel ? "font-medium text-espresso" : "text-coffee",
                      )}
                    >
                      {o.prefix && (
                        <span className="text-base leading-none">
                          {o.prefix}
                        </span>
                      )}
                      <span className="min-w-0 flex-1 truncate">{o.label}</span>
                      {isSel && <Check className="h-4 w-4 shrink-0 text-brand" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
