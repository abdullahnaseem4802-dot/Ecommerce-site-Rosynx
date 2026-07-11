import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubscribersService {
  constructor(private readonly prisma: PrismaService) {}

  async subscribe(email: string) {
    const normalized = email.trim().toLowerCase();
    await this.prisma.subscriber.upsert({
      where: { email: normalized },
      update: {},
      create: { email: normalized },
    });
    return { ok: true };
  }

  // ---------------- Admin ----------------

  async list() {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.subscriber.findMany({ orderBy: { createdAt: 'desc' } }),
      this.prisma.subscriber.count(),
    ]);
    return { items, total };
  }

  async remove(id: string) {
    const s = await this.prisma.subscriber.findUnique({ where: { id } });
    if (!s) throw new NotFoundException('Subscriber not found');
    await this.prisma.subscriber.delete({ where: { id } });
    return { deleted: true };
  }
}
