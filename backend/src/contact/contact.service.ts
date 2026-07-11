import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateContactDto } from './dto/contact.dto';

@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  async create(dto: CreateContactDto) {
    const msg = await this.prisma.contactMessage.create({
      data: {
        name: dto.name,
        email: dto.email,
        subject: dto.subject,
        message: dto.message,
      },
    });
    await this.email.contactNotification(msg);
    return { ok: true };
  }

  // ---------------- Admin ----------------

  list() {
    return this.prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async setRead(id: string, isRead: boolean) {
    await this.ensure(id);
    return this.prisma.contactMessage.update({
      where: { id },
      data: { isRead },
    });
  }

  async remove(id: string) {
    await this.ensure(id);
    await this.prisma.contactMessage.delete({ where: { id } });
    return { deleted: true };
  }

  private async ensure(id: string) {
    const m = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!m) throw new NotFoundException('Message not found');
  }
}
