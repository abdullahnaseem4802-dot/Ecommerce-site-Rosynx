import { Category, Product, ProductImage } from '@prisma/client';

type ProductWithRelations = Product & {
  images?: ProductImage[];
  categories?: Category[];
};

/** Maps a DB product (integer cents) to the API/frontend shape (display units). */
export function serializeProduct(p: ProductWithRelations) {
  const images = (p.images ?? [])
    .slice()
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.position - b.position);

  const stockStatus =
    p.stockQty <= 0
      ? 'out'
      : p.stockQty <= p.lowStockThreshold
        ? 'low'
        : 'in';

  return {
    id: p.id,
    number: p.number,
    slug: p.slug,
    name: p.name,
    sku: p.sku ?? null,
    short: p.shortDesc ?? '',
    description: p.description ?? '',
    stockQty: p.stockQty,
    lowStockThreshold: p.lowStockThreshold,
    stockStatus,
    isActive: p.isActive,
    price: (p.salePriceCents ?? p.priceCents) / 100,
    oldPrice: p.salePriceCents != null ? p.priceCents / 100 : null,
    priceCents: p.salePriceCents ?? p.priceCents,
    regularPriceCents: p.priceCents,
    onSale: p.salePriceCents != null,
    material: p.material ?? null,
    dimensions: p.dimensions ?? null,
    weight: p.weight ?? null,
    finish: p.finish ?? null,
    origin: p.origin ?? null,
    care: p.care ?? null,
    colors: p.colors ?? [],
    badges: p.badges ?? [],
    inStock: p.inStock,
    rating: Number(p.ratingAvg),
    reviews: p.ratingCount,
    sales: p.totalSales,
    categories: (p.categories ?? []).map((c) => ({ slug: c.slug, name: c.name })),
    category: p.categories?.[0]?.slug ?? null,
    categoryName: p.categories?.[0]?.name ?? null,
    images: images.map((i) => i.url),
    image: images[0]?.url ?? null,
  };
}
