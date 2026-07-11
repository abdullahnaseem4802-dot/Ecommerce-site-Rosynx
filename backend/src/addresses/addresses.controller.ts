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
import { AddressesService } from './addresses.service';
import { AddressDto } from '../orders/dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.addresses.list(userId);
  }

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: AddressDto & { isDefault?: boolean },
  ) {
    return this.addresses.create(userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: Partial<AddressDto> & { isDefault?: boolean },
  ) {
    return this.addresses.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.addresses.remove(userId, id);
  }
}
