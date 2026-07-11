import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeading({
  title,
  viewAllLabel,
  viewAllHref,
}: {
  title: string;
  viewAllLabel?: string;
  viewAllHref?: string;
}) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <h2 className="font-serif text-2xl font-bold text-espresso sm:text-3xl">
        {title}
      </h2>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="group flex items-center gap-2 text-sm font-medium text-coffee transition hover:text-brand"
        >
          {viewAllLabel ?? "View All"}
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-coffee/30 transition group-hover:border-brand group-hover:bg-brand group-hover:text-white">
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      )}
    </div>
  );
}
