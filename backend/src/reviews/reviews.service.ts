import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(slug: string) {
    const product = await this.prisma.product.findUnique({ where: { slug } });
    if (!product) throw new NotFoundException('Product not found');
    const reviews = await this.prisma.review.findMany({
      where: { productId: product.id, isApproved: true },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    });
    return reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      author: r.user.name,
      createdAt: r.createdAt,
    }));
  }

  async create(
    userId: string,
    slug: string,
    dto: { rating: number; title?: string; body?: string },
  ) {
    if (dto.rating < 1 || dto.rating > 5)
      throw new BadRequestException('Rating must be 1-5');
    const product = await this.prisma.product.findUnique({ where: { slug } });
    if (!product) throw new NotFoundException('Product not found');

    await this.prisma.review.upsert({
      where: { productId_userId: { productId: product.id, userId } },
      create: {
        productId: product.id,
        userId,
        rating: dto.rating,
        title: dto.title,
        body: dto.body,
      },
      update: { rating: dto.rating, title: dto.title, body: dto.body },
    });

    await this.recompute(product.id);
    return this.list(slug);
  }

  // ---------------- Admin ----------------

  async adminList() {
    const reviews = await this.prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { name: true, slug: true } },
      },
    });
    return reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      isApproved: r.isApproved,
      author: r.user.name,
      authorEmail: r.user.email,
      product: r.product.name,
      productSlug: r.product.slug,
      createdAt: r.createdAt,
    }));
  }

  async setApproved(id: string, isApproved: boolean) {
    const review = await this.prisma.review.update({
      where: { id },
      data: { isApproved },
    });
    await this.recompute(review.productId);
    return { id: review.id, isApproved: review.isApproved };
  }

  async adminRemove(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    await this.prisma.review.delete({ where: { id } });
    await this.recompute(review.productId);
    return { deleted: true };
  }

  /** Recalculate the product's average rating + count. */
  private async recompute(productId: string) {
    const agg = await this.prisma.review.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
      _count: true,
    });
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        ratingAvg: Number((agg._avg.rating ?? 0).toFixed(1)),
        ratingCount: agg._count,
      },
    });
  }
}
