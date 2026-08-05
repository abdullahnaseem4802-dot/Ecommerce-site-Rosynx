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
  jazzcashEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  easypaisaEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  cardEnabled?: boolean;

  // Structured receiving details (shown to customers at checkout).
  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  bankAccountTitle?: string;

  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @IsOptional()
  @IsString()
  bankIban?: string;

  @IsOptional()
  @IsString()
  jazzcashNumber?: string;

  @IsOptional()
  @IsString()
  jazzcashName?: string;

  @IsOptional()
  @IsString()
  easypaisaNumber?: string;

  @IsOptional()
  @IsString()
  easypaisaName?: string;

  @IsOptional()
  @IsString()
  bankDetails?: string;

  // Coupon code auto-emailed to new subscribers (empty = any active coupon).
  @IsOptional()
  @IsString()
  welcomeCouponCode?: string;
}
