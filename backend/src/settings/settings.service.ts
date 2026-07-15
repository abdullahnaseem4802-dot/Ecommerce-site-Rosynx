import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RevalidateService } from '../revalidate/revalidate.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

const SINGLETON_ID = 'singleton';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly revalidate: RevalidateService,
  ) {}

  /** Returns the singleton settings row, creating it with schema defaults if absent. */
  async get() {
    return this.prisma.storeSetting.upsert({
      where: { id: SINGLETON_ID },
      update: {},
      create: { id: SINGLETON_ID },
    });
  }

  // ---------------- Admin ----------------

  async update(dto: UpdateSettingsDto) {
    const saved = await this.prisma.storeSetting.upsert({
      where: { id: SINGLETON_ID },
      update: { ...dto },
      create: { id: SINGLETON_ID, ...dto },
    });
    this.revalidate.settings();
    return saved;
  }
}
