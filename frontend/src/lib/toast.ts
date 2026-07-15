"use client";

import { create } from "zustand";

export type ToastKind = "success" | "error" | "info";

export type Toast = {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
  /** Optional thumbnail — used by the "added to cart" toast. */
  image?: string;
  /** Optional call-to-action rendered as a link. */
  href?: string;
  hrefLabel?: string;
};

type ToastState = {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => number;
  dismiss: (id: number) => void;
};

let nextId = 1;
const DURATION = 4000;

export const useToasts = create<ToastState>()((set, get) => ({
  toasts: [],

  push: (t) => {
    const id = nextId++;
    // Cap the stack so a burst of rapid clicks can't cover the viewport.
    set((s) => ({ toasts: [...s.toasts, { ...t, id }].slice(-3) }));
    if (typeof window !== "undefined") {
      window.setTimeout(() => get().dismiss(id), DURATION);
    }
    return id;
  },

  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

/**
 * Fire-and-forget toast API, callable from anywhere (including non-React code
 * such as the cart store) because it reads the zustand store imperatively.
 */
export const toast = {
  success: (title: string, opts?: Partial<Omit<Toast, "id" | "kind" | "title">>) =>
    useToasts.getState().push({ kind: "success", title, ...opts }),
  error: (title: string, opts?: Partial<Omit<Toast, "id" | "kind" | "title">>) =>
    useToasts.getState().push({ kind: "error", title, ...opts }),
  info: (title: string, opts?: Partial<Omit<Toast, "id" | "kind" | "title">>) =>
    useToasts.getState().push({ kind: "info", title, ...opts }),
};
