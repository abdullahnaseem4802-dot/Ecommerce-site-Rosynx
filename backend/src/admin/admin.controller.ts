import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
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

  @Get('inventory-stats')
  inventoryStats() {
    return this.admin.inventoryStats();
  }
}
