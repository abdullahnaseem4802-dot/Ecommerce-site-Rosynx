"use client";

/**
 * Storefront → backend API client. Handles the JWT (for logged-in users) and a
 * persistent guest token (for anonymous carts). All calls are client-side.
 */

const API =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

const TOKEN_KEY = "rosynx-token";
const GUEST_KEY = "rosynx-guest";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string) {
  localStorage.setItem(TOKEN_KEY, t);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getGuestToken(): string {
  if (typeof window === "undefined") return "";
  let g = localStorage.getItem(GUEST_KEY);
  if (!g) {
    g =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : "guest-" + Math.random().toString(36).slice(2);
    localStorage.setItem(GUEST_KEY, g);
  }
  return g;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const guest = getGuestToken();
  if (guest) headers["x-guest-token"] = guest;

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      message = Array.isArray(data.message)
        ? data.message.join(", ")
        : data.message || message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ---- shapes ----
export interface ApiUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
}
export interface ApiCartItem {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  price: number;
  priceCents: number;
  qty: number;
  lineTotalCents: number;
}
export interface ApiCart {
  items: ApiCartItem[];
  count: number;
  subtotalCents: number;
  subtotal: number;
}

export const api = {
  // auth
  register: (name: string, email: string, password: string) =>
    request<{ user: ApiUser; accessToken: string }>("POST", "/auth/register", {
      name,
      email,
      password,
    }),
  login: (email: string, password: string) =>
    request<{ user: ApiUser; accessToken: string }>("POST", "/auth/login", {
      email,
      password,
    }),
  me: () => request<ApiUser>("GET", "/auth/me"),

  // cart
  getCart: () => request<ApiCart>("GET", "/cart"),
  addToCart: (productId: string, qty = 1) =>
    request<ApiCart>("POST", "/cart/items", { productId, qty }),
  setCartQty: (productId: string, qty: number) =>
    request<ApiCart>("PATCH", `/cart/items/${productId}`, { qty }),
  removeCartItem: (productId: string) =>
    request<ApiCart>("DELETE", `/cart/items/${productId}`),
  clearCart: () => request<ApiCart>("DELETE", "/cart"),
  mergeCart: (guestToken: string) =>
    request<ApiCart>("POST", "/cart/merge", { guestToken }),

  // wishlist
  getWishlist: () => request<{ slug: string; apiId?: string }[]>("GET", "/wishlist"),
  addWishlist: (productId: string) =>
    request<{ slug: string }[]>("POST", `/wishlist/${productId}`),
  removeWishlist: (productId: string) =>
    request<{ slug: string }[]>("DELETE", `/wishlist/${productId}`),

  // coupons
  validateCoupon: (code: string, subtotalCents: number) =>
    request<{
      valid: boolean;
      code: string;
      discountCents: number;
      reason?: string;
    }>("POST", "/coupons/validate", { code, subtotalCents }),

  // orders
  checkout: (payload: unknown) =>
    request<{ orderNumber: string; total: number; paymentUrl?: string }>(
      "POST",
      "/orders/checkout",
      payload,
    ),
  sandboxPay: (orderNumber: string) =>
    request<OrderSummary>(
      "POST",
      `/orders/${orderNumber}/sandbox-pay`,
    ),
  myOrders: () => request<OrderSummary[]>("GET", "/orders/mine"),
  getOrder: (orderNumber: string) =>
    request<OrderSummary>("GET", `/orders/${orderNumber}`),

  // saved addresses (the checkout address book)
  getAddresses: () => request<ApiAddress[]>("GET", "/addresses"),
  createAddress: (body: AddressInput) =>
    request<ApiAddress>("POST", "/addresses", body),
  updateAddress: (id: string, body: Partial<AddressInput>) =>
    request<ApiAddress>("PATCH", `/addresses/${id}`, body),
  deleteAddress: (id: string) => request<void>("DELETE", `/addresses/${id}`),

  // support tickets
  myTickets: () => request<Ticket[]>("GET", "/support/mine"),
  getTicket: (id: string) => request<Ticket>("GET", `/support/${id}`),
  replyToTicket: (id: string, body: string) =>
    request<Ticket>("POST", `/support/${id}/reply`, { body }),

  // reviews
  getReviews: (slug: string) =>
    request<ApiReview[]>("GET", `/products/${slug}/reviews`),
  submitReview: (
    slug: string,
    body: { rating: number; title?: string; body?: string },
  ) => request<ApiReview[]>("POST", `/products/${slug}/reviews`, body),

  // contact + newsletter
  sendContact: (body: {
    name: string;
    email: string;
    subject?: string;
    message: string;
  }) => request<{ ok: boolean }>("POST", "/contact", body),
  subscribe: (email: string) =>
    request<{ ok: boolean }>("POST", "/subscribe", { email }),

  // store settings (public) + currency rates
  getSettings: () => request<StoreSettings>("GET", "/settings"),
  getRates: () =>
    request<{ base: string; rates: Record<string, number>; fetchedAt: number }>(
      "GET",
      "/currency/rates",
    ),
};

export interface ApiReview {
  id: string;
  rating: number;
  title?: string | null;
  body?: string | null;
  author?: string;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  supportEmail: string;
  contactPhone: string;
  whatsapp: string;
  addressLine: string;
  baseCurrency: string;
  freeShipping: boolean;
  freeShippingThresholdCents: number;
  flatShippingCents: number;
  codEnabled: boolean;
  bankTransferEnabled: boolean;
  cardEnabled: boolean;
  bankDetails: string;
}

export interface OrderSummary {
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  total: number;
  subtotal: number;
  discount: number;
  createdAt: string;
  items: { name: string; price: number; qty: number; lineTotal: number }[];
  /** Address snapshot taken at checkout. */
  shipping?: OrderAddress | null;
  /** Status timeline, oldest first — powers the tracking view. */
  events?: OrderEvent[];
}

export interface OrderAddress {
  name?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface OrderEvent {
  status: string;
  note?: string | null;
  createdAt: string;
}

export interface ApiAddress {
  id: string;
  label?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  country: string;
  postalCode?: string | null;
  phone?: string | null;
  isDefault: boolean;
}

export type AddressInput = Omit<ApiAddress, "id">;

export interface TicketReply {
  id: string;
  body: string;
  fromAdmin: boolean;
  authorName: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  subject?: string | null;
  message: string;
  status: "OPEN" | "ANSWERED" | "CLOSED";
  createdAt: string;
  updatedAt: string;
  replies: TicketReply[];
}
