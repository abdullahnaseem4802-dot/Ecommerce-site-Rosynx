import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
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

  // E.164-ish: optional +, then 7–15 digits (spaces/dashes/parens tolerated in
  // the raw string; the client sends "+92 300…"). Rejects the 20-digit garbage
  // the old validator let through.
  @IsString()
  @Matches(/^\+?[0-9\s\-().]{7,20}$/, { message: 'Enter a valid phone number' })
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

  // For manual methods (JazzCash / EasyPaisa / bank transfer): the transaction
  // ID / reference the customer enters after sending the money, so the admin can
  // match and verify the payment. Ignored for COD/card.
  @IsOptional()
  @IsString()
  @MaxLength(120)
  paymentReference?: string;

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
