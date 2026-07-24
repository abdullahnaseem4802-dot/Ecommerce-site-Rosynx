import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateContactDto, UpdateContactDto } from './dto/contact.dto';

/** Shape returned to customers for a support ticket + its thread. */
const TICKET_SELECT = {
  id: true,
  subject: true,
  message: true,
  status: true,
  customerUnread: true,
  createdAt: true,
  updatedAt: true,
  replies: {
    select: {
      id: true,
      body: true,
      fromAdmin: true,
      authorName: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.ContactMessageSelect;

@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  async create(dto: CreateContactDto, userId?: string | null) {
    const msg = await this.prisma.contactMessage.create({
      data: {
        userId: userId ?? null,
        name: dto.name,
        email: dto.email,
        subject: dto.subject,
        message: dto.message,
      },
    });
    await this.email.contactNotification(msg);
    return { ok: true };
  }

  // ---------------- Customer (own tickets) ----------------

  myTickets(userId: string) {
    return this.prisma.contactMessage.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: TICKET_SELECT,
    });
  }

  async myTicket(id: string, userId: string) {
    const exists = await this.prisma.contactMessage.findFirst({
      where: { id, userId },
      select: { id: true, customerUnread: true },
    });
    // 404 (not 403) on someone else's ticket — don't leak existence.
    if (!exists) throw new NotFoundException('Ticket not found');
    // Opening the thread clears the customer's notification for it.
    if (exists.customerUnread) {
      await this.prisma.contactMessage.update({
        where: { id },
        data: { customerUnread: false },
      });
    }
    return this.prisma.contactMessage.findFirst({
      where: { id, userId },
      select: TICKET_SELECT,
    });
  }

  /** Count of the customer's tickets with an unseen support reply — powers the
   *  notification badge on the account icon and the Support link. */
  async unreadCount(userId: string) {
    const count = await this.prisma.contactMessage.count({
      where: { userId, customerUnread: true },
    });
    return { count };
  }

  async customerReply(id: string, userId: string, body: string) {
    const ticket = await this.prisma.contactMessage.findFirst({
      where: { id, userId },
      select: { id: true, status: true },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.status === TicketStatus.CLOSED) {
      throw new BadRequestException(
        'This ticket is closed. Please open a new enquiry.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    await this.prisma.contactReply.create({
      data: {
        messageId: id,
        body,
        fromAdmin: false,
        authorName: user?.name ?? 'Customer',
      },
    });

    // Resurface for the admin panel.
    await this.prisma.contactMessage.update({
      where: { id },
      data: { status: TicketStatus.OPEN, isRead: false },
    });

    return this.myTicket(id, userId);
  }

  // ---------------- Admin ----------------

  list() {
    return this.prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        replies: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async update(id: string, dto: UpdateContactDto) {
    await this.ensure(id);
    return this.prisma.contactMessage.update({
      where: { id },
      data: {
        ...(dto.isRead !== undefined ? { isRead: dto.isRead } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });
  }

  async adminReply(id: string, body: string) {
    const msg = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!msg) throw new NotFoundException('Message not found');

    await this.prisma.contactReply.create({
      data: {
        messageId: id,
        body,
        fromAdmin: true,
        authorName: 'ROSYNX Support',
      },
    });

    const ticket = await this.prisma.contactMessage.update({
      where: { id },
      // customerUnread: true lights up the customer's notification badge until
      // they open the thread (myTicket clears it).
      data: {
        status: TicketStatus.ANSWERED,
        isRead: true,
        customerUnread: true,
      },
      include: { replies: { orderBy: { createdAt: 'asc' } } },
    });

    // Best-effort: a mail outage must not lose the reply (it's already in the
    // DB and readable from the customer's account).
    await this.email.supportReply(msg, body);

    return ticket;
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
