import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { FaqService } from './faq.service';
import { CreateFaqDto, UpdateFaqDto } from './dto/faq.dto';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller()
export class FaqController {
  constructor(private readonly faq: FaqService) {}

  @Public()
  @Get('faqs')
  list() {
    return this.faq.list();
  }

  // ---------------- Admin ----------------

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/faqs')
  adminList() {
    return this.faq.adminList();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('admin/faqs')
  create(@Body() dto: CreateFaqDto) {
    return this.faq.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('admin/faqs/:id')
  update(@Param('id') id: string, @Body() dto: UpdateFaqDto) {
    return this.faq.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('admin/faqs/:id')
  remove(@Param('id') id: string) {
    return this.faq.remove(id);
  }
}
