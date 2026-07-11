"use client";

import { create } from "zustand";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";

/** Currencies the storefront can display prices in. */
export const CURRENCIES = [
  "USD",
  "PKR",
  "GBP",
  "EUR",
  "CNY",
  "AED",
  "SAR",
] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

/** Symbol + label + how many decimals to show. */
export const CURRENCY_META: Record<
  CurrencyCode,
  { symbol: string; label: string; decimals: number }
> = {
  USD: { symbol: "$", label: "US Dollar", decimals: 2 },
  PKR: { symbol: "₨", label: "Pakistani Rupee", decimals: 0 },
  GBP: { symbol: "£", label: "British Pound", decimals: 2 },
  EUR: { symbol: "€", label: "Euro", decimals: 2 },
  CNY: { symbol: "¥", label: "Chinese Yuan", decimals: 0 },
  AED: { symbol: "د.إ", label: "UAE Dirham", decimals: 2 },
  SAR: { symbol: "﷼", label: "Saudi Riyal", decimals: 2 },
};

const STORAGE_KEY = "rosynx-currency";

/** ISO country code → display currency. Anything unmapped falls back to base. */
const COUNTRY_TO_CURRENCY: Record<string, CurrencyCode> = {
  PK: "PKR",
  GB: "GBP",
  CN: "CNY",
  AE: "AED",
  SA: "SAR",
  US: "USD",
  // Eurozone
  DE: "EUR",
  FR: "EUR",
  IT: "EUR",
  ES: "EUR",
  NL: "EUR",
  IE: "EUR",
  PT: "EUR",
  AT: "EUR",
  BE: "EUR",
  FI: "EUR",
  GR: "EUR",
  LU: "EUR",
  SK: "EUR",
  SI: "EUR",
  EE: "EUR",
  LV: "EUR",
  LT: "EUR",
  CY: "EUR",
  MT: "EUR",
  HR: "EUR",
};

type CurrencyState = {
  currency: string;
  base: string;
  rates: Record<string, number>;
  ready: boolean;
  init: () => Promise<void>;
  setCurrency: (code: string) => void;
};

function isSupported(code: string): code is CurrencyCode {
  return (CURRENCIES as readonly string[]).includes(code);
}

function savedChoice(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Best-effort IP → currency. Never throws; returns null on any failure. */
async function detectCurrencyFromIp(
  rates: Record<string, number>,
): Promise<string | null> {
  const fromCountry = (raw: string | undefined): string | null => {
    if (!raw) return null;
    const cc = raw.trim().toUpperCase();
    const mapped = COUNTRY_TO_CURRENCY[cc];
    if (!mapped) return null;
    // Only use it if we actually have a rate for it.
    return rates[mapped] != null ? mapped : null;
  };

  try {
    const res = await fetch("https://ipwho.is/?fields=country_code");
    if (res.ok) {
      const data = (await res.json()) as { country_code?: string };
      const hit = fromCountry(data.country_code);
      if (hit) return hit;
    }
  } catch {
    /* try fallback */
  }

  try {
    const res = await fetch("https://get.geojs.io/v1/ip/country.json");
    if (res.ok) {
      const data = (await res.json()) as { country?: string };
      const hit = fromCountry(data.country);
      if (hit) return hit;
    }
  } catch {
    /* give up */
  }

  return null;
}

let initStarted = false;

export const useCurrency = create<CurrencyState>()((set, get) => ({
  currency: "USD",
  base: "USD",
  rates: { USD: 1 },
  ready: false,

  init: async () => {
    if (initStarted) return;
    initStarted = true;

    let base = "USD";
    let rates: Record<string, number> = { USD: 1 };

    try {
      const r = await api.getRates();
      if (r?.rates) rates = r.rates;
      if (r?.base) base = r.base;
    } catch {
      /* keep defaults */
    }

    try {
      const settings = await api.getSettings();
      if (settings?.baseCurrency) base = settings.baseCurrency;
    } catch {
      /* keep base */
    }

    if (rates[base] == null) rates = { ...rates, [base]: rates[base] ?? 1 };

    // Decide the display currency: manual choice → IP geo → base.
    let currency: string = isSupported(base) ? base : "USD";

    const saved = savedChoice();
    if (saved && isSupported(saved) && rates[saved] != null) {
      currency = saved;
    } else {
      const detected = await detectCurrencyFromIp(rates);
      if (detected) currency = detected;
    }

    set({ base, rates, currency, ready: true });
  },

  setCurrency: (code) => {
    if (!isSupported(code)) return;
    if (get().rates[code] == null) return;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, code);
      } catch {
        /* ignore */
      }
    }
    set({ currency: code });
  },
}));

/**
 * Currency-aware money hook. `format(amountInBase)` converts a base-currency
 * amount into the selected display currency. Falls back to USD formatting if
 * rates are missing so nothing ever breaks.
 */
export function useMoney() {
  const currency = useCurrency((s) => s.currency);
  const base = useCurrency((s) => s.base);
  const rates = useCurrency((s) => s.rates);
  const ready = useCurrency((s) => s.ready);
  const setCurrency = useCurrency((s) => s.setCurrency);

  const format = (amountInBase: number): string => {
    const code = isSupported(currency) ? currency : "USD";
    const baseRate = rates[base];
    const targetRate = rates[code];

    // Missing data → safe USD fallback.
    if (!baseRate || targetRate == null) return formatPrice(amountInBase);

    const converted = (amountInBase * targetRate) / baseRate;
    const meta = CURRENCY_META[code];
    const amount = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: meta.decimals,
      maximumFractionDigits: meta.decimals,
    }).format(converted);
    return `${meta.symbol}${amount}`;
  };

  const currencies = CURRENCIES.map((code) => ({
    code,
    symbol: CURRENCY_META[code].symbol,
    label: CURRENCY_META[code].label,
    available: rates[code] != null,
  }));

  return { format, currency, setCurrency, currencies, ready };
}
