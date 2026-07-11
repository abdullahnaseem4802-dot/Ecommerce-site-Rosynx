import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { StorageService } from './storage/storage.service';
import { Public } from './auth/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  async health() {
    const t0 = Date.now();
    await this.prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - t0;
    const cloudinary = await this.storage.ping();
    return {
      status: 'ok',
      db: 'connected',
      dbLatencyMs,
      cloudinary: cloudinary ? 'connected' : 'unreachable',
      time: new Date().toISOString(),
    };
  }
}
