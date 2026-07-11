import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CartService, CartIdentity } from '../cart/cart.service';
import { CouponsService } from '../coupons/coupons.service';
import { EmailService } from '../email/email.service';
import { PaymobService } from '../payments/paymob.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cart: CartService,
    private readonly coupons: CouponsService,
    private readonly email: EmailService,
    private readonly paymob: PaymobService,
    private readonly config: ConfigService,
  ) {}

  async checkout(identity: CartIdentity, dto: CreateOrderDto, userId?: string) {
    // Build line items either from the request (frontend cart) or the server cart.
    // Prices are ALWAYS recomputed from the DB — never trusted from the client.
    const lines = dto.items?.length
      ? await this.linesFromItems(dto.items)
      : (await this.cart.get(identity)).items;

    if (!lines.length) throw new BadRequestException('Cart is empty');

    const subtotalCents = lines.reduce(
      (n, l) => n + l.priceCents * l.qty,
      0,
    );

    // coupon (server-recomputed — never trust the client)
    let discountCents = 0;
    let couponCode: string | undefined;
    if (dto.couponCode) {
      const result = await this.coupons.apply(dto.couponCode, subtotalCents);
      discountCents = result.discountCents;
      couponCode = result.code;
    }

    const shippingCents = 0; // free shipping (matches store policy)
    const totalCents = subtotalCents - discountCents + shippingCents;
    const currency = this.config.get<string>('BASE_CURRENCY') ?? 'USD';

    const { status, paymentStatus } = this.initialStatuses(dto.paymentMethod);

    const order = await this.prisma.order.create({
      data: {
        orderNumber: this.generateOrderNumber(),
        userId: userId ?? null,
        email: dto.email.toLowerCase(),
        status,
        currency,
        subtotalCents,
        discountCents,
        shippingCents,
        totalCents,
        couponCode,
        paymentMethod: dto.paymentMethod,
        paymentStatus,
        billing: (dto.billing ?? dto.shipping) as unknown as Prisma.InputJsonValue,
        shipping: dto.shipping as unknown as Prisma.InputJsonValue,
        items: {
          create: lines.map((l) => ({
            productId: l.productId,
            nameSnapshot: l.name,
            priceCents: l.priceCents,
            qty: l.qty,
            lineTotalCents: l.priceCents * l.qty,
          })),
        },
        payments: {
          create: {
            provider: dto.paymentMethod,
            amountCents: totalCents,
            status: paymentStatus,
          },
        },
      },
      include: { items: true },
    });

    if (couponCode) await this.coupons.incrementUsage(couponCode);
    await this.cart.clear(identity);

    // increment product sales counters
    await Promise.all(
      order.items.map((i) =>
        i.productId
          ? this.prisma.product.update({
              where: { id: i.productId },
              data: { totalSales: { increment: i.qty } },
            })
          : Promise.resolve(),
      ),
    );

    await this.email.orderConfirmation({
      orderNumber: order.orderNumber,
      email: order.email,
      totalCents: order.totalCents,
      currency: order.currency,
      items: order.items,
    });

    // card payment → return a redirect URL
    let paymentUrl: string | undefined;
    if (
      dto.paymentMethod === PaymentMethod.PAYMOB ||
      (dto.paymentMethod === PaymentMethod.CARD && this.paymob.isConfigured)
    ) {
      // Real gateway (Paymob) — used for PAYMOB, or CARD once keys are set.
      paymentUrl = await this.paymob.createPaymentUrl({
        orderNumber: order.orderNumber,
        totalCents: order.totalCents,
        email: order.email,
        billing: dto.billing ?? dto.shipping,
      });
    } else if (dto.paymentMethod === PaymentMethod.CARD) {
      // Sandbox mode (no gateway keys) — redirect to the honest test gateway.
      const storefront =
        process.env.STOREFRONT_URL ?? 'http://localhost:3000';
      paymentUrl = `${storefront}/pay/sandbox?order=${order.orderNumber}`;
    }

    return { ...this.serialize(order), paymentUrl };
  }

  async myOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
    return orders.map((o) => this.serialize(o));
  }

  async getByNumber(orderNumber: string, user?: { id: string; role: string }) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (
      user &&
      user.role !== 'ADMIN' &&
      order.userId &&
      order.userId !== user.id
    )
      throw new ForbiddenException();
    return this.serialize(order);
  }

  // ---------------- Admin ----------------

  async adminList(status?: OrderStatus) {
    const orders = await this.prisma.order.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
    return orders.map((o) => this.serialize(o));
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    const paidStatuses: OrderStatus[] = [
      OrderStatus.PAID,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.COMPLETED,
    ];
    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status,
        paymentStatus: paidStatuses.includes(status)
          ? PaymentStatus.PAID
          : undefined,
        paidAt:
          paidStatuses.includes(status) && !order.paidAt ? new Date() : undefined,
      },
      include: { items: true },
    });
    return this.serialize(updated);
  }

  /**
   * SANDBOX-ONLY card confirmation. Simulates a successful card payment for the
   * honest test gateway. Refuses outright if a real gateway (Paymob) is
   * configured — we never fake a real payment.
   */
  async sandboxPay(orderNumber: string) {
    if (this.paymob.isConfigured)
      throw new ForbiddenException(
        'Sandbox payment is disabled because a real card gateway is configured.',
      );

    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
    });
    if (!order) throw new NotFoundException('Order not found');

    const updated = await this.prisma.order.update({
      where: { orderNumber },
      data: {
        status: OrderStatus.PROCESSING,
        paymentStatus: PaymentStatus.PAID,
        paidAt: new Date(),
        payments: {
          create: {
            provider: PaymentMethod.CARD,
            amountCents: order.totalCents,
            status: PaymentStatus.PAID,
            providerRef: `SANDBOX-${Date.now().toString(36).toUpperCase()}`,
          },
        },
      },
      include: { items: true },
    });
    return this.serialize(updated);
  }

  /** Called by the Paymob webhook when a card payment succeeds. */
  async markPaidByNumber(orderNumber: string) {
    await this.prisma.order.updateMany({
      where: { orderNumber },
      data: {
        status: OrderStatus.PAID,
        paymentStatus: PaymentStatus.PAID,
        paidAt: new Date(),
      },
    });
  }

  /** Build cart-like lines from client items, pricing each from the DB. */
  private async linesFromItems(items: { productId: string; qty: number }[]) {
    const ids = items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
    });
    const byId = new Map(products.map((p) => [p.id, p]));
    const lines: {
      productId: string;
      name: string;
      priceCents: number;
      qty: number;
    }[] = [];
    for (const item of items) {
      const p = byId.get(item.productId);
      if (!p || !p.isActive) continue;
      lines.push({
        productId: p.id,
        name: p.name,
        priceCents: p.salePriceCents ?? p.priceCents,
        qty: item.qty,
      });
    }
    return lines;
  }

  private initialStatuses(method: PaymentMethod) {
    switch (method) {
      case PaymentMethod.BANK_TRANSFER:
        return { status: OrderStatus.ON_HOLD, paymentStatus: PaymentStatus.UNPAID };
      case PaymentMethod.PAYMOB:
      case PaymentMethod.CARD:
        return { status: OrderStatus.PENDING, paymentStatus: PaymentStatus.UNPAID };
      case PaymentMethod.COD:
      default:
        return { status: OrderStatus.PENDING, paymentStatus: PaymentStatus.UNPAID };
    }
  }

  private generateOrderNumber(): string {
    const t = Date.now().toString(36).toUpperCase();
    const r = Math.floor(Math.random() * 1296)
      .toString(36)
      .toUpperCase()
      .padStart(2, '0');
    return `RX-${t}${r}`;
  }

  private serialize(o: any) {
    return {
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      currency: o.currency,
      email: o.email,
      subtotal: o.subtotalCents / 100,
      discount: o.discountCents / 100,
      shipping: o.shippingCents / 100,
      total: o.totalCents / 100,
      subtotalCents: o.subtotalCents,
      totalCents: o.totalCents,
      couponCode: o.couponCode,
      billing: o.billing,
      shippingAddress: o.shipping,
      items: (o.items ?? []).map((i: any) => ({
        productId: i.productId,
        name: i.nameSnapshot,
        price: i.priceCents / 100,
        qty: i.qty,
        lineTotal: i.lineTotalCents / 100,
      })),
      createdAt: o.createdAt,
      paidAt: o.paidAt,
    };
  }
}
