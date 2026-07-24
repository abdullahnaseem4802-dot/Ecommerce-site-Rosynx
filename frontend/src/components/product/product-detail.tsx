"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Check,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  Share2,
  Shield,
  ShoppingBag,
  Star,
  Truck,
} from "lucide-react";
import Link from "next/link";
import type { Product } from "@/lib/data";
import { useHydrated, useShop } from "@/lib/store";
import { useAddToCart } from "@/lib/use-add-to-cart";
import { useAuth } from "@/lib/auth";
import { api, type ApiReview } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useMoney } from "@/lib/currency";
import { ProductBadges } from "./product-badge";
import { cn } from "@/lib/utils";

const TABS = ["Description", "Specifications", "Reviews"] as const;

export function ProductDetail({ product }: { product: Product }) {
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Description");
  const [zoom, setZoom] = useState({ on: false, x: 50, y: 50 });
  const [added, setAdded] = useState(false);
  const [color, setColor] = useState(0);

  const hydrated = useHydrated();
  const { format } = useMoney();
  const wished = useShop((s) => s.wishlist.includes(product.id));
  const toggleWishlist = useShop((s) => s.toggleWishlist);
  const addToCart = useAddToCart();

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1800);
    return () => clearTimeout(t);
  }, [added]);

  const discount = product.oldPrice
    ? `-${Math.round((1 - product.price / product.oldPrice) * 100)}%`
    : undefined;

  // Real per-product specs (empty fields are hidden, not faked).
  const specs = [
    { label: "Material", value: product.material ? capitalize(product.material) : "" },
    { label: "Category", value: product.categoryName },
    { label: "SKU", value: product.sku },
    { label: "Dimensions", value: product.dimensions ?? "" },
    { label: "Weight", value: product.weight ?? "" },
    { label: "Finish", value: product.finish ?? "" },
    { label: "Origin", value: product.origin ?? "" },
    { label: "Care", value: product.care ?? "" },
  ].filter((s) => s.value && s.value.trim());

  return (
    <div>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div className="flex flex-col-reverse gap-4 sm:flex-row">
          <div className="flex gap-3 sm:flex-col">
            {product.images.map((img, i) => (
              <button
                key={img + i}
                onClick={() => setActive(i)}
                className={cn(
                  "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition sm:h-20 sm:w-20",
                  active === i ? "border-brand" : "border-line hover:border-brand/40",
                )}
              >
                <Image src={img} alt="" fill sizes="80px" className="object-contain" />
              </button>
            ))}
          </div>

          <div
            className="relative aspect-[4/5] flex-1 overflow-hidden rounded-3xl border border-line/60 bg-cream-card"
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setZoom({
                on: true,
                x: ((e.clientX - r.left) / r.width) * 100,
                y: ((e.clientY - r.top) / r.height) * 100,
              });
            }}
            onMouseLeave={() => setZoom((z) => ({ ...z, on: false }))}
          >
            <Image
              src={product.images[active]}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 560px"
              className="object-contain transition-transform duration-200"
              style={{
                transform: zoom.on ? "scale(1.8)" : "scale(1)",
                transformOrigin: `${zoom.x}% ${zoom.y}%`,
              }}
            />
            <ProductBadges
              badges={product.badges}
              discount={discount}
              className="absolute left-4 top-4"
            />
          </div>
        </div>

        {/* Buy box */}
        <div className="flex flex-col">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">
            {product.categoryName}
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-espresso sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-3 flex items-center gap-3">
            <span className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-coffee">{product.rating}</span>
            </span>
            <span className="text-sm text-muted">{product.reviews} reviews</span>
            <span className="text-line">|</span>
            <span className="text-sm text-muted">{product.sales} sold</span>
          </div>

          <div className="mt-4 flex items-end gap-3">
            <span className="text-3xl font-bold text-espresso">
              {format(product.price)}
            </span>
            {product.oldPrice && (
              <span className="pb-1 text-lg text-muted line-through">
                {format(product.oldPrice)}
              </span>
            )}
            {discount && (
              <span className="mb-1.5 rounded-md bg-sale/10 px-2 py-0.5 text-xs font-semibold text-sale">
                Save {discount.replace("-", "")}
              </span>
            )}
          </div>

          {product.short && (
            <p className="mt-4 text-sm leading-relaxed text-coffee/75">
              {product.short}
            </p>
          )}

          {/* Stock */}
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                product.inStock ? "bg-newtag" : "bg-sale",
              )}
            />
            <span className={product.inStock ? "text-newtag" : "text-sale"}>
              {product.inStock ? "In stock & ready to ship" : "Currently out of stock"}
            </span>
          </div>

          {/* Colors */}
          <div className="mt-5">
            <p className="mb-2 text-sm font-medium text-coffee">
              Color / Finish
            </p>
            <div className="flex items-center gap-2">
              {product.colors.map((c, i) => (
                <button
                  key={c}
                  onClick={() => setColor(i)}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition",
                    color === i ? "border-brand" : "border-line",
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Qty + actions */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-full border border-line">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="flex h-12 w-12 items-center justify-center text-coffee hover:text-brand"
                aria-label="Decrease"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center font-semibold">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="flex h-12 w-12 items-center justify-center text-coffee hover:text-brand"
                aria-label="Increase"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <Button
              size="lg"
              disabled={!product.inStock}
              className="flex-1"
              onClick={() => {
                // Only flip to "Added" if it actually went in — a signed-out
                // visitor gets redirected to sign in instead.
                if (addToCart(product, qty)) setAdded(true);
              }}
            >
              {added ? (
                <>
                  <Check className="h-5 w-5" /> Added to Cart
                </>
              ) : (
                <>
                  <ShoppingBag className="h-5 w-5" /> Add to Cart
                </>
              )}
            </Button>
          </div>

          {/* Secondary actions */}
          <div className="mt-3 flex items-center gap-4 text-sm">
            <button
              onClick={() => toggleWishlist(product.id)}
              className={cn(
                "flex items-center gap-2 text-coffee transition hover:text-brand",
                hydrated && wished && "text-sale",
              )}
            >
              <Heart className={cn("h-4 w-4", hydrated && wished && "fill-sale")} />
              Wishlist
            </button>
            <button className="flex items-center gap-2 text-coffee transition hover:text-brand">
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>

          {/* Trust row */}
          <div className="mt-6 grid grid-cols-3 gap-3 rounded-2xl border border-line/60 bg-white p-4 text-center">
            <Trust icon={<Truck className="h-5 w-5" />} label="Free shipping over $100" />
            <Trust icon={<RotateCcw className="h-5 w-5" />} label="30-day returns" />
            <Trust icon={<Shield className="h-5 w-5" />} label="Secure checkout" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-14">
        <div className="flex gap-6 border-b border-line">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "relative pb-3 text-sm font-semibold transition",
                tab === t ? "text-brand" : "text-coffee/60 hover:text-coffee",
              )}
            >
              {t}
              {t === "Reviews" && ` (${product.reviews})`}
              {tab === t && (
                <span className="absolute -bottom-px left-0 h-0.5 w-full rounded-full bg-brand" />
              )}
            </button>
          ))}
        </div>

        <div className="py-6 text-sm leading-relaxed text-coffee/80">
          {tab === "Description" && (
            <div className="max-w-3xl space-y-4">
              {product.description && product.description.trim() ? (
                product.description
                  .split(/\n{2,}|\n/)
                  .filter((p) => p.trim())
                  .map((para, i) => <p key={i}>{para}</p>)
              ) : (
                <p className="text-muted">
                  No description has been added for this product yet.
                </p>
              )}
            </div>
          )}

          {tab === "Specifications" && (
            <div className="max-w-2xl overflow-hidden rounded-2xl border border-line">
              {specs.map((s, i) => (
                <div
                  key={s.label}
                  className={cn(
                    "grid grid-cols-2 px-4 py-3",
                    i % 2 === 0 ? "bg-white" : "bg-cream-soft",
                  )}
                >
                  <span className="font-medium text-coffee">{s.label}</span>
                  <span className="text-coffee/75">{s.value}</span>
                </div>
              ))}
            </div>
          )}

          {tab === "Reviews" && <Reviews product={product} />}
        </div>
      </div>
    </div>
  );
}

function Trust({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-coffee">
      <span className="text-brand">{icon}</span>
      <span className="text-[11px] leading-tight text-muted">{label}</span>
    </div>
  );
}

function Reviews({ product }: { product: Product }) {
  const user = useAuth((s) => s.user);
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .getReviews(product.slug)
      .then((r) => alive && setReviews(Array.isArray(r) ? r : []))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [product.slug]);

  const count = reviews.length;
  const avg =
    count > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
      : product.rating || 0;

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
        <div className="flex h-fit flex-col items-center justify-center rounded-2xl bg-cream-soft p-6 text-center">
          <span className="font-serif text-4xl font-bold text-espresso">
            {avg.toFixed(1)}
          </span>
          <span className="mt-1 flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-4 w-4",
                  i < Math.round(avg)
                    ? "fill-amber-400 text-amber-400"
                    : "text-line",
                )}
              />
            ))}
          </span>
          <span className="mt-1 text-xs text-muted">
            {count} {count === 1 ? "review" : "reviews"}
          </span>
        </div>

        <div className="space-y-5">
          {loading ? (
            <p className="text-sm text-muted">Loading reviews…</p>
          ) : count === 0 ? (
            <p className="text-sm text-muted">
              No reviews yet — be the first to review this product.
            </p>
          ) : (
            reviews.map((r) => (
              <div
                key={r.id}
                className="border-b border-line/60 pb-5 last:border-0"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-coffee">
                    {r.author || "Verified buyer"}
                  </span>
                  <span className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-3.5 w-3.5",
                          i < r.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-line",
                        )}
                      />
                    ))}
                  </span>
                </div>
                {r.title && (
                  <p className="mt-1 text-sm font-semibold text-coffee">
                    {r.title}
                  </p>
                )}
                {r.body && <p className="mt-1.5 text-coffee/75">{r.body}</p>}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Write a review */}
      {user ? (
        <ReviewForm
          slug={product.slug}
          onSubmitted={(list) => setReviews(list)}
        />
      ) : (
        <div className="rounded-2xl border border-line/60 bg-cream-soft p-5 text-sm text-coffee/80">
          Please{" "}
          <Link href="/account" className="font-semibold text-brand hover:underline">
            sign in
          </Link>{" "}
          to write a review.
        </div>
      )}
    </div>
  );
}

function ReviewForm({
  slug,
  onSubmitted,
}: {
  slug: string;
  onSubmitted: (list: ApiReview[]) => void;
}) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const list = await api.submitReview(slug, {
        rating,
        title: title.trim() || undefined,
        body: body.trim() || undefined,
      });
      onSubmitted(Array.isArray(list) ? list : []);
      setMsg("Thanks! Your review has been posted.");
      setTitle("");
      setBody("");
    } catch (err) {
      setError((err as Error).message || "Could not submit review.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-line/60 bg-white p-5"
    >
      <h4 className="font-serif text-lg font-bold text-espresso">
        Write a review
      </h4>
      <div className="mt-3 flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setRating(i + 1)}
            onMouseEnter={() => setHover(i + 1)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${i + 1} star`}
          >
            <Star
              className={cn(
                "h-6 w-6 transition",
                i < (hover || rating)
                  ? "fill-amber-400 text-amber-400"
                  : "text-line",
              )}
            />
          </button>
        ))}
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)"
        className="mt-3 w-full rounded-xl border border-line bg-cream-soft px-4 py-2.5 text-sm outline-none focus:border-brand"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share your experience with this product…"
        rows={4}
        className="mt-3 w-full resize-none rounded-xl border border-line bg-cream-soft px-4 py-2.5 text-sm outline-none focus:border-brand"
      />
      {error && <p className="mt-2 text-sm text-sale">{error}</p>}
      {msg && <p className="mt-2 text-sm text-newtag">{msg}</p>}
      <Button type="submit" disabled={busy} className="mt-3">
        {busy ? "Posting…" : "Submit review"}
      </Button>
    </form>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
