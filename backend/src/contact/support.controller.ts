import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ReplyDto } from './dto/contact.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * Customer-facing view of the contact messages they submitted while logged in.
 * Every route is scoped to the current user — a ticket belonging to someone
 * else 404s rather than 403s so we don't leak that it exists.
 */
@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly contact: ContactService) {}

  @Get('mine')
  mine(@CurrentUser('id') userId: string) {
    return this.contact.myTickets(userId);
  }

  @Get(':id')
  getOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.contact.myTicket(id, userId);
  }

  @Post(':id/reply')
  reply(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: ReplyDto,
  ) {
    return this.contact.customerReply(id, userId, dto.body);
  }
}
