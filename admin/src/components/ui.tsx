"use client";

import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { X } from "lucide-react";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-line bg-panel shadow-[0_1px_3px_rgba(25,20,15,0.04),0_8px_24px_-16px_rgba(25,20,15,0.12)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "subtle";
}) {
  const styles = {
    primary:
      "bg-copper text-white hover:bg-copper-light shadow-[0_6px_20px_-8px_rgba(194,112,61,0.7)]",
    ghost: "border border-line text-fg hover:bg-panel-2",
    subtle: "bg-panel-2 text-fg hover:bg-line",
    danger: "bg-bad/15 text-bad hover:bg-bad/25 border border-bad/30",
  }[variant];
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50",
        styles,
        className,
      )}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
}

export function Input({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-xs font-medium text-muted">
          {label}
        </span>
      )}
      <input
        className={clsx(
          "w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm text-fg outline-none transition focus:border-copper focus:ring-2 focus:ring-copper/20",
          className,
        )}
        {...props}
      />
    </label>
  );
}

const pillColors: Record<string, string> = {
  PENDING: "bg-warn/15 text-warn",
  ON_HOLD: "bg-info/15 text-info",
  PAID: "bg-good/15 text-good",
  PROCESSING: "bg-info/15 text-info",
  SHIPPED: "bg-copper/20 text-copper-light",
  COMPLETED: "bg-good/15 text-good",
  CANCELLED: "bg-bad/15 text-bad",
  REFUNDED: "bg-bad/15 text-bad",
  UNPAID: "bg-warn/15 text-warn",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        pillColors[status] ?? "bg-panel-2 text-muted",
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative z-10 w-full max-w-lg rounded-2xl border border-line bg-panel p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{title}</h3>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted hover:bg-panel-2 hover:text-fg"
              >
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Spinner() {
  return (
    <motion.div
      className="h-5 w-5 rounded-full border-2 border-copper border-t-transparent"
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
    />
  );
}
