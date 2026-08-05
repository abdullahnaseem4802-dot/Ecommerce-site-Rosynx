import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Self-service profile edit (name + phone). Email/role are never editable here. */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;
}
