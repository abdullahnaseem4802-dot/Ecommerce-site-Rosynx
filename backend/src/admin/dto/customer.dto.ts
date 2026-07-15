import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * Email is deliberately NOT editable here: it is the login identity and is
 * unique, so changing it from the admin panel would silently lock the customer
 * out of their own account.
 */
export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class ResetCustomerPasswordDto {
  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class UpdateCustomerStatusDto {
  @IsBoolean()
  isActive: boolean;
}
