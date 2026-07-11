import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class OrderItemInput {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  qty: number;
}

export class AddressDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  phone: string;

  @IsString()
  line1: string;

  @IsOptional()
  @IsString()
  line2?: string;

  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsString()
  country: string;

  @IsOptional()
  @IsString()
  postalCode?: string;
}

export class CreateOrderDto {
  @IsEmail()
  email: string;

  @ValidateNested()
  @Type(() => AddressDto)
  shipping: AddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  billing?: AddressDto;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  guestToken?: string;

  // If provided, the order is built from these items (server still recomputes
  // prices from the DB). Otherwise the server-side cart is used.
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInput)
  items?: OrderItemInput[];
}
