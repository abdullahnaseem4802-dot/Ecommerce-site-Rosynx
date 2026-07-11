import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryProductsDto } from './dto/query-products.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { serializeProduct } from './product.serializer';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const withRelations = {
  images: true,
  categories: true,
} satisfies Prisma.ProductInclude;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(q: QueryProductsDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 12;

    const where: Prisma.ProductWhereInput = { isActive: true };
    if (q.category) where.categories = { some: { slug: q.category } };
    if (q.material) where.material = { equals: q.material, mode: 'insensitive' };
    if (q.inStock !== undefined) where.inStock = q.inStock;
    if (q.search)
      where.name = { contains: q.search, mode: 'insensitive' };
    if (q.minPrice !== undefined || q.maxPrice !== undefined) {
      where.priceCents = {};
      if (q.minPrice !== undefined) where.priceCents.gte = q.minPrice * 100;
      if (q.maxPrice !== undefined) where.priceCents.lte = q.maxPrice * 100;
    }

    const orderBy = this.orderBy(q.sort);

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: withRelations,
      }),
    ]);

    return {
      items: rows.map(serializeProduct),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: withRelations,
    });
    if (!product || !product.isActive)
      throw new NotFoundException('Product not found');
    return serializeProduct(product);
  }

  async related(slug: string, limit = 4) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: { categories: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    const categoryIds = product.categories.map((c) => c.id);
    const rows = await this.prisma.product.findMany({
      where: {
        isActive: true,
        slug: { not: slug },
        categories: { some: { id: { in: categoryIds } } },
      },
      take: limit,
      include: withRelations,
    });
    return rows.map(serializeProduct);
  }

  // ---------------- Admin ----------------

  async create(dto: CreateProductDto) {
    const slug = dto.slug ? slugify(dto.slug) : slugify(dto.name);
    const product = await this.prisma.product.create({
      data: {
        slug,
        name: dto.name,
        sku: dto.sku,
        shortDesc: dto.shortDesc,
        description: dto.description,
        priceCents: dto.priceCents,
        salePriceCents: dto.salePriceCents,
        material: dto.material,
        dimensions: dto.dimensions,
        weight: dto.weight,
        finish: dto.finish,
        origin: dto.origin,
        care: dto.care,
        colors: dto.colors ?? [],
        badges: dto.badges ?? [],
        stockQty: dto.stockQty ?? 0,
        lowStockThreshold: dto.lowStockThreshold ?? 5,
        inStock:
          dto.stockQty !== undefined ? dto.stockQty > 0 : (dto.inStock ?? true),
        isActive: dto.isActive ?? true,
        categories: dto.categorySlugs
          ? { connect: dto.categorySlugs.map((s) => ({ slug: s })) }
          : undefined,
        images: dto.images
          ? {
              create: dto.images.map((img, i) => ({
                url: img.url,
                alt: img.alt,
                isPrimary: img.isPrimary ?? i === 0,
                position: i,
              })),
            }
          : undefined,
      },
      include: withRelations,
    });
    return serializeProduct(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.ensureExists(id);
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug ? slugify(dto.slug) : undefined,
        sku: dto.sku,
        shortDesc: dto.shortDesc,
        description: dto.description,
        priceCents: dto.priceCents,
        salePriceCents: dto.salePriceCents,
        material: dto.material,
        dimensions: dto.dimensions,
        weight: dto.weight,
        finish: dto.finish,
        origin: dto.origin,
        care: dto.care,
        colors: dto.colors,
        badges: dto.badges,
        stockQty: dto.stockQty,
        lowStockThreshold: dto.lowStockThreshold,
        inStock:
          dto.stockQty !== undefined ? dto.stockQty > 0 : dto.inStock,
        isActive: dto.isActive,
        categories: dto.categorySlugs
          ? { set: dto.categorySlugs.map((s) => ({ slug: s })) }
          : undefined,
      },
      include: withRelations,
    });
    return serializeProduct(product);
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.product.delete({ where: { id } });
    return { deleted: true };
  }

  private async ensureExists(id: string) {
    const found = await this.prisma.product.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Product not found');
  }

  private orderBy(sort?: string): Prisma.ProductOrderByWithRelationInput {
    switch (sort) {
      case 'price-asc':
        return { priceCents: 'asc' };
      case 'price-desc':
        return { priceCents: 'desc' };
      case 'rating':
        return { ratingAvg: 'desc' };
      case 'bestselling':
        return { totalSales: 'desc' };
      case 'newest':
      default:
        return { createdAt: 'desc' };
    }
  }
}
