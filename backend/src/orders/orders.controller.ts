import {
  Body,
  Controller,
  Get,
  Headers,
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
import { Public } from '../auth/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
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
  @Public()
  @Post(':orderNumber/sandbox-pay')
  sandboxPay(@Param('orderNumber') orderNumber: string) {
    return this.orders.sandboxPay(orderNumber);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post('checkout')
  checkout(
    @Req() req: any,
    @Headers('x-guest-token') guestToken: string,
    @Body() dto: CreateOrderDto,
  ) {
    const identity = req.user?.id
      ? { userId: req.user.id }
      : { guestToken: dto.guestToken ?? guestToken };
    return this.orders.checkout(identity, dto, req.user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  mine(@CurrentUser('id') userId: string) {
    return this.orders.myOrders(userId);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':orderNumber')
  getOne(@Req() req: any, @Param('orderNumber') orderNumber: string) {
    return this.orders.getByNumber(orderNumber, req.user ?? undefined);
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
  updateStatus(@Param('id') id: string, @Body('status') status: OrderStatus) {
    return this.orders.updateStatus(id, status);
  }
}
