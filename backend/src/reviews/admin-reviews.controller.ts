import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  list() {
    return this.reviews.adminList();
  }

  @Patch(':id')
  setApproved(@Param('id') id: string, @Body('isApproved') isApproved: boolean) {
    return this.reviews.setApproved(id, isApproved);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reviews.adminRemove(id);
  }
}
