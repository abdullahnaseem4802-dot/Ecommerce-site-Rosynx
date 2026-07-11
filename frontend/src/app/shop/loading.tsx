import { Container } from "@/components/ui/container";
import { ProductCardSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function ShopLoading() {
  return (
    <div className="pb-16">
      <div className="border-b border-line bg-cream-card">
        <Container className="py-5 text-center">
          <Skeleton className="mx-auto h-8 w-56" />
        </Container>
      </div>
      <Container className="py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
          <Skeleton className="hidden h-[520px] w-full rounded-2xl lg:block" />
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
