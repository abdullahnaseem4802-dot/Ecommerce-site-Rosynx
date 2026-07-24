import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Enter a valid email address' })
  email: string;
}

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Enter a valid email address' })
  email: string;

  @IsString()
  @Length(6, 6, { message: 'The reset code is 6 digits' })
  otp: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  newPassword: string;
}
