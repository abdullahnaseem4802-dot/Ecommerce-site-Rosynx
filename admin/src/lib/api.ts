const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

const TOKEN_KEY = "rosynx-admin-token";
const REFRESH_KEY = "rosynx-admin-refresh";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string) {
  localStorage.setItem(TOKEN_KEY, t);
}
export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}
export function setRefreshToken(t: string) {
  localStorage.setItem(REFRESH_KEY, t);
}
export function setTokens(access: string, refresh?: string) {
  setToken(access);
  if (refresh) setRefreshToken(refresh);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

/**
 * Attempt a single access-token refresh using the stored refresh token.
 * Returns the new access token on success, or null on failure.
 * Concurrent 401s share the same in-flight refresh so we only hit
 * /auth/refresh once.
 */
let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refresh = getRefreshToken();
    if (!refresh) return null;
    try {
      const res = await fetch(`${API}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as {
        accessToken: string;
        refreshToken?: string;
      };
      if (!data.accessToken) return null;
      setTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    } catch {
      return null;
    }
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

function onAuthFailure() {
  clearToken();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

async function doFetch(
  method: string,
  path: string,
  body: unknown,
  token: string | null,
): Promise<Response> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  // Never refresh-retry the refresh call itself.
  const isRefreshCall = path === "/auth/refresh";

  let res = await doFetch(method, path, body, getToken());

  if (res.status === 401 && !isRefreshCall) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await doFetch(method, path, body, newToken);
      if (res.status === 401) onAuthFailure();
    } else {
      onAuthFailure();
    }
  }

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

export const api = {
  get: <T>(p: string) => request<T>("GET", p),
  post: <T>(p: string, b?: unknown) => request<T>("POST", p, b),
  patch: <T>(p: string, b?: unknown) => request<T>("PATCH", p, b),
  del: <T>(p: string) => request<T>("DELETE", p),
};

// ---- shared types ----
export interface Product {
  id: string;
  number: number;
  slug: string;
  name: string;
  short: string;
  description: string;
  price: number;
  oldPrice: number | null;
  priceCents: number;
  regularPriceCents: number;
  onSale: boolean;
  material: string | null;
  dimensions: string | null;
  weight: string | null;
  finish: string | null;
  origin: string | null;
  care: string | null;
  colors: string[];
  badges: string[];
  inStock: boolean;
  sku: string | null;
  stockQty: number;
  lowStockThreshold: number;
  stockStatus: "in" | "low" | "out";
  isActive: boolean;
  rating: number;
  reviews: number;
  sales: number;
  categories: { slug: string; name: string }[];
  image: string | null;
  images: string[];
}

export interface DashboardStats {
  kpis: {
    revenue: number;
    orders: number;
    customers: number;
    products: number;
    pendingOrders: number;
  };
  orderStatus: { status: string; count: number }[];
  revenueSeries: { label: string; total: number }[];
  topProducts: { name: string; image: string | null; sales: number; price: number }[];
  recentOrders: {
    orderNumber: string;
    email: string;
    total: number;
    status: string;
    createdAt: string;
  }[];
  recentCustomers: { id: string; name: string; email: string; createdAt: string }[];
  lowStock: { name: string; image: string | null; stockQty: number }[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  orders: number;
  totalSpent: number;
  joinedAt: string;
}

export interface CustomerAddress {
  id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
  phone: string | null;
  isDefault: boolean;
}

/** GET /admin/customers/:id — the customer detail view. */
export interface CustomerDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  joinedAt: string;
  ordersCount: number;
  totalSpent: number;
  orders: {
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
  }[];
  addresses: CustomerAddress[];
}

export interface AdminReview {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  isApproved: boolean;
  author: string;
  authorEmail: string;
  product: string;
  productSlug: string;
  createdAt: string;
}

export interface InventoryStats {
  totalProducts: number;
  totalStock: number;
  lowStock: number;
  outOfStock: number;
  stockValue: number;
}
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}
export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string | null;
  featured: boolean;
  sortOrder: number;
  productCount: number;
  products: number;
}

export interface StoreSettings {
  id: string;
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
  jazzcashEnabled: boolean;
  easypaisaEnabled: boolean;
  cardEnabled: boolean;
  bankName: string;
  bankAccountTitle: string;
  bankAccountNumber: string;
  bankIban: string;
  jazzcashNumber: string;
  jazzcashName: string;
  easypaisaNumber: string;
  easypaisaName: string;
  bankDetails: string;
  welcomeCouponCode: string;
}

export type TicketStatus = "OPEN" | "ANSWERED" | "CLOSED";

export interface ContactReply {
  id: string;
  body: string;
  fromAdmin: boolean;
  authorName: string;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  isRead: boolean;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  replies: ContactReply[];
}

export interface Subscriber {
  id: string;
  email: string;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  author: string | null;
  category: string | null;
  imageUrl: string | null;
  readTime: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
}
export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentReference?: string | null;
  email: string;
  total: number;
  subtotal: number;
  discount: number;
  couponCode: string | null;
  items: { name: string; price: number; qty: number; lineTotal: number }[];
  shippingAddress: Record<string, string> | null;
  createdAt: string;
}
export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface Coupon {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minSubtotalCents: number;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
}
