# ROSYNX — Handmade Luxury E-commerce Platform

A full-stack, database-driven e-commerce platform (storefront + admin panel + REST API), built as a custom replacement for an old WooCommerce/WordPress site. Currently deployed for stakeholder testing.

> **New to this repo? Read [`CLAUDE.md`](./CLAUDE.md) first** — it's the single orientation document (architecture, every module, deployment, live URLs, credentials, and the open issues). This README is the short version.

## Apps

| Folder | App | Stack | Local port | Deployed to |
|--------|-----|-------|-----------|-------------|
| `backend/`  | REST API (`/api/v1`) | NestJS 11 + Prisma 6 + PostgreSQL (Neon) | 4000 | Render (Singapore) |
| `frontend/` | Storefront | Next.js 16 + React 19 + Tailwind v4 | 3000 | Vercel (`rosynx-store`) |
| `admin/`    | Admin panel | Next.js 16 + React 19 + Tailwind v4 | 4001 | Vercel (`rosynx-admin`) |

- **DB**: Neon Postgres (Singapore). Images: Cloudinary. Email: pluggable (see below).
- **Live URLs**: store `https://rosynx-store.vercel.app` · admin `https://rosynx-admin.vercel.app` · API `https://rosynx-api.onrender.com/api/v1`.
- **Admin login**: `admin@rosynx.com` / `secret12345`.

## What it does

Real catalog (146 products, 9 categories, all images on Cloudinary), live server-rendered storefront, server-backed cart/wishlist, coupons, multi-currency display, COD + bank-transfer + sandbox-card checkout, order tracking timeline, saved addresses, product reviews, blog, FAQs, contact/support tickets, newsletter subscribe. Admin panel covers dashboard analytics, products, orders, categories, inventory, customers, reviews, coupons, and store settings.

**Auth & email:** signup requires email verification via a 6-digit OTP; forgot-password uses an OTP flow; subscribers get a welcome coupon. ⚠️ **Email delivery to real customers is the one open blocker** — see [`CLAUDE.md`](./CLAUDE.md) → "Open issues".

## Run locally

Each app has its own env file (not committed). Start the **backend first**, then the two Next.js apps.

```bash
# 1. Backend  →  http://localhost:4000/api/v1   (health at /api/v1/health)
cd backend  && npm install && npm run start

# 2. Storefront  →  http://localhost:3000
cd frontend && npm install && npm run build && npm run start

# 3. Admin panel  →  http://localhost:4001
cd admin    && npm install && npm run build && npm run start
```

> Both Next.js apps default to `dev` on port 3000 — set `admin` to 4001 (or use `npm run start` after a build). The catalog is served live from the API, so the backend must be running.

## Environment variables

**backend/.env** (also mirrored as Render env vars — see `render.yaml`)
```
DATABASE_URL=            # Neon pooled connection string
DIRECT_URL=              # Neon direct connection (for Prisma migrate)
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES=60m
JWT_REFRESH_EXPIRES=7d
CORS_ORIGINS=            # comma-separated storefront + admin URLs, no trailing slash
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
BASE_CURRENCY=USD
PORT=4000
# Email (pluggable transport) — see CLAUDE.md for the current state
EMAIL_PROVIDER=          # console | resend | gmail | smtp | brevo(planned)
EMAIL_FROM=ROSYNX <onboarding@resend.dev>
SUPPORT_EMAIL=
# Keep-alive + on-demand revalidation (prod)
DB_KEEPALIVE=true
SELF_URL=                # the backend's own public URL (prevents Render cold starts)
STOREFRONT_URL=          # for on-demand ISR revalidation after admin edits
REVALIDATE_SECRET=       # must match the Vercel storefront value
```

**frontend/.env** and **admin/.env.local**
```
NEXT_PUBLIC_API_URL=https://<backend-host>/api/v1
```
Admin additionally: `NEXT_PUBLIC_STOREFRONT_URL=https://<storefront-host>`.

## Deployment

Backend → Render (Node web service, deployed via `render.yaml` blueprint, Singapore region to co-locate with Neon). Storefront + admin → Vercel (root dirs `frontend` / `admin`, sin1 region). Full deploy notes, gotchas, and the migration workflow are in [`CLAUDE.md`](./CLAUDE.md).

> ⚠️ **Never run `prisma migrate dev`** against the Neon DB — it offers to reset (drop) the production database. Use the `migrate diff` → hand-write SQL → `migrate deploy` workflow documented in `CLAUDE.md`.

## Security & data

- Repo is **private**. `reference/` (old WooCommerce dump with real customer PII) and all `.env` files are git-ignored — never commit them.
- Test/dummy data uses `e2e.*@gmail.com` or `@example.com` addresses and must be deleted after testing.
