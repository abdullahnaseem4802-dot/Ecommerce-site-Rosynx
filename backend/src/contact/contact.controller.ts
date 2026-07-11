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
import { ContactService } from './contact.service';
import { CreateContactDto, UpdateContactDto } from './dto/contact.dto';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller()
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  @Public()
  @Post('contact')
  create(@Body() dto: CreateContactDto) {
    return this.contact.create(dto);
  }

  // ---------------- Admin ----------------

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/contact')
  list() {
    return this.contact.list();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('admin/contact/:id')
  update(@Param('id') id: string, @Body() dto: UpdateContactDto) {
    return this.contact.setRead(id, dto.isRead);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('admin/contact/:id')
  remove(@Param('id') id: string) {
    return this.contact.remove(id);
  }
}
