import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Coupon } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class SubscribersService {
  private readonly logger = new Logger(SubscribersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  async subscribe(email: string) {
    const normalized = email.trim().toLowerCase();
    const existing = await this.prisma.subscriber.findUnique({
      where: { email: normalized },
    });
    await this.prisma.subscriber.upsert({
      where: { email: normalized },
      update: {},
      create: { email: normalized },
    });
    // Only greet genuinely NEW subscribers — never re-spam a re-subscribe.
    // Best-effort: a mail hiccup must never fail the subscribe.
    if (!existing) {
      try {
        await this.sendWelcomeCoupon(normalized);
      } catch (e) {
        this.logger.error(`welcome email to ${normalized} failed`, e as Error);
      }
    }
    return { ok: true };
  }

  /**
   * Emails a new subscriber the store's welcome coupon: the admin-selected code
   * if set + valid, otherwise any currently-active valid coupon. If the store
   * has no active coupon there's nothing to send.
   */
  private async sendWelcomeCoupon(to: string) {
    const settings = await this.prisma.storeSetting.findUnique({
      where: { id: 'singleton' },
    });
    const coupon = await this.pickWelcomeCoupon(settings?.welcomeCouponCode);
    if (!coupon) {
      // No active coupon configured — still confirm the subscription with a
      // plain welcome so the subscriber always receives an email. (To hand out
      // a code, set an active welcome coupon in Admin → Settings.)
      this.logger.warn(
        `No active welcome coupon — sent plain welcome to ${to}. ` +
          `Set a welcome coupon in Admin → Settings to email a code.`,
      );
      await this.email.subscribeWelcome(to);
      return;
    }
    await this.email.couponOffer(to, {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minSubtotalCents: coupon.minSubtotalCents,
      expiresAt: coupon.expiresAt,
      currency: settings?.baseCurrency ?? 'USD',
    });
  }

  private async pickWelcomeCoupon(
    preferredCode?: string | null,
  ): Promise<Coupon | null> {
    const now = new Date();
    const isValid = (c: Coupon) =>
      c.isActive &&
      (!c.startsAt || c.startsAt <= now) &&
      (!c.expiresAt || c.expiresAt > now) &&
      (c.usageLimit == null || c.usedCount < c.usageLimit);

    if (preferredCode && preferredCode.trim()) {
      const c = await this.prisma.coupon.findUnique({
        where: { code: preferredCode.trim().toUpperCase() },
      });
      if (c && isValid(c)) return c;
    }
    const actives = await this.prisma.coupon.findMany({
      where: { isActive: true },
    });
    return actives.find(isValid) ?? null;
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
