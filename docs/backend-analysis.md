# ROSYNX — Backend Analysis & Architecture Report

> Author: Lead Architect analysis. Status: **Analysis only — no code yet.**
> Source of truth for UI/flow = `frontend/` (Next.js). Source of *business knowledge* = old WooCommerce site (`reference/rosynx/`), inspected against the **live local MySQL DB `rosynx`** (not just the SQL dump).

---

## Phase 1 — Project Structure

| Thing | What it is | Verdict |
|---|---|---|
| `frontend/` | NEW Next.js 16 + React 19 + Tailwind v4 storefront (frontend-only, mock data in `src/lib/data.ts`). | **Future = source of truth for UI/flow.** |
| `reference/rosynx/` | Full WordPress 6.x + WooCommerce 10.9 install downloaded from production (`rosynx.com`). | **Reference only.** Do not rebuild. |
| `reference/rosynx/APP-DATA.SQL` | 22 MB production DB dump. | Imported locally as DB `rosynx` (prefix `fh7d_`). |
| Live DB | MySQL via XAMPP, `root` / no password, DB `rosynx`. | **Verified live** — schema + data inspected directly. |

**Key environment facts (from `wp-config.php` / `APP-META.INI` / live options):**
- Currency **USD**, `price_num_decimals = 0` (whole-dollar prices), **taxes disabled** (`woocommerce_calc_taxes = no`), weight unit `kg`.
- Store base country **PK:PB** (Pakistan, Punjab) — a Pakistan-based artisan store selling in USD.
- Order Storage = **HPOS / High-Performance Order Storage** is active (WooCommerce writes orders to dedicated `wc_orders*` tables, not `posts`).

---

## Phase 2 — Database Analysis (every table, evaluated)

The DB has **73 tables**. They fall into 5 buckets. Row counts are from the live DB.

### 2.1 Real business data (KEEP the knowledge, redesign the schema)

| Table | Rows | Purpose | Verdict for new backend |
|---|---|---|---|
| `fh7d_posts` (post_type=`product`) | **146 publish** + 1 draft | The product catalog. | Redesign → `products` table. |
| `fh7d_postmeta` | 5,970 | EAV key/value store for product price/stock/images/etc. | **Kill the EAV** — flatten into real columns. |
| `fh7d_terms` / `fh7d_term_taxonomy` / `fh7d_term_relationships` | 30 / 30 / 394 | Categories + tags + product-type/visibility terms. | Redesign → `categories` + `product_categories` join. |
| `fh7d_wc_orders` | 1 | Orders (HPOS). | Redesign → `orders`. |
| `fh7d_wc_order_addresses` | 2 | Billing + shipping per order. | Fold into `orders` (JSON snapshot) or `order_addresses`. |
| `fh7d_woocommerce_order_items` / `_itemmeta` | 6 / 51 | Order line items (products + shipping line). | Redesign → `order_items`. |
| `fh7d_wc_order_operational_data` | 1 | Paid date, totals, etc. | Merge into `orders`. |
| `fh7d_users` / `fh7d_usermeta` | 3 / 136 | Accounts (1 admin, 2 customers). | Redesign → `users` (+ RBAC). |
| `fh7d_comments` (type=`review`) | **2 reviews** | Product reviews (WP comments). | Redesign → `reviews`. Barely used but the frontend expects reviews. |
| `fh7d_woocommerce_shipping_zones/methods/zone_locations` | 1/1/1 | One zone, "Free shipping". | Redesign → `shipping_methods` (simple). |

### 2.2 WooCommerce performance/lookup tables (DO NOT copy — they're denormalized caches)

`wc_product_meta_lookup`, `wc_category_lookup`, `wc_customer_lookup`, `wc_order_product_lookup`, `wc_order_stats`, `wc_order_tax_lookup`, `wc_order_coupon_lookup`, `wc_product_attributes_lookup`, `wc_admin_notes(+actions)`.
→ These exist **only because WooCommerce's EAV is too slow to query**. A proper relational schema makes them unnecessary. Their *existence* is the strongest argument for abandoning the WP data model. **Discard all.**

### 2.3 Plugin tables = the real "hidden" business features (extract the intent, drop the tables)

| Table(s) | Plugin | Business feature it implies |
|---|---|---|
| `paymob_gateways`, `paymob_cards_token`, `paymob_pixel_intentions` | **Paymob for WooCommerce** | Card payments via Paymob (MENA gateway). Empty → configured but no live card orders yet. |
| `yith_wcwl*` (`wcwl`, `wcwl_lists`, `wcwl_itemmeta`) | **YITH Wishlist** | Wishlist (persisted per user, multiple named lists). Frontend already has wishlist. |
| `woolentor_abandoned_cart*` | **WooLentor** | Abandoned-cart capture + recovery emails (templates table has 3 rows). |
| `wpforms_*` | **WPForms** | Contact form submissions/logging. |
| `woocommerce_sessions` | WooCommerce | Guest cart/session store (1,085 rows — mostly bot/guest sessions). |
| `woocommerce_payment_tokens*` | WooCommerce | Saved payment methods (empty). |
| `addonlibrary_addons/_categories`, `tm_tasks/_taskmeta`, `e_events`, `bv_*`, `wpo_404_detector`, `wpfm_backup`, `wc_webhooks`, `wc_rate_limits`, `wc_reserved_stock` | Elementor / builder / backup / security plugins | **UI, caching, backup, analytics noise. Ignore entirely.** |

### 2.4 Infrastructure/plumbing (ignore)

`actionscheduler_*` (WP cron queue), `options` (891 rows of WP + plugin settings — mine for config values only), `wp_font_*`, `custom_css`, `revisions`, `nav_menu*`, `elementor*`, `woolentor-template`.

### 2.5 The verdict on the old schema

**The WooCommerce schema is NOT suitable to reuse.** It is:
- **EAV-based** — every product fact (`_price`, `_stock_status`, `_thumbnail_id`, …) is a row in `postmeta`. 146 products already generate ~6,000 meta rows. This is unqueryable without the lookup-cache tables.
- **Overloaded `posts` table** — products, pages, blog posts, media, menus, Elementor templates, revisions all live in ONE table (841 rows for 146 real products).
- **Serialized PHP blobs** — roles, attributes, settings stored as `a:1:{s:13:"administrator"...}`. Opaque to any non-PHP consumer.
- **Plugin sprawl** — 30+ tables for features a custom backend expresses in a handful of clean tables.

→ **Recommendation: design a fresh, normalized schema (Phase 6). Migrate the *data*, not the structure.**

---

## Phase 3 — Business Features (extracted from data + plugins)

What the old store actually *does*, ranked by evidence:

1. **Catalog** — 146 **simple products** (0 variable, 0 grouped). No SKUs used (0 products have a SKU). No product attributes configured. So: name, description, price, sale price, images, category, in/out stock. That's it. **Deliberately simple catalog.**
2. **Pricing** — regular price + optional sale price (86 of 146 on sale). Whole-dollar USD. No tax logic.
3. **Inventory** — stock is **not** quantity-tracked (`_manage_stock = no`); products carry a simple `instock` / `outofstock` flag.
4. **Categories** — 10 flat categories, material/collection based: Luxury (61), Onyx (39), Stone (22), Wood (21), Home Decore (20), Kitchen Items (15), Rosewood (14), Best Seller (12), Leather, Uncategorized. No hierarchy.
5. **Media** — each product: 1 main image + 1 hover/secondary image (`wpr_secondary_image_id`) + a gallery (`_product_image_gallery`). 574 media attachments total.
6. **Cart & checkout** — guest checkout supported (the 1 order was `customer_id = 0`, guest). Payment via **BACS (direct bank transfer)** on the real order; **Paymob** card gateway installed for online payment.
7. **Shipping** — single zone, **Free shipping** method. No weight/rate logic in practice.
8. **Orders** — full lifecycle statuses (the sample order is `on-hold`, typical for pending bank transfer). Line items snapshot product name + a shipping line.
9. **Reviews/ratings** — enabled; only 2 real reviews exist. Frontend shows ratings, so keep the capability.
10. **Wishlist** — YITH wishlist (per-user, supports named lists).
11. **Abandoned cart recovery** — WooLentor captures carts + emails templates (3 configured).
12. **Accounts & roles** — WP roles: `administrator`, `customer`. Only these two matter.
13. **Contact forms** — WPForms.
14. **Auxiliary (installed, unused/marginal):** Payoneer & Mastercard gateways, GTranslate multi-language, GDPR consent, social login (Easy Login). Treat as *optional/future*, not core.

---

## Phase 4 — Old Store vs. New Frontend

The new frontend (`src/lib/data.ts`, `store.ts`, `auth.ts`) already models most of this — with **mock data and localStorage only, no backend.**

| Domain | Old store (WooCommerce) | New frontend (current) | Gap |
|---|---|---|---|
| Products | 146 simple products, DB-backed | `Product` type: id, slug, name, category, material, price, oldPrice, rating, reviews, sales, badges, colors, inStock, sku, images, short — **generated seed data** | Needs real API + real 146 products migrated. Frontend has richer fields (colors, material, badges) than Woo stored. |
| Categories | 10 flat, material-based | `categories[]` hardcoded, aligns well (luxury/onyx/stone/wood/rosewood/leather…) | Wire to API; counts are hardcoded. |
| Cart | Woo sessions (server) | Zustand `useShop`, **localStorage only** | Needs server cart or at least server-validated checkout. |
| Wishlist | YITH (server, per-user) | Zustand `wishlist: number[]`, localStorage | Needs server persistence per user. |
| Compare | Plugin | In store but **removed from UI** | Drop (matches recent frontend decision). |
| Auth | WP users + cookies | `useAuth` — **fake login, no password, localStorage** | Needs real JWT auth + RBAC. |
| Checkout/Orders | Real Woo orders + BACS/Paymob | `/checkout` validates → `/order-success`, **no persistence** | Needs real order creation + payment. |
| Reviews | WP comments (2) | `rating`/`reviews` numbers on product | Needs review submission + storage. |
| Coupons | Woo coupons | `ROSYNX10` / `WELCOME15` **hardcoded in UI** | Needs coupon engine. |
| Search/Filter | Woo + plugins | Client-side filter/sort over mock data | Needs API query params (already shaped for it). |
| Blog | WP posts (6) | `content.ts` static blogs | Optional: CMS or static. Low priority. |

**Alignment is high** — the frontend was clearly designed with this catalog in mind. The backend's job is to make the existing frontend real, not to add scope.

---

## Phase 5 — Missing Features (what the backend must provide)

**Must-have (MVP — to make the current frontend function):**
1. Auth: register / login / logout with **JWT** (access + refresh), password hashing (bcrypt/argon2).
2. RBAC: `customer` + `admin` roles (guard admin/catalog-write endpoints).
3. Products API: list (filter by category/material/price/sort, paginate), get by slug/id, related.
4. Categories API.
5. Cart: server-side cart (or stateless cart validated at checkout) tied to user/guest token.
6. Wishlist: persisted per user.
7. Orders: create order, list my orders, order detail, status lifecycle.
8. Checkout + Payment: order creation + **Paymob** integration (primary, MENA/PK-friendly) with a manual/BACS fallback; webhook to confirm payment.
9. Coupons: validate + apply (replace hardcoded ROSYNX10/WELCOME15).
10. Reviews: submit + list per product; recompute product rating.
11. Admin: CRUD products, categories, orders (status), coupons.
12. Image handling: upload + serve (see storage rec).

**Should-have (v1.1):**
- Abandoned-cart capture + email (WooLentor parity).
- Transactional email (order confirmation, shipping) via provider.
- Address book per user.
- Inventory as simple in/out flag (match old behavior); optional quantity later.

**Nice-to-have (later):**
- Multi-language, social login, saved cards, analytics, blog CMS.

**Explicitly DO NOT carry over:** EAV/postmeta model, WordPress roles blob, lookup-cache tables, Elementor/theme/builder data, NitroPack/UpdraftPlus/security plugins, comparison feature.

---

## Phase 6 — Improved Database Schema (PostgreSQL)

Clean, normalized, no EAV. (Prisma-style; snake_case tables.)

```
users            (id, email UNIQUE, password_hash, name, phone, role[customer|admin],
                  email_verified, created_at, updated_at)
addresses        (id, user_id FK, label, line1, line2, city, state, country,
                  postal_code, phone, is_default)

categories       (id, slug UNIQUE, name, description, image_url, sort_order, is_featured)

products         (id, slug UNIQUE, name, short_desc, description,
                  price_cents INT, sale_price_cents INT NULL,
                  in_stock BOOLEAN, is_active BOOLEAN,
                  rating_avg NUMERIC(2,1) DEFAULT 0, rating_count INT DEFAULT 0,
                  total_sales INT DEFAULT 0, created_at, updated_at)
product_images   (id, product_id FK, url, alt, position, is_primary)
product_categories (product_id FK, category_id FK, PK(product_id,category_id))
-- material/colors/badges: start as columns/enums on products
--   material TEXT, colors TEXT[], badges TEXT[]  (Postgres arrays — clean fit)

carts            (id, user_id FK NULL, guest_token NULL, created_at, updated_at)
cart_items       (id, cart_id FK, product_id FK, qty, UNIQUE(cart_id,product_id))
wishlist_items   (user_id FK, product_id FK, created_at, PK(user_id,product_id))

coupons          (id, code UNIQUE, type[percent|fixed], value,
                  min_subtotal_cents, starts_at, expires_at, usage_limit,
                  used_count, is_active)

orders           (id, order_number UNIQUE, user_id FK NULL (guest ok),
                  status[pending|on_hold|paid|processing|shipped|completed|cancelled|refunded],
                  currency DEFAULT 'USD',
                  subtotal_cents, discount_cents, shipping_cents, total_cents,
                  coupon_code NULL, payment_method[paymob|bacs],
                  payment_status[unpaid|paid|failed|refunded],
                  email, billing JSONB, shipping JSONB,   -- address snapshots
                  created_at, paid_at, updated_at)
order_items      (id, order_id FK, product_id FK NULL,
                  name_snapshot, price_cents_snapshot, qty, line_total_cents)

reviews          (id, product_id FK, user_id FK, rating INT CHECK(1..5),
                  title, body, is_approved, created_at)

payments         (id, order_id FK, provider[paymob|bacs], provider_ref,
                  amount_cents, status, raw JSONB, created_at)   -- webhook audit trail
```

**Design principles:** money as **integer cents** (never floats); address **snapshots** on orders (JSONB) so historical orders don't change when a user edits their address; Postgres **arrays/enums** for colors/badges/material instead of join tables (matches the small, fixed sets); no EAV anywhere; every lookup is a real indexed FK.

**Migration path:** one-off script reads the live MySQL (`products` from `posts`+`postmeta`, categories from `terms`, the order, users) → transforms → inserts into Postgres. ~146 products, trivial volume.

---

## Phase 7 — Backend Architecture (NestJS + TypeScript)

Confirmed your stack — it's the right call. Layered, modular, testable.

```
src/
  main.ts
  app.module.ts
  common/            guards, interceptors, filters, decorators, pipes
  config/            env schema (zod/joi), config service
  prisma/            PrismaModule + PrismaService (or TypeORM if preferred)
  modules/
    auth/            controller, service, jwt strategy, guards, dto
    users/           controller, service, repository, dto
    products/        controller, service, repository, dto
    categories/
    cart/
    wishlist/
    orders/
    coupons/
    reviews/
    payments/        paymob.service, webhook controller
    uploads/         cloudinary.service
    admin/           (or @Roles('admin') guards on the above)
  migration/         one-off woo→postgres import script
```

- **REST** with versioned prefix `/api/v1`, DTO validation via `class-validator`, global exception filter, response interceptor.
- **Auth:** Passport JWT, access + refresh tokens, `@Roles()` + `RolesGuard` for RBAC. Passwords argon2/bcrypt.
- **Data access:** Repository pattern. **Prisma** as ORM (your pick — endorsed; see Phase 8). Service layer holds business rules; controllers stay thin.
- **Payments:** Paymob intention/callback flow in `payments/`, HMAC-verified webhook updates `payments` + `orders.payment_status`.
- **Security:** helmet, rate-limiting (`@nestjs/throttler`), CORS locked to the frontend origin, input validation, no secrets in code (`.env` + config module).
- **Docs:** Swagger/OpenAPI auto-generated from DTOs.

---

## Phase 8 — Implementation Roadmap

| # | Milestone | Deliverable |
|---|---|---|
| 0 | Foundation | NestJS + Prisma + Postgres + config/env + Docker compose (db). Health check. |
| 1 | Schema + migration | Prisma schema (Phase 6) → migrate. Woo→Postgres import script. 146 real products in Postgres. |
| 2 | Auth + RBAC | Register/login/refresh, JWT, roles, guards. Wire frontend `useAuth` to real API. |
| 3 | Catalog API | Products (filter/sort/paginate) + categories + product detail + related. Replace frontend mock data. |
| 4 | Cart + Wishlist | Server cart + wishlist per user/guest. Replace localStorage-only stores. |
| 5 | Checkout + Orders | Coupon validation, order creation, my-orders. |
| 6 | Payments | Paymob integration + webhook + BACS fallback. |
| 7 | Reviews | Submit/list; recompute product rating. |
| 8 | Admin | Product/category/order/coupon management endpoints. |
| 9 | Emails + abandoned cart | Transactional email + cart recovery. |
| 10 | Hardening | Rate limiting, tests, Swagger, deploy (Railway/Render/Fly + managed Postgres). |

---

## Recommendations you asked for

### Database — **PostgreSQL + Prisma. Keep your pick. Strongly endorsed.**
Why it's the right fit here (not just generically):
- Your data is **inherently relational** — products↔categories↔orders↔users↔reviews with strict integrity. That's exactly Postgres's strength; a document DB (Mongo) would re-create the same join problems by hand.
- Small, structured catalog (146 products) → **no scaling pressure**; Postgres is effortless at this size and scales for years.
- Postgres extras you'll actually use: **arrays** (colors/badges), **JSONB** (address snapshots, payment webhook payloads, flexible metadata) — you get schema-less escape hatches *without* going NoSQL.
- **Prisma** gives type-safe queries end-to-end with TypeScript, painless migrations, and a great DX. (If you later want raw performance or advanced SQL, Prisma allows raw queries; TypeORM is the only real alternative and pairs slightly more idiomatically with NestJS — but Prisma's safety/DX wins for this project.)
- **Not MySQL**: you're *leaving* MySQL/WooCommerce; no reason to carry it forward, and Postgres's JSONB/arrays/constraints are stronger.
- **Not MongoDB**: orders + inventory + coupons need transactions and referential integrity — relational is correct.

### Storage — **Start with Cloudinary; design for S3 later.** (Endorsed, with a note.)
- **Cloudinary now**: generous free tier, built-in image CDN, on-the-fly resize/format/quality (`f_auto,q_auto`, responsive `srcset`) — you get performant product images with near-zero infra. Perfect for ~600 images and a catalog site. Most cost-effective for your current scale.
- **S3 later**: when volume/bandwidth grows, S3 + CloudFront is cheaper per-GB, but you must wire your own transform pipeline (Lambda@Edge / imgproxy). Not worth it yet.
- **Recommendation:** build an `uploads` module behind a **storage interface** (`StorageService`) with a Cloudinary implementation today; swapping to S3 later becomes a one-file change. Store only the URL/public_id in `product_images`. This gives you Cloudinary's cost/DX now and S3 portability for free.

### One honest caveat
Prices are stored as **whole USD** and taxes are off. Confirm the go-forward money model (currency, decimals, tax) before migration — I've modeled money as integer **cents** with a `currency` column so you're future-proof either way.

---

*Nothing above was assumed from WordPress code alone — every count, price, currency, order, user, and category figure was read from the live `rosynx` MySQL database.*
