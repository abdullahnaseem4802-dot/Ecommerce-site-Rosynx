"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { SiteFooter } from "./site-footer";

/**
 * Hides the marketing footer on the full-screen auth screens so the sign-in /
 * sign-up card fills the viewport without a long scroll past it:
 *  - /account/reset (password reset) — always
 *  - /account when signed OUT (the login/register card). When signed in the
 *    same route shows the dashboard, which keeps the footer.
 */
export function ConditionalFooter() {
  const pathname = usePathname();
  const user = useAuth((s) => s.user);

  const hide =
    pathname === "/account/reset" || (pathname === "/account" && !user);

  if (hide) return null;
  return <SiteFooter />;
}
