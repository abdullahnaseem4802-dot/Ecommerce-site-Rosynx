import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RevalidateService } from '../revalidate/revalidate.service';
import { CreateFaqDto, UpdateFaqDto } from './dto/faq.dto';

@Injectable()
export class FaqService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly revalidate: RevalidateService,
  ) {}

  /** Public: only published items, ordered for display. */
  list() {
    return this.prisma.faqItem.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  // ---------------- Admin ----------------

  adminList() {
    return this.prisma.faqItem.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async create(dto: CreateFaqDto) {
    const created = await this.prisma.faqItem.create({
      data: {
        question: dto.question,
        answer: dto.answer,
        category: dto.category,
        sortOrder: dto.sortOrder,
        isPublished: dto.isPublished,
      },
    });
    this.revalidate.faq();
    return created;
  }

  async update(id: string, dto: UpdateFaqDto) {
    await this.ensure(id);
    const updated = await this.prisma.faqItem.update({
      where: { id },
      data: {
        question: dto.question,
        answer: dto.answer,
        category: dto.category,
        sortOrder: dto.sortOrder,
        isPublished: dto.isPublished,
      },
    });
    this.revalidate.faq();
    return updated;
  }

  async remove(id: string) {
    await this.ensure(id);
    await this.prisma.faqItem.delete({ where: { id } });
    this.revalidate.faq();
    return { deleted: true };
  }

  private async ensure(id: string) {
    const f = await this.prisma.faqItem.findUnique({ where: { id } });
    if (!f) throw new NotFoundException('FAQ not found');
    return f;
  }
}
