"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Admin startup animation — intentionally DIFFERENT from the storefront splash
 * (which draws a ring around the logo). Here: a copper conic sweep spins behind
 * the logo, the wordmark rises, and a progress bar fills. Shows once per tab.
 */
export function AdminSplash() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (sessionStorage.getItem("rosynx-admin-splash")) return;
    setShow(true);
    sessionStorage.setItem("rosynx-admin-splash", "1");
    const t = setTimeout(() => setShow(false), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-panel"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative flex h-32 w-32 items-center justify-center">
            {/* conic sweep */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent 0deg, rgba(180,83,9,0.55) 90deg, transparent 200deg)",
                mask: "radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px))",
                WebkitMask:
                  "radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px))",
              }}
              initial={{ rotate: 0, opacity: 0 }}
              animate={{ rotate: 360, opacity: 1 }}
              transition={{ duration: 1.1, ease: "easeInOut" }}
            />
            {/* soft copper glow */}
            <div className="absolute inset-4 rounded-full bg-copper/10 blur-xl" />
            {/* logo */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0, filter: "blur(6px)" }}
              animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
              transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 16 }}
              className="relative z-10"
            >
              <Image
                src="/images/logo.png"
                alt="ROSYNX"
                width={72}
                height={72}
                className="h-16 w-16 object-contain"
                priority
              />
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-5 font-serif text-xl font-bold tracking-wide text-fg"
          >
            ROSYNX <span className="text-copper">Admin</span>
          </motion.p>
          <p className="mt-1 text-xs uppercase tracking-[0.3em] text-muted">
            Store Management
          </p>

          <div className="mt-6 h-1 w-40 overflow-hidden rounded-full bg-panel-2">
            <motion.div
              className="h-full rounded-full bg-copper"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.6, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
