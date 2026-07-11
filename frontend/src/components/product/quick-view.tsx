"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Minus, Plus, Star, X } from "lucide-react";
import type { Product } from "@/lib/data";
import { useShop } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { useMoney } from "@/lib/currency";
import { ProductBadges } from "./product-badge";
import { cn } from "@/lib/utils";

export function QuickView({
  product,
  open,
  onClose,
}: {
  product: Product;
  open: boolean;
  onClose: () => void;
}) {
  const addToCart = useShop((s) => s.addToCart);
  const { format } = useMoney();
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (open) {
      setQty(1);
      setActive(0);
      setAdded(false);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-espresso/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            className="relative z-10 grid w-full max-w-3xl grid-cols-1 overflow-hidden rounded-3xl bg-white shadow-2xl sm:grid-cols-2"
            initial={{ scale: 0.94, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-coffee shadow transition hover:bg-cream-card"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative aspect-square bg-cream-card sm:aspect-auto">
              <Image
                src={product.images[active]}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 100vw, 384px"
                className="object-cover"
              />
              <ProductBadges
                badges={product.badges}
                discount={
                  product.oldPrice
                    ? `-${Math.round((1 - product.price / product.oldPrice) * 100)}%`
                    : undefined
                }
                className="absolute left-3 top-3"
              />
            </div>

            <div className="flex flex-col gap-3 p-6">
              <p className="text-[11px] font-medium uppercase tracking-wide text-brand">
                {product.categoryName}
              </p>
              <h3 className="font-serif text-2xl font-bold text-espresso">
                {product.name}
              </h3>
              <div className="flex items-center gap-1 text-xs text-muted">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="font-medium text-coffee">{product.rating}</span>
                <span>({product.reviews} reviews)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-espresso">
                  {format(product.price)}
                </span>
                {product.oldPrice && (
                  <span className="text-base text-muted line-through">
                    {format(product.oldPrice)}
                  </span>
                )}
              </div>
              <p className="text-sm text-coffee/75">{product.short}</p>

              {/* thumbnails */}
              <div className="flex gap-2">
                {product.images.map((img, i) => (
                  <button
                    key={img + i}
                    onClick={() => setActive(i)}
                    className={cn(
                      "relative h-12 w-12 overflow-hidden rounded-lg border",
                      active === i ? "border-brand" : "border-line",
                    )}
                  >
                    <Image src={img} alt="" fill sizes="48px" className="object-cover" />
                  </button>
                ))}
              </div>

              {/* qty + add */}
              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center rounded-full border border-line">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="flex h-10 w-10 items-center justify-center text-coffee hover:text-brand"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">{qty}</span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="flex h-10 w-10 items-center justify-center text-coffee hover:text-brand"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <Button
                  className="flex-1"
                  onClick={() => {
                    addToCart(product, qty);
                    setAdded(true);
                  }}
                >
                  {added ? (
                    <>
                      <Check className="h-4 w-4" /> Added
                    </>
                  ) : (
                    "Add to Cart"
                  )}
                </Button>
              </div>

              <Link
                href={`/product/${product.id}`}
                className="mt-1 text-center text-sm font-medium text-brand underline-offset-4 hover:underline"
              >
                View full details
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
