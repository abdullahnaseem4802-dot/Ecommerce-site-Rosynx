"use client";

import { create } from "zustand";
import { api, clearToken, getToken, setToken } from "@/lib/api";
import { useShop } from "@/lib/store";
import { takePendingAdd } from "@/lib/cart-intent";

/**
 * After signing in, add whatever the visitor was trying to add when the login
 * gate stopped them. Runs after the guest-cart merge so the merged cart isn't
 * overwritten by a stale response.
 */
async function afterAuth() {
  await useShop.getState().mergeGuestCart();
  const pending = takePendingAdd();
  if (!pending) return;
  try {
    await api.addToCart(pending.apiId, pending.qty);
    await useShop.getState().hydrate();
  } catch {
    /* the visitor is signed in either way — they can add it again */
  }
}

export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type AuthState = {
  user: User | null;
  ready: boolean; // true once we've attempted to restore the session
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  restore: () => Promise<void>;
};

export const useAuth = create<AuthState>()((set) => ({
  user: null,
  ready: false,

  login: async (email, password) => {
    const res = await api.login(email, password);
    setToken(res.accessToken);
    set({ user: res.user });
    await afterAuth();
  },

  // Registration is now double opt-in and no longer returns a session — the
  // account page drives the email-verification step and establishes the session
  // once the code is confirmed. This just kicks off registration.
  register: async (name, email, password) => {
    await api.register(name, email, password);
  },

  logout: () => {
    clearToken();
    set({ user: null });
    // clear the local cart/wishlist view (server data is left intact)
    useShop.setState({ cart: [], wishlist: [] });
  },

  restore: async () => {
    if (!getToken()) {
      set({ ready: true });
      return;
    }
    try {
      const user = await api.me();
      set({ user, ready: true });
    } catch {
      clearToken();
      set({ user: null, ready: true });
    }
  },
}));
