import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6, { message: 'Enter the 6-digit code' })
  otp: string;
}

export class ResendVerificationDto {
  @IsEmail()
  email: string;
}
