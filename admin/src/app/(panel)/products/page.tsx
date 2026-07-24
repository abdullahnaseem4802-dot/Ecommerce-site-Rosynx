"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Search, Package, X, Eye } from "lucide-react";
import {
  api,
  Category,
  getToken,
  Paginated,
  Product,
} from "@/lib/api";
import { Button, Card, Input, Modal, Spinner } from "@/components/ui";
import { useCached } from "@/lib/use-cached";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

const BADGE_OPTIONS = ["new", "sale", "limited"] as const;

const UNCATEGORIZED = "__uncat__";

interface FormState {
  id?: string;
  name: string;
  sku: string;
  price: string;
  salePrice: string;
  stockQty: string;
  material: string;
  categorySlugs: string[];
  images: string[];
  short: string;
  description: string;
  colors: string;
  badges: string[];
  dimensions: string;
  weight: string;
  finish: string;
  origin: string;
  care: string;
  isActive: boolean;
}

const empty: FormState = {
  name: "",
  sku: "",
  price: "",
  salePrice: "",
  stockQty: "",
  material: "",
  categorySlugs: [],
  images: [],
  short: "",
  description: "",
  colors: "",
  badges: [],
  dimensions: "",
  weight: "",
  finish: "",
  origin: "",
  care: "",
  isActive: true,
};

export default function ProductsPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [confirmDel, setConfirmDel] = useState<Product | null>(null);
  const [viewTarget, setViewTarget] = useState<Product | null>(null);

  const { data, reload: load } = useCached(
    `products?page=${page}&search=${search}`,
    () => {
      const q = new URLSearchParams({ page: String(page), limit: "12" });
      if (search) q.set("search", search);
      return api.get<Paginated<Product>>(`/products?${q}`);
    },
  );

  useEffect(() => {
    api.get<Category[]>("/categories").then(setCats);
  }, []);

  function openCreate() {
    setForm(empty);
    setError("");
    setModalOpen(true);
  }
  function openEdit(p: Product) {
    setForm({
      id: p.id,
      name: p.name,
      sku: p.sku ?? "",
      price: String(p.regularPriceCents / 100),
      salePrice: p.onSale ? String(p.priceCents / 100) : "",
      stockQty: String(p.stockQty),
      material: p.material ?? "",
      categorySlugs: p.categories.map((c) => c.slug),
      images: p.images ?? [],
      short: p.short,
      description: p.description ?? "",
      colors: (p.colors ?? []).join(", "),
      badges: p.badges ?? [],
      dimensions: p.dimensions ?? "",
      weight: p.weight ?? "",
      finish: p.finish ?? "",
      origin: p.origin ?? "",
      care: p.care ?? "",
      isActive: p.isActive,
    });
    setError("");
    setModalOpen(true);
  }

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API}/uploads/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      const json = await res.json();
      if (json.url)
        setForm((f) => ({ ...f, images: [...f.images, json.url] }));
    } finally {
      setUploading(false);
    }
  }

  function removeImage(url: string) {
    setForm((f) => ({ ...f, images: f.images.filter((u) => u !== url) }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const colors = form.colors
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      const payload: Record<string, unknown> = {
        name: form.name,
        sku: form.sku || undefined,
        priceCents: Math.round(parseFloat(form.price || "0") * 100),
        salePriceCents: form.salePrice
          ? Math.round(parseFloat(form.salePrice) * 100)
          : null,
        stockQty: form.stockQty ? Math.max(0, parseInt(form.stockQty, 10)) : 0,
        material: form.material || undefined,
        dimensions: form.dimensions || undefined,
        weight: form.weight || undefined,
        finish: form.finish || undefined,
        origin: form.origin || undefined,
        care: form.care || undefined,
        colors,
        badges: form.badges,
        isActive: form.isActive,
        categorySlugs: form.categorySlugs,
        shortDesc: form.short || undefined,
        description: form.description || undefined,
        images: form.images.length
          ? form.images.map((url, i) => ({ url, isPrimary: i === 0 }))
          : undefined,
      };
      if (form.id) await api.patch(`/products/${form.id}`, payload);
      else await api.post("/products", payload);
      setModalOpen(false);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function del(p: Product) {
    await api.del(`/products/${p.id}`);
    setConfirmDel(null);
    await load();
  }

  async function reassign(p: Product, slug: string) {
    await api.patch(`/products/${p.id}`, {
      categorySlugs: slug ? [slug] : [],
    });
    await load();
    setViewTarget((v) =>
      v && v.id === p.id
        ? {
            ...v,
            categories: slug
              ? cats
                  .filter((c) => c.slug === slug)
                  .map((c) => ({ slug: c.slug, name: c.name }))
              : [],
          }
        : v,
    );
  }

  const visibleItems = data
    ? data.items.filter((p) => {
        if (!catFilter) return true;
        if (catFilter === UNCATEGORIZED) return p.categories.length === 0;
        return p.categories.some((c) => c.slug === catFilter);
      })
    : [];

  function toggleCat(slug: string) {
    setForm((f) => ({
      ...f,
      categorySlugs: f.categorySlugs.includes(slug)
        ? f.categorySlugs.filter((s) => s !== slug)
        : [...f.categorySlugs, slug],
    }));
  }

  function toggleBadge(badge: string) {
    setForm((f) => ({
      ...f,
      badges: f.badges.includes(badge)
        ? f.badges.filter((b) => b !== badge)
        : [...f.badges, badge],
    }));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-muted">
            {data ? `${data.total} products` : "Loading…"}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Add product
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search products…"
            className="w-full rounded-lg border border-line bg-panel-2 py-2 pl-9 pr-3 text-sm outline-none focus:border-copper"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm outline-none focus:border-copper"
        >
          <option value="">All categories</option>
          <option value={UNCATEGORIZED}>Uncategorized</option>
          {cats.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {!data
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-2xl" />
            ))
          : visibleItems.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (i % 12) * 0.03 }}
                whileHover={{ y: -3 }}
              >
                <Card className="flex flex-col gap-2 p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-panel-2">
                      {p.image ? (
                        <Image
                          src={p.image}
                          alt={p.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <Package className="absolute inset-0 m-auto text-muted" size={20} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      {p.sku && (
                        <p className="font-mono text-[11px] text-muted">{p.sku}</p>
                      )}
                      <p className="text-xs text-muted">
                        ${p.price}
                        {p.onSale && (
                          <span className="ml-1 text-muted line-through">
                            ${p.regularPriceCents / 100}
                          </span>
                        )}
                        {" · "}
                        <span
                          className={
                            p.stockStatus === "in"
                              ? "text-good"
                              : p.stockStatus === "low"
                                ? "text-warn"
                                : "text-bad"
                          }
                        >
                          {p.stockQty} in stock
                        </span>
                      </p>
                      <p className="truncate text-[11px] text-muted">
                        {p.categories.length
                          ? p.categories.map((c) => c.name).join(", ")
                          : "Uncategorized"}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 self-start">
                      <button
                        onClick={() => setViewTarget(p)}
                        className="rounded-lg p-1.5 text-muted hover:bg-panel-2 hover:text-copper-light"
                        title="View details"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => openEdit(p)}
                        className="rounded-lg p-1.5 text-muted hover:bg-panel-2 hover:text-copper-light"
                        title="Edit product"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setConfirmDel(p)}
                        className="rounded-lg p-1.5 text-muted hover:bg-bad/10 hover:text-bad"
                        title="Delete product"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <select
                    value={p.categories[0]?.slug ?? ""}
                    onChange={(e) => reassign(p, e.target.value)}
                    title="Reassign category"
                    className="w-full rounded-lg border border-line bg-panel-2 px-2 py-1.5 text-xs outline-none focus:border-copper"
                  >
                    <option value="">Uncategorized</option>
                    {cats.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Card>
              </motion.div>
            ))}
      </div>

      {data && data.pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </Button>
          <span className="text-sm text-muted">
            {page} / {data.pages}
          </span>
          <Button
            variant="ghost"
            disabled={page >= data.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Create / Edit */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? "Edit product" : "Add product"}
      >
        <form
          onSubmit={save}
          className="max-h-[70vh] space-y-4 overflow-y-auto pr-1"
        >
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              label="SKU"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              placeholder="e.g. RX-LTHR-001"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Price ($)"
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
            <Input
              label="Discount price ($)"
              type="number"
              step="0.01"
              value={form.salePrice}
              onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
            />
            <Input
              label="Stock qty"
              type="number"
              value={form.stockQty}
              onChange={(e) => setForm({ ...form, stockQty: e.target.value })}
            />
          </div>
          <Input
            label="Short description"
            value={form.short}
            onChange={(e) => setForm({ ...form, short: e.target.value })}
            placeholder="One-line summary shown on cards"
          />
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">
              Description
            </span>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={4}
              placeholder="Full product description shown on the product page"
              className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm text-fg outline-none transition focus:border-copper focus:ring-2 focus:ring-copper/20"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Material"
              value={form.material}
              onChange={(e) => setForm({ ...form, material: e.target.value })}
              placeholder="e.g. Rosewood"
            />
            <Input
              label="Colors (comma-separated)"
              value={form.colors}
              onChange={(e) => setForm({ ...form, colors: e.target.value })}
              placeholder="e.g. Brown, Black"
            />
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-medium text-muted">
              Badges
            </span>
            <div className="flex flex-wrap gap-2">
              {BADGE_OPTIONS.map((b) => (
                <label
                  key={b}
                  className="flex items-center gap-1.5 rounded-full bg-panel-2 px-3 py-1 text-xs capitalize"
                >
                  <input
                    type="checkbox"
                    checked={form.badges.includes(b)}
                    onChange={() => toggleBadge(b)}
                    className="accent-copper"
                  />
                  {b}
                </label>
              ))}
            </div>
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-medium text-muted">
              Specifications
            </span>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Dimensions"
                value={form.dimensions}
                onChange={(e) =>
                  setForm({ ...form, dimensions: e.target.value })
                }
                placeholder="e.g. 30 × 20 × 10 cm"
              />
              <Input
                label="Weight"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                placeholder="e.g. 1.2 kg"
              />
              <Input
                label="Finish"
                value={form.finish}
                onChange={(e) => setForm({ ...form, finish: e.target.value })}
                placeholder="e.g. Hand-polished matte"
              />
              <Input
                label="Origin"
                value={form.origin}
                onChange={(e) => setForm({ ...form, origin: e.target.value })}
                placeholder="e.g. Chiniot, Pakistan"
              />
              <Input
                label="Care"
                value={form.care}
                onChange={(e) => setForm({ ...form, care: e.target.value })}
                className="col-span-2"
                placeholder="e.g. Wipe with a dry cloth"
              />
            </div>
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-medium text-muted">
              Categories
            </span>
            <div className="flex flex-wrap gap-2">
              {cats.map((c) => {
                const on = form.categorySlugs.includes(c.slug);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCat(c.slug)}
                    className={
                      "rounded-full px-3 py-1 text-xs transition " +
                      (on
                        ? "bg-copper text-white"
                        : "bg-panel-2 text-muted hover:text-fg")
                    }
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-medium text-muted">
              Images{" "}
              <span className="text-muted/70">(first is primary)</span>
            </span>
            <div className="flex flex-wrap items-center gap-3">
              {form.images.map((url, i) => (
                <div
                  key={url}
                  className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-panel-2"
                >
                  <Image
                    src={url}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                  {i === 0 && (
                    <span className="absolute bottom-0 left-0 right-0 bg-copper/90 py-0.5 text-center text-[9px] font-semibold uppercase text-white">
                      Primary
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-bad"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-dashed border-line bg-panel-2">
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Spinner />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) uploadFile(e.target.files[0]);
                    e.target.value = "";
                  }}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                <Plus className="absolute inset-0 m-auto text-muted" size={18} />
              </div>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="accent-copper"
            />
            Active (visible in store)
          </label>
          {error && <p className="text-sm text-bad">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner /> : null}
              {form.id ? "Save changes" : "Create product"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View details */}
      <Modal
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="Product details"
      >
        {viewTarget && (
          <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-panel-2">
              {viewTarget.image ? (
                <Image
                  src={viewTarget.image}
                  alt={viewTarget.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 512px"
                  className="object-cover"
                />
              ) : (
                <Package
                  className="absolute inset-0 m-auto text-muted"
                  size={28}
                />
              )}
            </div>
            {viewTarget.images && viewTarget.images.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {viewTarget.images.map((url) => (
                  <div
                    key={url}
                    className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-panel-2"
                  >
                    <Image
                      src={url}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
            <div>
              <p className="text-lg font-semibold">{viewTarget.name}</p>
              {viewTarget.sku && (
                <p className="font-mono text-xs text-muted">{viewTarget.sku}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 text-sm">
              <span className="font-semibold text-fg">${viewTarget.price}</span>
              {viewTarget.onSale && (
                <span className="text-muted line-through">
                  ${viewTarget.regularPriceCents / 100}
                </span>
              )}
              <span
                className={
                  viewTarget.stockStatus === "in"
                    ? "text-good"
                    : viewTarget.stockStatus === "low"
                      ? "text-warn"
                      : "text-bad"
                }
              >
                {viewTarget.stockQty} in stock
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted">
                Categories
              </p>
              <p className="mt-1 text-sm text-fg">
                {viewTarget.categories.length
                  ? viewTarget.categories.map((c) => c.name).join(", ")
                  : "Uncategorized"}
              </p>
            </div>
            {viewTarget.short && (
              <div>
                <p className="text-xs font-semibold uppercase text-muted">
                  Short description
                </p>
                <p className="mt-1 text-sm text-fg">{viewTarget.short}</p>
              </div>
            )}
            {viewTarget.description && (
              <div>
                <p className="text-xs font-semibold uppercase text-muted">
                  Description
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-fg">
                  {viewTarget.description}
                </p>
              </div>
            )}
            <div className="flex justify-end pt-2">
              <Button variant="ghost" onClick={() => setViewTarget(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        title="Delete product"
      >
        <p className="text-sm text-muted">
          Delete <span className="font-medium text-fg">{confirmDel?.name}</span>?
          This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmDel(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => confirmDel && del(confirmDel)}>
            <Trash2 size={15} /> Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
