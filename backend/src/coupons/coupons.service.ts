import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Coupon, CouponType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto } from './dto/coupon.dto';

export interface CouponResult {
  valid: boolean;
  code: string;
  type: CouponType;
  value: number;
  discountCents: number;
  reason?: string;
}

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Pure calculation used by both /validate and checkout. Throws on invalid. */
  async apply(code: string, subtotalCents: number): Promise<CouponResult> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (!coupon || !coupon.isActive)
      throw new BadRequestException('Invalid coupon code');

    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now)
      throw new BadRequestException('Coupon not active yet');
    if (coupon.expiresAt && coupon.expiresAt < now)
      throw new BadRequestException('Coupon expired');
    if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit)
      throw new BadRequestException('Coupon usage limit reached');
    if (subtotalCents < coupon.minSubtotalCents)
      throw new BadRequestException(
        `Minimum spend of ${(coupon.minSubtotalCents / 100).toFixed(2)} required`,
      );

    const discountCents =
      coupon.type === CouponType.PERCENT
        ? Math.round((subtotalCents * coupon.value) / 100)
        : Math.min(coupon.value, subtotalCents);

    return {
      valid: true,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discountCents,
    };
  }

  /** Non-throwing wrapper for the public validate endpoint. */
  async validate(code: string, subtotalCents: number): Promise<CouponResult> {
    try {
      return await this.apply(code, subtotalCents);
    } catch (e: any) {
      return {
        valid: false,
        code: code.toUpperCase(),
        type: CouponType.PERCENT,
        value: 0,
        discountCents: 0,
        reason: e.message,
      };
    }
  }

  async incrementUsage(code: string) {
    await this.prisma.coupon.updateMany({
      where: { code },
      data: { usedCount: { increment: 1 } },
    });
  }

  // ---------------- Admin ----------------

  list() {
    return this.prisma.coupon.findMany({ orderBy: { code: 'asc' } });
  }

  create(dto: CreateCouponDto): Promise<Coupon> {
    return this.prisma.coupon.create({
      data: { ...dto, code: dto.code.trim().toUpperCase() },
    });
  }

  async update(id: string, dto: Partial<CreateCouponDto>) {
    await this.ensure(id);
    return this.prisma.coupon.update({
      where: { id },
      data: {
        ...dto,
        code: dto.code ? dto.code.trim().toUpperCase() : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.ensure(id);
    await this.prisma.coupon.delete({ where: { id } });
    return { deleted: true };
  }

  private async ensure(id: string) {
    const c = await this.prisma.coupon.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Coupon not found');
  }
}
