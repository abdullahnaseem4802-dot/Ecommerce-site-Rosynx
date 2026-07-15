import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ContactService } from './contact.service';
import { CreateContactDto, ReplyDto, UpdateContactDto } from './dto/contact.dto';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller()
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  // Guests may write in; a logged-in customer gets the message linked to their
  // account so they can follow the thread from /support.
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post('contact')
  create(@Req() req: any, @Body() dto: CreateContactDto) {
    return this.contact.create(dto, req.user?.id ?? null);
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
    return this.contact.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('admin/contact/:id/reply')
  reply(@Param('id') id: string, @Body() dto: ReplyDto) {
    return this.contact.adminReply(id, dto.body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('admin/contact/:id')
  remove(@Param('id') id: string) {
    return this.contact.remove(id);
  }
}
