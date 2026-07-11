import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CartService, CartIdentity } from './cart.service';
import { Public } from '../auth/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('cart')
@Public()
@UseGuards(OptionalJwtAuthGuard)
export class CartController {
  constructor(private readonly cart: CartService) {}

  private identity(req: any, guestToken?: string): CartIdentity {
    return req.user?.id
      ? { userId: req.user.id }
      : { guestToken };
  }

  @Get()
  get(@Req() req: any, @Headers('x-guest-token') guestToken: string) {
    return this.cart.get(this.identity(req, guestToken));
  }

  @Post('items')
  add(
    @Req() req: any,
    @Headers('x-guest-token') guestToken: string,
    @Body() body: { productId: string; qty?: number },
  ) {
    return this.cart.addItem(
      this.identity(req, guestToken),
      body.productId,
      body.qty ?? 1,
    );
  }

  @Patch('items/:productId')
  setQty(
    @Req() req: any,
    @Headers('x-guest-token') guestToken: string,
    @Param('productId') productId: string,
    @Body() body: { qty: number },
  ) {
    return this.cart.setQty(this.identity(req, guestToken), productId, body.qty);
  }

  @Delete('items/:productId')
  remove(
    @Req() req: any,
    @Headers('x-guest-token') guestToken: string,
    @Param('productId') productId: string,
  ) {
    return this.cart.removeItem(this.identity(req, guestToken), productId);
  }

  @Delete()
  clear(@Req() req: any, @Headers('x-guest-token') guestToken: string) {
    return this.cart.clear(this.identity(req, guestToken));
  }

  @Post('merge')
  merge(@Req() req: any, @Body() body: { guestToken: string }) {
    return this.cart.merge(req.user.id, body.guestToken);
  }
}
