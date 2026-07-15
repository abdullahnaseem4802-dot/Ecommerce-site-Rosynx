"use client";

/* Client-side store-settings cache. Fetches public store settings once per
 * session and memoizes them in-module so multiple components (floating
 * WhatsApp button, contact page, etc.) can read them without re-fetching. */

import { useEffect, useState } from "react";
import { api, type StoreSettings } from "./api";
import { cachedJSON, peekCached, TTL } from "./client-cache";

/**
 * THE single place store settings are fetched. `currency.ts` imports this too —
 * previously both modules fetched /settings independently, so every page load
 * requested it twice.
 */
export function loadSettings(): Promise<StoreSettings | null> {
  return cachedJSON<StoreSettings>("settings", TTL.settings, () =>
    api.getSettings(),
  ).catch(() => null);
}

/** Returns the public store settings on the client (null until loaded). */
export function useSettings(): StoreSettings | null {
  const [settings, setSettings] = useState<StoreSettings | null>(() =>
    peekCached<StoreSettings>("settings", TTL.settings),
  );

  useEffect(() => {
    let alive = true;
    loadSettings().then((s) => {
      if (alive && s) setSettings(s);
    });
    return () => {
      alive = false;
    };
  }, []);

  return settings;
}

/** Store WhatsApp number. Prefers the value configured in admin Settings;
 * falls back to NEXT_PUBLIC_WHATSAPP (or the store default) so the WhatsApp
 * button always works even before settings are populated. */
const DEFAULT_WHATSAPP =
  process.env.NEXT_PUBLIC_WHATSAPP ?? "+923036862005";

/** Digits-only phone number suitable for a wa.me link, or "" if unavailable. */
export function whatsappDigits(settings: StoreSettings | null): string {
  const raw = settings?.whatsapp?.trim() || DEFAULT_WHATSAPP;
  return raw ? raw.replace(/\D/g, "") : "";
}
