"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

/** Fire after a ticket is opened so open badges drop without waiting for focus. */
export const SUPPORT_UNREAD_EVENT = "rosynx:support-unread-refresh";
export function refreshSupportUnread() {
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event(SUPPORT_UNREAD_EVENT));
}

/**
 * Number of support tickets where support has replied and the customer hasn't
 * opened the thread yet. Fetches for logged-in users on mount and on window
 * focus (cheap, and catches replies that land while the tab is open). Opening a
 * ticket clears it server-side, so re-mounting an account view drops the count.
 *
 * Returns 0 for signed-out users so callers can render a badge unconditionally.
 */
export function useSupportUnread(): number {
  const user = useAuth((s) => s.user);
  const [count, setCount] = useState(0);

  const refetch = useCallback(() => {
    if (!user) {
      setCount(0);
      return;
    }
    api
      .supportUnreadCount()
      .then((r) => setCount(r.count ?? 0))
      .catch(() => {
        /* keep the last known count */
      });
  }, [user]);

  useEffect(() => {
    refetch();
    if (!user) return;
    const onFocus = () => refetch();
    window.addEventListener("focus", onFocus);
    window.addEventListener(SUPPORT_UNREAD_EVENT, onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(SUPPORT_UNREAD_EVENT, onFocus);
    };
  }, [user, refetch]);

  return count;
}
