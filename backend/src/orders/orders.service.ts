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
  Role,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CartService, CartIdentity } from '../cart/cart.service';
import { CouponsService } from '../coupons/coupons.service';
import { EmailService } from '../email/email.service';
import { PaymobService } from '../payments/paymob.service';
import { CreateOrderDto } from './dto/create-order.dto';

/** Every read path returns items + the status timeline (oldest first). */
const ORDER_INCLUDE = {
  items: true,
  events: { orderBy: { createdAt: 'asc' } },
  payments: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.OrderInclude;

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
            // Manual methods: keep the customer-supplied transaction ID so the
            // admin can match the incoming money to this order.
            providerRef: dto.paymentReference?.trim() || undefined,
          },
        },
        events: {
          create: { status, note: 'Order placed.' },
        },
      },
      include: ORDER_INCLUDE,
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
      include: ORDER_INCLUDE,
    });
    return orders.map((o) => this.serialize(o));
  }

  async getByNumber(orderNumber: string, user?: { id: string; role: string }) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new NotFoundException('Order not found');

    // Admins see everything. Everyone else must own the order.
    //
    // Checkout now requires an account, so every new order has a userId and
    // nobody legitimately needs to look an order up anonymously. Any remaining
    // userId-less orders are pre-gate legacy rows; leaving them readable by
    // orderNumber alone would expose the customer's email and home address to
    // anyone who guessed it. Those are admin-only now.
    if (user?.role !== Role.ADMIN && order.userId !== user?.id) {
      throw new ForbiddenException();
    }
    return this.serialize(order);
  }

  // ---------------- Admin ----------------

  async adminList(status?: OrderStatus) {
    const orders = await this.prisma.order.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: ORDER_INCLUDE,
    });
    return orders.map((o) => this.serialize(o));
  }

  async updateStatus(id: string, status: OrderStatus, note?: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    const paidStatuses: OrderStatus[] = [
      OrderStatus.PAID,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.COMPLETED,
    ];
    // Only timeline a real transition — re-selecting the same value in the
    // admin UI must not add a duplicate row.
    const changed = order.status !== status;
    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status,
        paymentStatus: paidStatuses.includes(status)
          ? PaymentStatus.PAID
          : undefined,
        paidAt:
          paidStatuses.includes(status) && !order.paidAt ? new Date() : undefined,
        events: changed ? { create: { status, note } } : undefined,
      },
      include: ORDER_INCLUDE,
    });
    return this.serialize(updated);
  }

  /**
   * SANDBOX-ONLY card confirmation. Simulates a successful card payment for the
   * honest test gateway. Refuses outright if a real gateway (Paymob) is
   * configured — we never fake a real payment.
   */
  async sandboxPay(
    orderNumber: string,
    user?: { id: string; role: string },
  ) {
    if (this.paymob.isConfigured)
      throw new ForbiddenException(
        'Sandbox payment is disabled because a real card gateway is configured.',
      );

    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
    });
    if (!order) throw new NotFoundException('Order not found');

    // Only the customer who placed the order (or an admin) may confirm it.
    // Without this, knowing an order number is enough to mark it paid.
    if (
      user &&
      user.role !== Role.ADMIN &&
      order.userId &&
      order.userId !== user.id
    )
      throw new ForbiddenException();

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
        events:
          order.status !== OrderStatus.PROCESSING
            ? {
                create: {
                  status: OrderStatus.PROCESSING,
                  note: 'Sandbox card payment confirmed.',
                },
              }
            : undefined,
      },
      include: ORDER_INCLUDE,
    });
    return this.serialize(updated);
  }

  /** Called by the Paymob webhook when a card payment succeeds. */
  async markPaidByNumber(orderNumber: string) {
    const order = await this.prisma.order.findUnique({ where: { orderNumber } });
    if (!order) return;
    // Gateways retry webhooks — don't stack duplicate PAID events.
    if (order.status === OrderStatus.PAID) return;
    await this.prisma.order.update({
      where: { orderNumber },
      data: {
        status: OrderStatus.PAID,
        paymentStatus: PaymentStatus.PAID,
        paidAt: order.paidAt ?? new Date(),
        events: {
          create: {
            status: OrderStatus.PAID,
            note: 'Card payment confirmed by gateway.',
          },
        },
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
      // Manual methods: the customer says they've sent the money, but the admin
      // must confirm it arrived before fulfilling — park on hold, unpaid.
      case PaymentMethod.BANK_TRANSFER:
      case PaymentMethod.JAZZCASH:
      case PaymentMethod.EASYPAISA:
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
      // Customer-supplied transaction ID for manual methods (JazzCash / EasyPaisa
      // / bank transfer) — lets the admin match the money to the order.
      paymentReference:
        (o.payments ?? []).map((p: any) => p.providerRef).find(Boolean) ?? null,
      currency: o.currency,
      email: o.email,
      subtotal: o.subtotalCents / 100,
      discount: o.discountCents / 100,
      // `shipping` is the address snapshot (what the storefront's tracking page
      // reads). The shipping *cost* is `shippingCost` — it used to be `shipping`,
      // but nothing consumed it under that name.
      shipping: o.shipping,
      shippingCost: o.shippingCents / 100,
      total: o.totalCents / 100,
      subtotalCents: o.subtotalCents,
      totalCents: o.totalCents,
      couponCode: o.couponCode,
      billing: o.billing,
      // Kept for the admin panel, which reads `shippingAddress`.
      shippingAddress: o.shipping,
      items: (o.items ?? []).map((i: any) => ({
        productId: i.productId,
        name: i.nameSnapshot,
        price: i.priceCents / 100,
        qty: i.qty,
        lineTotal: i.lineTotalCents / 100,
      })),
      events: (o.events ?? []).map((e: any) => ({
        status: e.status,
        note: e.note,
        createdAt: e.createdAt,
      })),
      createdAt: o.createdAt,
      paidAt: o.paidAt,
    };
  }
}
