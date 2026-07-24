import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";

/**
 * On-demand revalidation webhook. The backend calls this after an admin edits a
 * product, category, blog post or store setting, so the change appears on the
 * storefront within seconds instead of waiting out the ISR window
 * (/shop 5 min, /product/[id] 10 min).
 *
 * revalidatePath in a Route Handler marks a path for revalidation; the next
 * visitor to that path gets a freshly rendered page. It's lazy, so invalidating
 * the product route does NOT stampede all 148 pages at once.
 *
 * Auth: a shared secret. Without it, anyone could force expensive re-renders.
 * If REVALIDATE_SECRET isn't configured we fail closed (401) rather than
 * leaving the endpoint open.
 */

// Only paths the storefront actually serves. Anything else is rejected, so a
// leaked secret still can't be used to purge arbitrary routes.
const ALLOWED = [
  /^\/$/,
  /^\/shop$/,
  /^\/product\/\d+$/,
  /^\/product\/\[id\]$/,
  /^\/blogs$/,
  /^\/blog\/[a-z0-9-]+$/i,
  /^\/blog\/\[slug\]$/,
  /^\/contact$/,
  /^\/faqs$/,
];

const isAllowed = (p: string) => ALLOWED.some((re) => re.test(p));

export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || req.headers.get("x-revalidate-secret") !== secret) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let paths: unknown;
  try {
    paths = (await req.json())?.paths;
  } catch {
    return Response.json({ ok: false, error: "invalid body" }, { status: 400 });
  }
  if (!Array.isArray(paths) || paths.some((p) => typeof p !== "string")) {
    return Response.json(
      { ok: false, error: "paths must be a string[]" },
      { status: 400 },
    );
  }

  const revalidated: string[] = [];
  const skipped: string[] = [];
  for (const p of paths as string[]) {
    if (!isAllowed(p)) {
      skipped.push(p);
      continue;
    }
    // A dynamic segment needs the 'page' type; a literal path must not have it.
    if (p.includes("[")) revalidatePath(p, "page");
    else revalidatePath(p);
    revalidated.push(p);
  }

  return Response.json({ ok: true, revalidated, skipped });
}
