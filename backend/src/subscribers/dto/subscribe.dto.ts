import { IsEmail } from 'class-validator';
import { IsRealEmail } from '../../auth/validators/is-real-email.validator';

export class SubscribeDto {
  @IsEmail({}, { message: 'Enter a valid email address' })
  @IsRealEmail()
  email: string;
}
