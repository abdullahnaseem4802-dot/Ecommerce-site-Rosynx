import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { CouponType } from '@prisma/client';

export class CreateCouponDto {
  @IsString()
  code: string;

  @IsEnum(CouponType)
  type: CouponType;

  @IsInt()
  @Min(0)
  value: number; // PERCENT: 0-100, FIXED: cents

  @IsOptional()
  @IsInt()
  @Min(0)
  minSubtotalCents?: number;

  @IsOptional()
  @Type(() => Date)
  startsAt?: Date;

  @IsOptional()
  @Type(() => Date)
  expiresAt?: Date;

  @IsOptional()
  @IsInt()
  @Min(0)
  usageLimit?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ValidateCouponDto {
  @IsString()
  code: string;

  @IsInt()
  @Min(0)
  subtotalCents: number;
}
