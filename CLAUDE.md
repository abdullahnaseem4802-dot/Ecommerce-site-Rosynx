# CLAUDE.md — ROSYNX project context

Orientation for Claude (and humans) working in this repo. Read this first, then dive into the folder you need. This file is the durable summary of the whole build; the blow-by-blow history lives in Claude's memory files (see **Memory** at the bottom).

---

## 1. What this is

**ROSYNX** is a full-stack, database-driven e-commerce platform — a custom rebuild of an old WooCommerce/WordPress store (`rosynx.com`), handmade-luxury goods (onyx, stone, wood, leather, home décor). It is deployed and live for **stakeholder testing**. The old WooCommerce site is **reference-only** — never rebuild WordPress; the analysis of it is in `docs/backend-analysis.md`.

Three apps in one repo (npm, not a monorepo tool — each app has its own `package.json`):

| Folder | App | Stack | Local port | Deployed |
|--------|-----|-------|-----------|----------|
| `backend/`  | REST API, prefix `/api/v1` | NestJS 11 · Prisma 6 · PostgreSQL (Neon) · JWT+RBAC | 4000 | Render, Singapore |
| `frontend/` | Storefront | Next.js 16 (Turbopack) · React 19 · Tailwind v4 · Zustand | 3000 | Vercel `rosynx-store` |
| `admin/`    | Admin panel | Next.js 16 · React 19 · Tailwind v4 · framer-motion | 4001 | Vercel `rosynx-admin` |

- **DB**: Neon Postgres (Singapore). **Images**: Cloudinary (behind a swappable `StorageService`). **Money**: integer cents + currency column.
- **Live**: store `https://rosynx-store.vercel.app` · admin `https://rosynx-admin.vercel.app` · API `https://rosynx-api.onrender.com/api/v1`.
- **Admin login**: `admin@rosynx.com` / `secret12345`.
- **GitHub**: `github.com/abdullahnaseem4802-dot/Ecommerce-site-Rosynx` (private).

> ⚠️ **This is NOT the Next.js you were trained on.** Next 16 + Tailwind v4 have breaking changes. Before writing frontend/admin code, read the relevant guide under `frontend/node_modules/next/dist/docs/` (see `frontend/AGENTS.md`). Tailwind v4 uses CSS `@theme` — there is no `tailwind.config.js`.

---

## 2. Run & build

Start the **backend first** (the storefront/admin fetch the catalog live from it).

```bash
cd backend  && npm install && npm run start        # http://localhost:4000/api/v1  (health: /api/v1/health)
cd frontend && npm install && npm run build && npm run start   # http://localhost:3000
cd admin    && npm install && npm run build && npm run start   # http://localhost:4001
```

**Windows kill-stale gotcha (cost real time before):** the Node process shows its path with **backslashes** (`dist\main`). A `Stop-Process` filter using `*dist/main*` silently fails → new server hits `EADDRINUSE` and the **stale build keeps serving**. Kill by PID via `Get-NetTCPConnection -LocalPort <port>` (use `$op`, not the read-only `$pid`), or match `*dist\main*`. Same for stale `next start`. After any code change, kill by PID and restart or you test stale code. Many "it's not done" reports were just a stale build.

---

## 3. Backend (`backend/src/`)

NestJS. Global prefix `/api/v1`, global `ValidationPipe`, global `JwtAuthGuard` with `@Public()` opt-out, `RolesGuard` + `@Roles(Role.ADMIN)`, `@CurrentUser`. `PrismaModule`/`PrismaService` are `@Global`. Prisma is **pinned to v6** — do NOT let it go to v7 (v7 dropped schema `url`/`directUrl`).

**Modules** (one folder each):
- `auth` — register/login/refresh/me, bcrypt(12), JWT access+refresh. **Signup email verification** (OTP): register creates the account UNVERIFIED + emails a 6-digit code (no tokens); `verify-email` + `resend-verification`; login 403s unverified customers with `{ code: 'EMAIL_NOT_VERIFIED' }`. **Forgot-password OTP**: `forgot-password` + `reset-password` (bcrypt-hashed, 15-min expiry, 5-try throttle). `change-password`. Real-email DNS/MX validation on register. `jwt.strategy.ts` does a per-request `isActive` lookup (blocks are immediate; throws 503 not 401 on DB cold-start so nobody gets logged out).
- `products` — public list (category/material/price/search filters + sort + pagination, 200 cap), `/:slug`, `/:slug/related`, admin CRUD. `product.serializer.ts` maps integer-cents → display. Spec fields: dimensions/weight/finish/origin/care. Stock: `sku`, `stockQty`, `lowStockThreshold`, `stockStatus`.
- `categories` — list/`:slug` + admin CRUD.
- `cart` — guest (`x-guest-token` header) or user, `OptionalJwtAuthGuard`, merge-on-login.
- `wishlist` — auth.
- `coupons` — validate/apply + admin CRUD; `:id/broadcast` emails the code to all subscribers. Codes are case-insensitive (stored uppercased). Never shown publicly.
- `orders` — server-recomputed totals+coupon; COD→PENDING / BANK_TRANSFER→ON_HOLD / CARD→sandbox or Paymob. `order_events` append-only table drives the tracking timeline. Checkout requires auth server-side.
- `payments` — `paymob.service.ts` (config-gated intention+webhook). Sandbox card flow when `PAYMOB_API_KEY` unset.
- `reviews` — public post/list per product + admin moderation; recomputes ratingAvg/Count.
- `addresses` — CRUD, default handling.
- `currency` — free no-key FX (`open.er-api.com`), 12h cache, base = `BASE_CURRENCY=USD`. Orders settle in base currency; display-only conversion.
- `contact` / `subscribers` / `settings` / `blog` / `faq` — public + admin. `settings` is a singleton (store name/currency/shipping/payment toggles/bank details/support email/welcome coupon). `subscribers` emails a welcome coupon to new subscribers.
- `email` — **swappable transport** (`EmailService.send()` routes on `EMAIL_PROVIDER`: console | resend | gmail/smtp | brevo-planned). All user-facing mail goes through here. ⚠️ **See Open issues — email is the one thing not fully working.**
- `admin` — `GET /admin/stats`, `/admin/customers`, `/admin/inventory-stats`, customer detail (edit/block/reset-password).
- `storage`/`uploads` — Cloudinary `StorageService` + `POST /uploads/image`.
- `revalidate` — fire-and-forget POST to the storefront's `/api/revalidate` after admin edits (on-demand ISR; 8s timeout, all errors swallowed).
- `keepalive` — pings `SELF_URL` every 10 min so the Render free instance never spins down.

**Prisma / migrations** (`backend/prisma/`): schema is the source of truth; history was **baselined** into a single `0_init` on 2026-07-15. Workflow for a schema change: `prisma migrate diff --from-url "$DIRECT_URL" --to-schema-datamodel prisma/schema.prisma --script` to preview → hand-write `prisma/migrations/<ts>_name/migration.sql` → `prisma migrate deploy`. **NEVER `prisma migrate dev`** (offers to reset/drop the prod DB). `.gitignore` keeps migration SQL (`!backend/prisma/migrations/**/*.sql`) but still ignores `reference/`.

---

## 4. Storefront (`frontend/src/`)

Next 16 App Router. `app/` routes, `components/`, `lib/`. **DB-driven** (not a static catalog).

- **Data layer**: `lib/catalog.ts` (isomorphic server fetch — `fetchAllProducts`, `fetchProductBySlug`, `fetchRelated`, `fetchCategories`, `fetchBlogPosts`, `mapProduct`); `lib/catalog-client.ts` (client cache); `lib/api.ts` (JWT in localStorage `rosynx-token`, guest cart in `rosynx-guest`); `lib/client-cache.ts` (memory + in-flight dedupe + sessionStorage TTL).
- **State**: Zustand. `lib/store.ts` (`useShop`) = server-backed cart/wishlist keyed on the stable `apiId` (backend cuid — NOT the numeric id, which can collapse to 0 on a cold cache and wipe the cart). `lib/auth.ts` (`useAuth`) = real JWT auth. `useStoreSync()` hydrates on mount.
- **Money**: `lib/currency.ts` (`useMoney().format`) — IP geo-detect + header switcher; falls back to USD if rates haven't loaded.
- **Pages**: home (Hero→CategoryStrip→FeaturedCategories→NewArrivals→ShopByMaterial→…→Blog), `/shop` (filters/sort/pagination), `/product/[id]` (SSG), `/cart`, `/checkout`→`/order-success`, `/wishlist`, `/search`, `/account` (+orders/profile/addresses/support, auth-gated), `/about`, `/contact`, `/faqs`, `/blogs`+`/blog/[slug]`, policy pages.
- **Add-to-cart requires an account** — single gate in `lib/use-add-to-cart.ts`; signed-out → pending-add (sessionStorage) → `/account?redirect=` → flush after login.
- **Theme**: White · Charcoal · Copper. Tokens keep OLD names in `app/globals.css` `@theme` but remapped values (`bg-cream`=white, `text-espresso`=charcoal, `bg-brand`=copper #b45309). Fonts: Playfair Display (headings) + Inter (body). Hero is a dark band with a layered scrim so white text stays readable.
- **Images**: real photos **downloaded locally** to `public/images/` (never hotlink), **JPEG** (user rejected WebP). Logo is `public/images/logo.png`. `SplashScreen` on load.
- **Gotchas**: lucide-react has no brand icons (hand-rolled SVGs). `suppressHydrationWarning` on `<html>`/`<body>` (user's Dark Reader extension injects attrs → hydration mismatch; it also dims the white theme to gray — tell the user to disable it for localhost if they report gray). Removed: floating WhatsApp button, X/FB/Insta follow icons, "Best Seller" concept.

---

## 5. Admin (`admin/src/`)

Next 16, same token names but `rosynx-admin-token`; stores BOTH access+refresh and auto-refreshes on 401 (dropping the refresh token was the real cause of "unauthorized when saving"). Light White/Charcoal/Copper theme (same `@theme` token remap trick). Glassmorphism full-screen login (no default admin email pre-filled — security). Pages: Dashboard (KPIs + hand-rolled SVG charts, no chart lib), Orders, Products, Categories, Inventory, Customers, Reviews, Coupons, Settings. Mobile hamburger drawer. Eye/view buttons deep-link to the storefront via `NEXT_PUBLIC_STOREFRONT_URL`.

Admin and storefront **share one backend** — orders are the same records; an admin status change reflects on the customer's `/account/orders` immediately.

---

## 6. Deployment

- **Backend → Render** free web service `rosynx-api`, region **Singapore** (co-located with Neon — cross-region added ~180ms/query). Deployed via `render.yaml` blueprint. Build: `npm install --include=dev && npx prisma generate && npm run build` (`--include=dev` is required — NestJS build tools are devDeps and `NODE_ENV=production` would skip them). Start: `npm run start:prod`.
- **Storefront/Admin → Vercel**, root dirs `frontend`/`admin`, region sin1. Set each app's `NEXT_PUBLIC_API_URL` before building.
- **Performance** (already fixed, don't regress): `/shop` TTFB was 6.2s → 72ms. Root cause was the **ISR revalidate cap** — a page's `revalidate` is capped by the smallest `fetch` revalidate inside it, so a `30` in `catalog.ts` forced every page to 30s and saturated the 0.1-CPU instance. Now `getJSON` default is 600s (blog 300s), `/shop` 300s, `/product/[id]` 600s; admin edits still appear in ~2s via **on-demand revalidation** (`revalidatePath` webhook, needs `REVALIDATE_SECRET` identical on Render+Vercel + `STOREFRONT_URL`). **Do NOT lower these fetch revalidates to "fix" staleness** — check the webhook instead. Cold starts (~9s) are prevented by `KeepAliveService` pinging `SELF_URL` every 10 min.
- **Env vars**: see `render.yaml` (backend) and README. Render **can't change region in place** — recreating the service **wipes all env vars** (the `sync:false` secrets must be re-entered by hand).

---

## 7. Open issues (what's NOT done)

1. **⚠️ Transactional email doesn't reach real customers — the #1 blocker.** Full detail in memory `email-delivery.md`. Summary:
   - **Resend** (currently configured) without a verified domain only delivers to the account owner (`bibasultangarage@gmail.com`) — 403 for everyone else. Fixing needs a **purchased domain**, which the user refuses.
   - **Gmail/any SMTP** times out on Render (ports 465 AND 587) — Render's free tier **blocks outbound SMTP**. Not an auth problem; no SMTP tweak fixes it.
   - **The fix = Brevo** (HTTP API, port 443, free 300/day, single-sender verification, no domain). Transport is **not yet coded** — add `sendViaBrevo` to `EmailService` (mirror `sendViaResend`; `POST https://api.brevo.com/v3/smtp/email`, header `api-key`, body `{sender,to:[{email}],subject,htmlContent}`), route on `EMAIL_PROVIDER=brevo`, then guide the user through a Brevo account + single-sender verify + API key + Render env.
   - **TEMP DEBUG is still live in prod (commit `87b7949`) and MUST be reverted**: `auth.service.ts` `sendVerifyOrFail` throws `EMAILDEBUG: …` (restore the clean "We couldn't send your verification email…" message); `email.service.ts` `sendViaSmtp` catch throws `SMTP: …` (restore `'Email send failed (SMTP)'`).
2. **Credentials exposed in chat/screenshots — user should rotate:** the Resend API key, the GitHub fine-grained PAT, and the Gmail App Password (`eveo rykq kerq vaeo`, full Gmail access).
3. **Push auth**: the user removed Windows cred-manager creds (to avoid clashing with another GitHub account), so `git push` needs a **fine-grained PAT with Contents: Read+write** (granting only "Actions" does NOT allow push).
4. **2 legacy orders have `userId=NULL`** (pre-auth-gate) — admin-only; don't backfill without asking. Deleting a user orphans their orders/tickets (SetNull) — delete those explicitly first.
5. Not built (lower priority): compare page, dedicated category routes, product 360/video, recently-viewed, blog comments, real card gateway (Paymob is sandbox/UI-only).

---

## 8. Security & data rules (persistent)

- Repo stays **private**. `reference/` (WooCommerce dump: `wp-config.php` + `APP-DATA.SQL` with real customer PII) and all `.env` files are **never** committed or published.
- **Never `prisma migrate dev`** on the Neon DB (offers to drop it). Use `migrate diff` → hand-written SQL → `migrate deploy`.
- Test/dummy data uses `e2e.*@gmail.com` or `@example.com` and **must be deleted after testing** (scripts do this via `prisma.user.deleteMany`).
- Real preserved data: 146 products, 9 categories, ~9 users (all `emailVerified=true`), 1 real subscriber.
- DB/data mutations against prod are treated as production actions — get explicit authorization by name before running them.

---

## 9. Memory

Claude keeps durable project memory (the full session-by-session history) at
`C:\Users\Administrator\.claude\projects\G--Projects-freelance-Ecommerce-site\memory\`.
`MEMORY.md` there is the index. The files, and what each covers:

- `rosynx-frontend.md` — storefront stack, theme, image conventions, UI gotchas.
- `rosynx-backend.md` — backend build, old-WooCommerce DB facts, stack decisions, module history, admin panel.
- `live-data-architecture.md` — the static-catalog → live-API refactor, new modules, currency, payments sandbox.
- `deployment.md` — hosts, URLs, regions, env vars, and every deploy gotcha (incl. the migration baseline).
- `accounts-tracking-support.md` — auth-gated cart, order timeline, addresses, admin customer mgmt, support tickets.
- `storefront-performance.md` — the ISR revalidate cap, client fetch waterfall, cold-start fix.
- `stakeholder-round-2.md` — the 25-item fix round (FAQ, forgot-password OTP, coupon email, cart race, support badge).
- `stakeholder-round-3.md` — signup email OTP verification, validation, welcome coupon, removed socials; then the email saga.
- `email-delivery.md` — **the open email blocker and the Brevo fix path** (start here for email work).

**To resume email work next session:** read `email-delivery.md`, implement `sendViaBrevo`, revert the TEMP debug, then guide the user through Brevo setup. See Open issues §7.
