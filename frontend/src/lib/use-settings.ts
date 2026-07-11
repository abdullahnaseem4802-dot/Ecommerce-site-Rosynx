"use client";

/* Client-side store-settings cache. Fetches public store settings once per
 * session and memoizes them in-module so multiple components (floating
 * WhatsApp button, contact page, etc.) can read them without re-fetching. */

import { useEffect, useState } from "react";
import { api, type StoreSettings } from "./api";

let cache: StoreSettings | null = null;
let inflight: Promise<StoreSettings | null> | null = null;

function loadSettings(): Promise<StoreSettings | null> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = api
      .getSettings()
      .then((s) => {
        cache = s;
        return s;
      })
      .catch(() => {
        inflight = null;
        return null;
      });
  }
  return inflight;
}

/** Returns the public store settings on the client (null until loaded). */
export function useSettings(): StoreSettings | null {
  const [settings, setSettings] = useState<StoreSettings | null>(cache);

  useEffect(() => {
    if (cache) {
      setSettings(cache);
      return;
    }
    let alive = true;
    loadSettings().then((s) => {
      if (alive) setSettings(s);
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
