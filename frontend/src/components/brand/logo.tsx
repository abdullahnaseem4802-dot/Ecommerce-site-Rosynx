import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="ROSYNX home"
      className={cn("inline-flex shrink-0 items-center", className)}
    >
      <Image
        src="/images/logo.png"
        alt="ROSYNX"
        width={160}
        height={160}
        priority
        className="h-16 w-auto object-contain"
      />
    </Link>
  );
}
