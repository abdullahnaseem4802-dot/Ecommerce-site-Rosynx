"use client";

/**
 * Remembers the item a signed-out visitor tried to add, so that after they log
 * in or sign up we can add it for them instead of making them find the product
 * and click again.
 *
 * Stored as the backend product id (not the local numeric id) so the flush can
 * hit the API directly without needing the catalog to be loaded first.
 * sessionStorage, not localStorage: the intent should die with the tab.
 */

const KEY = "rosynx-pending-add";

export type PendingAdd = { apiId: string; qty: number };

export function setPendingAdd(apiId: string, qty: number) {
  if (typeof window === "undefined" || !apiId) return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ apiId, qty }));
  } catch {
    /* private mode / quota — the gate still works, we just lose the auto-add */
  }
}

export function takePendingAdd(): PendingAdd | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY); // consume — never replay twice
    const p = JSON.parse(raw) as PendingAdd;
    return p && typeof p.apiId === "string" && p.apiId ? p : null;
  } catch {
    return null;
  }
}
