import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlogPostDto, UpdateBlogPostDto } from './dto/blog.dto';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.blogPost.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async findBySlug(slug: string) {
    const post = await this.prisma.blogPost.findUnique({ where: { slug } });
    if (!post || !post.isPublished)
      throw new NotFoundException('Post not found');
    return post;
  }

  // ---------------- Admin ----------------

  adminList() {
    return this.prisma.blogPost.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(dto: CreateBlogPostDto) {
    const slug = dto.slug ? slugify(dto.slug) : slugify(dto.title);
    const existing = await this.prisma.blogPost.findUnique({ where: { slug } });
    if (existing) throw new BadRequestException('Slug already exists');
    return this.prisma.blogPost.create({
      data: {
        slug,
        title: dto.title,
        excerpt: dto.excerpt,
        content: dto.content,
        author: dto.author,
        category: dto.category,
        imageUrl: dto.imageUrl,
        readTime: dto.readTime,
        isPublished: dto.isPublished,
      },
    });
  }

  async update(id: string, dto: UpdateBlogPostDto) {
    await this.ensure(id);
    let slug: string | undefined;
    if (dto.slug) {
      slug = slugify(dto.slug);
      const clash = await this.prisma.blogPost.findUnique({ where: { slug } });
      if (clash && clash.id !== id)
        throw new BadRequestException('Slug already exists');
    }
    return this.prisma.blogPost.update({
      where: { id },
      data: {
        slug,
        title: dto.title,
        excerpt: dto.excerpt,
        content: dto.content,
        author: dto.author,
        category: dto.category,
        imageUrl: dto.imageUrl,
        readTime: dto.readTime,
        isPublished: dto.isPublished,
      },
    });
  }

  async remove(id: string) {
    await this.ensure(id);
    await this.prisma.blogPost.delete({ where: { id } });
    return { deleted: true };
  }

  private async ensure(id: string) {
    const p = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Post not found');
  }
}
