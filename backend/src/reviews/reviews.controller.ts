import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('products/:slug/reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Public()
  @Get()
  list(@Param('slug') slug: string) {
    return this.reviews.list(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Param('slug') slug: string,
    @Body() dto: { rating: number; title?: string; body?: string },
  ) {
    return this.reviews.create(userId, slug, dto);
  }
}
