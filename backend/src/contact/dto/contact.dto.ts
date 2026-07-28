import { TicketStatus } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsRealEmail } from '../../auth/validators/is-real-email.validator';

export class CreateContactDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail({}, { message: 'Enter a valid email address' })
  @IsRealEmail()
  email: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsString()
  @MinLength(1)
  message: string;
}

export class UpdateContactDto {
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;
}

export class ReplyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  body: string;
}
