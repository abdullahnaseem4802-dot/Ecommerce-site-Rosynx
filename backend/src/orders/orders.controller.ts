import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrderStatus, Role } from '@prisma/client';
import { OrdersService } from './orders.service';
import { PaymobService } from '../payments/paymob.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly paymob: PaymobService,
  ) {}

  /** Paymob calls this after a card payment. Public + HMAC-checked. */
  @Public()
  @Post('paymob/webhook')
  async paymobWebhook(@Body() payload: any) {
    const { orderNumber, success } = this.paymob.verifyWebhook(payload);
    if (success && orderNumber) await this.orders.markPaidByNumber(orderNumber);
    return { received: true };
  }

  /**
   * SANDBOX-ONLY: simulate a successful card payment. Public because the
   * honest test gateway page calls it directly. The service refuses if a real
   * gateway is configured.
   */
  /**
   * Requires auth and ownership. This endpoint marks an order PAID, and its
   * only other guard is "no real gateway configured" — which is currently true,
   * so leaving it public let anyone who knew an order number mark that order
   * paid (including their own COD order).
   */
  @UseGuards(JwtAuthGuard)
  @Post(':orderNumber/sandbox-pay')
  sandboxPay(@Req() req: any, @Param('orderNumber') orderNumber: string) {
    return this.orders.sandboxPay(orderNumber, req.user);
  }

  /**
   * Checkout requires an account. The storefront already forces sign-in before
   * an item can reach the cart; enforcing it here too is what actually
   * guarantees that every order in the database belongs to a real customer,
   * rather than relying on the client-side gate not being bypassed.
   *
   * Cost is nil — the request is authenticated either way; this only removes
   * the anonymous fallback.
   */
  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  checkout(@Req() req: any, @Body() dto: CreateOrderDto) {
    return this.orders.checkout({ userId: req.user.id }, dto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  mine(@CurrentUser('id') userId: string) {
    return this.orders.myOrders(userId);
  }

  // Requires auth: orders always belong to an account now, so an anonymous
  // lookup by orderNumber can only ever be someone guessing.
  @UseGuards(JwtAuthGuard)
  @Get(':orderNumber')
  getOne(@Req() req: any, @Param('orderNumber') orderNumber: string) {
    return this.orders.getByNumber(orderNumber, req.user);
  }

  // ---------------- Admin ----------------

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  adminList(@Query('status') status?: OrderStatus) {
    return this.orders.adminList(status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.orders.updateStatus(id, dto.status, dto.note);
  }
}
