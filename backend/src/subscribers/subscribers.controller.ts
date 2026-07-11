import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { SubscribersService } from './subscribers.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller()
export class SubscribersController {
  constructor(private readonly subscribers: SubscribersService) {}

  @Public()
  @Post('subscribe')
  subscribe(@Body() dto: SubscribeDto) {
    return this.subscribers.subscribe(dto.email);
  }

  // ---------------- Admin ----------------

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/subscribers')
  list() {
    return this.subscribers.list();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('admin/subscribers/:id')
  remove(@Param('id') id: string) {
    return this.subscribers.remove(id);
  }
}
