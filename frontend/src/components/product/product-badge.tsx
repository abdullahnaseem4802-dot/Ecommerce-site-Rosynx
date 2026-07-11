import type { ProductBadge } from "@/lib/data";
import { cn } from "@/lib/utils";

const styles: Record<ProductBadge, { label: string; className: string }> = {
  new: { label: "New", className: "bg-newtag text-white" },
  sale: { label: "Sale", className: "bg-sale text-white" },
  limited: { label: "Limited", className: "bg-brand text-white" },
};

export function ProductBadges({
  badges,
  discount,
  className,
}: {
  badges: ProductBadge[];
  discount?: string;
  className?: string;
}) {
  // Only render badges we have a known style for. This guards against stale or
  // unknown badge values in the data (e.g. a retired "bestseller" tag) so an
  // unexpected value can never crash the product grid.
  const shown = (badges ?? []).filter(
    (b) => styles[b] && !(b === "sale" && discount),
  );
  if (!shown.length && !discount) return null;
  return (
    <div className={cn("flex flex-col items-start gap-1.5", className)}>
      {discount && (
        <span className="rounded-md bg-sale px-2.5 py-1 text-[11px] font-semibold text-white">
          {discount}
        </span>
      )}
      {shown.map((b) => (
        <span
          key={b}
          className={cn(
            "rounded-md px-2.5 py-1 text-[11px] font-semibold",
            styles[b].className,
          )}
        >
          {styles[b].label}
        </span>
      ))}
    </div>
  );
}
