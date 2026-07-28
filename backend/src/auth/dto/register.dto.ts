import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsRealEmail } from '../validators/is-real-email.validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @IsEmail({}, { message: 'Enter a valid email address' })
  @IsRealEmail()
  email: string;

  // At least 8 chars with a letter and a number — rejects trivially weak
  // passwords while staying friendly (no forced symbols/case).
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(72, { message: 'Password is too long' }) // bcrypt truncates past 72 bytes
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'Password must include at least one letter and one number',
  })
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
