"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Tags, Plus, Pencil, Trash2, Eye } from "lucide-react";
import { api, Category, getToken } from "@/lib/api";
import { Button, Card, Input, Modal, Spinner } from "@/components/ui";
import { useCached } from "@/lib/use-cached";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const STORE_URL =
  process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000";

interface FormState {
  id?: string;
  name: string;
  description: string;
  imageUrl: string;
  isFeatured: boolean;
  sortOrder: string;
}

const empty: FormState = {
  name: "",
  description: "",
  imageUrl: "",
  isFeatured: false,
  sortOrder: "",
};

export default function CategoriesPage() {
  const { data: cats, reload: load } = useCached("categories", () =>
    api.get<Category[]>("/categories"),
  );
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [confirmDel, setConfirmDel] = useState<Category | null>(null);

  function openCreate() {
    setForm(empty);
    setError("");
    setOpen(true);
  }
  function openEdit(c: Category) {
    setForm({
      id: c.id,
      name: c.name,
      description: c.description ?? "",
      imageUrl: c.image ?? "",
      isFeatured: c.featured,
      sortOrder: c.sortOrder != null ? String(c.sortOrder) : "",
    });
    setError("");
    setOpen(true);
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
      if (json.url) setForm((f) => ({ ...f, imageUrl: json.url }));
    } finally {
      setUploading(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        description: form.description || undefined,
        imageUrl: form.imageUrl || undefined,
        isFeatured: form.isFeatured,
        sortOrder: form.sortOrder
          ? parseInt(form.sortOrder, 10)
          : undefined,
      };
      if (form.id) await api.patch(`/categories/${form.id}`, payload);
      else await api.post("/categories", payload);
      setOpen(false);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function del(c: Category) {
    await api.del(`/categories/${c.id}`);
    setConfirmDel(null);
    await load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="mt-1 text-sm text-muted">
            {cats ? `${cats.length} categories` : "Loading…"}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> New category
        </Button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {!cats
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-2xl" />
            ))
          : cats.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ y: -3 }}
              >
                <Card className="flex items-center gap-3 p-4">
                  <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-copper/15 text-copper-light">
                    {c.image ? (
                      <Image
                        src={c.image}
                        alt={c.name}
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    ) : (
                      <Tags size={20} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium capitalize">
                      {c.name}
                    </p>
                    <p className="text-xs text-muted">
                      {c.productCount} products
                      {c.featured ? " · featured" : ""}
                    </p>
                  </div>
                  <a
                    href={`${STORE_URL}/shop?category=${c.slug}`}
                    target="_blank"
                    rel="noopener"
                    className="rounded-lg p-1.5 text-muted hover:bg-panel-2 hover:text-copper-light"
                    title="View in store"
                  >
                    <Eye size={15} />
                  </a>
                  <button
                    onClick={() => openEdit(c)}
                    className="rounded-lg p-1.5 text-muted hover:bg-panel-2 hover:text-copper-light"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setConfirmDel(c)}
                    className="rounded-lg p-1.5 text-muted hover:bg-bad/10 hover:text-bad"
                  >
                    <Trash2 size={15} />
                  </button>
                </Card>
              </motion.div>
            ))}
      </div>

      {/* Create / Edit */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? "Edit category" : "New category"}
      >
        <form onSubmit={save} className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
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
              rows={3}
              className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm text-fg outline-none transition focus:border-copper focus:ring-2 focus:ring-copper/20"
            />
          </label>
          <div>
            <span className="mb-1.5 block text-xs font-medium text-muted">
              Image
            </span>
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-panel-2">
                {form.imageUrl && (
                  <Image
                    src={form.imageUrl}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                )}
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Spinner />
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  e.target.files?.[0] && uploadFile(e.target.files[0])
                }
                className="text-xs text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-panel-2 file:px-3 file:py-1.5 file:text-fg"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 items-end gap-3">
            <Input
              label="Sort order"
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            />
            <label className="flex items-center gap-2 py-2 text-sm">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) =>
                  setForm({ ...form, isFeatured: e.target.checked })
                }
                className="accent-copper"
              />
              Featured
            </label>
          </div>
          {error && <p className="text-sm text-bad">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner /> : null}
              {form.id ? "Save changes" : "Create category"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        title="Delete category"
      >
        <p className="text-sm text-muted">
          Delete{" "}
          <span className="font-medium text-fg">{confirmDel?.name}</span>? This
          cannot be undone.
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
