import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlist: WishlistService) {}

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.wishlist.list(userId);
  }

  @Post(':productId')
  add(@CurrentUser('id') userId: string, @Param('productId') productId: string) {
    return this.wishlist.add(userId, productId);
  }

  @Delete(':productId')
  remove(
    @CurrentUser('id') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.wishlist.remove(userId, productId);
  }
}
