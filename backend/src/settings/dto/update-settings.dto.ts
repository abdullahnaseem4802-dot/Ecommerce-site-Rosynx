import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  storeName?: string;

  @IsOptional()
  @IsString()
  supportEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  addressLine?: string;

  @IsOptional()
  @IsString()
  baseCurrency?: string;

  @IsOptional()
  @IsBoolean()
  freeShipping?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  freeShippingThresholdCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  flatShippingCents?: number;

  @IsOptional()
  @IsBoolean()
  codEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  bankTransferEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  cardEnabled?: boolean;

  @IsOptional()
  @IsString()
  bankDetails?: string;

  // Coupon code auto-emailed to new subscribers (empty = any active coupon).
  @IsOptional()
  @IsString()
  welcomeCouponCode?: string;
}
