import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import {
  UpdateCustomerDto,
  UpdateCustomerStatusDto,
} from './dto/customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  stats() {
    return this.admin.overview();
  }

  @Get('customers')
  customers() {
    return this.admin.customers();
  }

  @Get('customers/:id')
  customer(@Param('id') id: string) {
    return this.admin.customer(id);
  }

  @Patch('customers/:id')
  updateCustomer(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.admin.updateCustomer(id, dto);
  }

  // Password reset moved to the customer-facing forgot-password flow (emailed
  // OTP). Admins can no longer set a customer's password directly.

  @Patch('customers/:id/status')
  setCustomerStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerStatusDto,
  ) {
    return this.admin.setCustomerStatus(id, dto);
  }

  @Get('inventory-stats')
  inventoryStats() {
    return this.admin.inventoryStats();
  }
}
