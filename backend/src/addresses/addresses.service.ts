import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddressDto } from '../orders/dto/create-order.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { id: 'asc' }],
    });
  }

  async create(userId: string, dto: AddressDto & { isDefault?: boolean }) {
    const count = await this.prisma.address.count({ where: { userId } });
    const isDefault = dto.isDefault || count === 0;
    if (isDefault)
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    return this.prisma.address.create({
      data: {
        userId,
        label: (dto as any).label,
        line1: dto.line1,
        line2: dto.line2,
        city: dto.city,
        state: dto.state,
        country: dto.country,
        postalCode: dto.postalCode,
        phone: dto.phone,
        isDefault,
      },
    });
  }

  async update(userId: string, id: string, dto: Partial<AddressDto> & { isDefault?: boolean }) {
    await this.ensureOwned(userId, id);
    if (dto.isDefault)
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    return this.prisma.address.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    await this.ensureOwned(userId, id);
    await this.prisma.address.delete({ where: { id } });
    return { deleted: true };
  }

  private async ensureOwned(userId: string, id: string) {
    const a = await this.prisma.address.findUnique({ where: { id } });
    if (!a || a.userId !== userId) throw new NotFoundException('Address not found');
  }
}
