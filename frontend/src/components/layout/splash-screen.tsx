"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

export function SplashScreen() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Respect users who prefer reduced motion — skip the intro entirely.
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setShow(false);
      return;
    }
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => setShow(false), 2300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!show) document.body.style.overflow = "";
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-white"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          onClick={() => setShow(false)}
        >
          {/* soft copper glow */}
          <motion.div
            className="absolute h-[520px] w-[520px] rounded-full [background-image:radial-gradient(circle,rgba(180,83,9,0.14)_0,transparent_60%)]"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />

          <div className="relative flex flex-col items-center">
            {/* Drawing copper ring around the logo */}
            <div className="relative flex h-52 w-52 items-center justify-center sm:h-60 sm:w-60">
              <svg
                viewBox="0 0 100 100"
                className="absolute inset-0 h-full w-full -rotate-90"
                fill="none"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="47"
                  stroke="#b45309"
                  strokeOpacity="0.12"
                  strokeWidth="1.2"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="47"
                  stroke="#b45309"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                />
              </svg>

              <motion.div
                initial={{ scale: 0.82, opacity: 0, filter: "blur(8px)" }}
                animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div
                  animate={{ scale: [1, 1.04, 1] }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.6,
                  }}
                >
                  <Image
                    src="/images/logo.png"
                    alt="ROSYNX"
                    width={220}
                    height={220}
                    priority
                    className="h-28 w-28 object-contain sm:h-32 sm:w-32"
                  />
                </motion.div>
              </motion.div>
            </div>

            {/* Tagline with animated underline */}
            <motion.p
              className="mt-7 text-[11px] font-semibold uppercase tracking-[0.4em] text-espresso/70"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              Handmade · Timeless
            </motion.p>
            <motion.span
              className="mt-3 block h-px rounded-full bg-gradient-to-r from-transparent via-brand to-transparent"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 120, opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.7, ease: "easeOut" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
