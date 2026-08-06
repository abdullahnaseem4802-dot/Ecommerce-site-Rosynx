import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * Changing the login email is account-takeover sensitive, so it is gated by the
 * current password (same guard as changing the password). The new address is
 * normalised to lowercase in the service.
 */
export class ChangeEmailDto {
  @IsString()
  @MinLength(1)
  currentPassword!: string;

  @IsEmail({}, { message: 'Enter a valid email address' })
  newEmail!: string;
}
