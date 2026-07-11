# ROSYNX — Handmade Luxury Marketplace

Full-stack e-commerce platform (for stakeholder testing).

## Structure

| Folder | App | Stack | Local port |
|--------|-----|-------|-----------|
| `backend/`  | REST API | NestJS + Prisma + Neon PostgreSQL | 4000 |
| `frontend/` | Storefront | Next.js 16 + Tailwind v4 | 3000 |
| `admin/`    | Admin panel | Next.js 16 + Tailwind v4 | 4001 |

## Run locally

Each app has its own `.env` (see `backend/.env.example`). Install and start **backend first**, then the two Next.js apps:

```bash
# 1. Backend  (http://localhost:4000/api/v1)
cd backend  && npm install && npm run start

# 2. Storefront  (http://localhost:3000)
cd frontend && npm install && npm run build && npm run start

# 3. Admin panel  (http://localhost:4001)
cd admin    && npm install && npm run build && npm run start
```

Admin login: `admin@rosynx.com`.

## Required environment variables

**backend/.env**
```
DATABASE_URL=            # Neon PostgreSQL connection string
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES=60m
JWT_REFRESH_EXPIRES=7d
CLOUDINARY_URL=          # image storage
PORT=4000
```

**frontend/.env** and **admin/.env.local**
```
NEXT_PUBLIC_API_URL=https://<your-backend-host>/api/v1
```
Additionally, admin: `NEXT_PUBLIC_STOREFRONT_URL=https://<storefront-host>`.
Storefront: `NEXT_PUBLIC_WHATSAPP=+92XXXXXXXXXX` (optional).

## Deployment notes

This is a **Node server + Postgres** stack, not a static site:

- **Backend (NestJS)** must run on a Node host — e.g. Render, Railway, or Fly.io. It keeps a live connection to Neon Postgres.
- **Storefront & Admin (Next.js SSR)** deploy from GitHub to **Vercel** (one-click) or Cloudflare Pages (requires the `@cloudflare/next-on-pages` adapter).
- **Database**: Neon (already configured via `DATABASE_URL`).

Set each front-end's `NEXT_PUBLIC_API_URL` to the deployed backend URL before building.

> `reference/` (old WooCommerce dump) and all `.env` files are intentionally git-ignored.
