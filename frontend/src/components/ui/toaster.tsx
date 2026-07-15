"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Info, X, AlertCircle } from "lucide-react";
import { useToasts, type ToastKind } from "@/lib/toast";

const accents: Record<ToastKind, { ring: string; icon: React.ElementType }> = {
  success: { ring: "text-newtag", icon: Check },
  error: { ring: "text-sale", icon: AlertCircle },
  info: { ring: "text-brand", icon: Info },
};

/**
 * Global toast host. Mounted once in the root layout. Top-right, below the
 * sticky header so it never covers the nav or the cart icon it refers to.
 */
export function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed right-4 top-24 z-[60] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 sm:right-6 sm:top-28"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const { ring, icon: Icon } = accents[t.kind];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 24, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="pointer-events-auto flex items-start gap-3 rounded-card border border-line bg-cream-soft p-3 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.18)]"
            >
              {t.image ? (
                <Image
                  src={t.image}
                  alt=""
                  width={44}
                  height={44}
                  className="h-11 w-11 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cream-card ${ring}`}
                >
                  <Icon size={14} strokeWidth={3} />
                </span>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight text-espresso">
                  {t.title}
                </p>
                {t.description && (
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {t.description}
                  </p>
                )}
                {t.href && (
                  <Link
                    href={t.href}
                    onClick={() => dismiss(t.id)}
                    className="mt-1.5 inline-block text-xs font-semibold text-brand underline-offset-2 hover:underline"
                  >
                    {t.hrefLabel ?? "View"}
                  </Link>
                )}
              </div>

              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="-mr-1 -mt-1 shrink-0 rounded p-1 text-muted transition-colors hover:text-espresso"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
