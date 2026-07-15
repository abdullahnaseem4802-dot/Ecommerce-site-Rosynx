import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RevalidateService } from '../revalidate/revalidate.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly revalidate: RevalidateService,
  ) {}

  async findAll() {
    const cats = await this.prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: true } } },
    });
    return cats.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description ?? '',
      image: c.imageUrl ?? null,
      featured: c.isFeatured,
      sortOrder: c.sortOrder,
      productCount: c._count.products,
      products: c._count.products,
    }));
  }

  async findBySlug(slug: string) {
    const c = await this.prisma.category.findUnique({
      where: { slug },
      include: { _count: { select: { products: true } } },
    });
    if (!c) throw new NotFoundException('Category not found');
    return {
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description ?? '',
      image: c.imageUrl ?? null,
      featured: c.isFeatured,
      sortOrder: c.sortOrder,
      productCount: c._count.products,
      products: c._count.products,
    };
  }

  // ---------------- Admin ----------------

  async create(dto: CreateCategoryDto) {
    const slug = dto.slug ? slugify(dto.slug) : slugify(dto.name);
    const existing = await this.prisma.category.findUnique({ where: { slug } });
    if (existing) throw new BadRequestException('Slug already exists');
    const created = await this.prisma.category.create({
      data: {
        slug,
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl,
        isFeatured: dto.isFeatured,
        sortOrder: dto.sortOrder,
      },
    });
    this.revalidate.category();
    return created;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.ensure(id);
    let slug: string | undefined;
    if (dto.slug) {
      slug = slugify(dto.slug);
      const clash = await this.prisma.category.findUnique({ where: { slug } });
      if (clash && clash.id !== id)
        throw new BadRequestException('Slug already exists');
    }
    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        imageUrl: dto.imageUrl,
        isFeatured: dto.isFeatured,
        sortOrder: dto.sortOrder,
      },
    });
    this.revalidate.category();
    return updated;
  }

  async remove(id: string) {
    await this.ensure(id);
    // Disconnect all products from this (implicit) many-to-many relation first.
    await this.prisma.category.update({
      where: { id },
      data: { products: { set: [] } },
    });
    await this.prisma.category.delete({ where: { id } });
    this.revalidate.category();
    return { deleted: true };
  }

  private async ensure(id: string) {
    const c = await this.prisma.category.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Category not found');
  }
}
