import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { serializeProduct } from '../products/product.serializer';
import {
  UpdateCustomerDto,
  UpdateCustomerStatusDto,
} from './dto/customer.dto';

const PAID_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.COMPLETED,
];

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const [
      products,
      customers,
      orders,
      pendingOrders,
      statusGroups,
      topProductsRaw,
      recentOrders,
      recentCustomers,
      lowStockRaw,
      last7,
    ] = await this.prisma.withRetry(() =>
      Promise.all([
        this.prisma.product.count(),
      this.prisma.user.count({ where: { role: Role.CUSTOMER } }),
      this.prisma.order.findMany({ select: { totalCents: true, status: true } }),
      this.prisma.order.count({
        where: { status: { in: [OrderStatus.PENDING, OrderStatus.ON_HOLD] } },
      }),
      this.prisma.order.groupBy({ by: ['status'], _count: true }),
      this.prisma.product.findMany({
        orderBy: { totalSales: 'desc' },
        take: 5,
        include: { images: true, categories: true },
      }),
      this.prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          orderNumber: true,
          email: true,
          totalCents: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.user.findMany({
        where: { role: Role.CUSTOMER },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, email: true, createdAt: true },
      }),
      this.prisma.product.findMany({
        where: { stockQty: { lte: 5 } },
        orderBy: { stockQty: 'asc' },
        take: 6,
        include: { images: true, categories: true },
      }),
        this.prisma.order.findMany({
          select: { totalCents: true, status: true, createdAt: true },
        }),
      ]),
    );

    const revenue =
      orders
        .filter((o) => PAID_STATUSES.includes(o.status))
        .reduce((s, o) => s + o.totalCents, 0) / 100;

    const orderStatus = statusGroups.map((g) => ({
      status: g.status,
      count: g._count,
    }));

    // revenue for the last 7 days (by day)
    const series = this.revenueSeries(last7);

    return {
      kpis: {
        revenue,
        orders: orders.length,
        customers,
        products,
        pendingOrders,
      },
      orderStatus,
      revenueSeries: series,
      topProducts: topProductsRaw.map((p) => {
        const s = serializeProduct(p);
        return { name: s.name, image: s.image, sales: s.sales, price: s.price };
      }),
      recentOrders: recentOrders.map((o) => ({
        orderNumber: o.orderNumber,
        email: o.email,
        total: o.totalCents / 100,
        status: o.status,
        createdAt: o.createdAt,
      })),
      recentCustomers,
      lowStock: lowStockRaw.map((p) => {
        const s = serializeProduct(p);
        return { name: s.name, image: s.image, stockQty: s.stockQty };
      }),
    };
  }

  private revenueSeries(orders: { totalCents: number; status: OrderStatus; createdAt: Date }[]) {
    const days: { label: string; total: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const total =
        orders
          .filter(
            (o) =>
              PAID_STATUSES.includes(o.status) &&
              o.createdAt.toISOString().slice(0, 10) === key,
          )
          .reduce((s, o) => s + o.totalCents, 0) / 100;
      days.push({ label: d.toLocaleDateString(undefined, { weekday: 'short' }), total });
    }
    return days;
  }

  async inventoryStats() {
    const products = await this.prisma.product.findMany({
      select: { stockQty: true, lowStockThreshold: true, priceCents: true, salePriceCents: true },
    });
    const totalStock = products.reduce((s, p) => s + p.stockQty, 0);
    const lowStock = products.filter(
      (p) => p.stockQty > 0 && p.stockQty <= p.lowStockThreshold,
    ).length;
    const outOfStock = products.filter((p) => p.stockQty <= 0).length;
    const stockValue =
      products.reduce(
        (s, p) => s + (p.salePriceCents ?? p.priceCents) * p.stockQty,
        0,
      ) / 100;
    return {
      totalProducts: products.length,
      totalStock,
      lowStock,
      outOfStock,
      stockValue,
    };
  }

  async customers() {
    const users = await this.prisma.user.findMany({
      where: { role: Role.CUSTOMER },
      orderBy: { createdAt: 'desc' },
      include: {
        orders: { select: { totalCents: true, status: true } },
        _count: { select: { orders: true } },
      },
    });
    return users.map((u) => {
      const spent =
        u.orders
          .filter((o) => PAID_STATUSES.includes(o.status))
          .reduce((s, o) => s + o.totalCents, 0) / 100;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        isActive: u.isActive,
        orders: u._count.orders,
        totalSpent: spent,
        joinedAt: u.createdAt,
      };
    });
  }

  async customer(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          select: {
            orderNumber: true,
            status: true,
            totalCents: true,
            createdAt: true,
          },
        },
        addresses: true,
      },
    });
    if (!user || user.role !== Role.CUSTOMER)
      throw new NotFoundException('Customer not found');

    const totalSpent =
      user.orders
        .filter((o) => PAID_STATUSES.includes(o.status))
        .reduce((s, o) => s + o.totalCents, 0) / 100;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isActive: user.isActive,
      joinedAt: user.createdAt,
      ordersCount: user.orders.length,
      totalSpent,
      orders: user.orders.map((o) => ({
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.totalCents / 100,
        createdAt: o.createdAt,
      })),
      addresses: user.addresses.map((a) => ({
        id: a.id,
        label: a.label,
        line1: a.line1,
        line2: a.line2,
        city: a.city,
        state: a.state,
        country: a.country,
        postalCode: a.postalCode,
        phone: a.phone,
        isDefault: a.isDefault,
      })),
    };
  }

  async updateCustomer(id: string, dto: UpdateCustomerDto) {
    await this.assertCustomer(id);
    await this.prisma.user.update({
      where: { id },
      data: { name: dto.name, phone: dto.phone },
    });
    return this.customer(id);
  }

  async setCustomerStatus(id: string, dto: UpdateCustomerStatusDto) {
    await this.assertCustomer(id);
    await this.prisma.user.update({
      where: { id },
      data: { isActive: dto.isActive },
    });
    return this.customer(id);
  }

  /**
   * These endpoints manage customers only. An admin must never be able to reset
   * another admin's password or block them through the customer routes.
   */
  private async assertCustomer(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });
    if (!user) throw new NotFoundException('Customer not found');
    if (user.role !== Role.CUSTOMER)
      throw new ForbiddenException('This user is not a customer');
    return user;
  }
}
