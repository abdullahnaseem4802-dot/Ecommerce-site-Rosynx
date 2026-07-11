"use client";

import { useEffect, useState } from "react";
import { Header } from "./header";
import { MainNav } from "./main-nav";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      // hide when scrolling down past the topbar, show on scroll up
      if (y > last && y > 160) setHidden(true);
      else setHidden(false);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-transform duration-300",
        hidden ? "-translate-y-full" : "translate-y-0",
        scrolled && "shadow-md shadow-espresso/5",
      )}
    >
      <Header />
      <MainNav />
    </header>
  );
}
