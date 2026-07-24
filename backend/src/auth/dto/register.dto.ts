import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { IsRealEmail } from '../validators/is-real-email.validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail({}, { message: 'Enter a valid email address' })
  @IsRealEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
