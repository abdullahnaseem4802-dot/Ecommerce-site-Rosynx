import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateFaqDto {
  @IsString()
  @MinLength(3)
  question: string;

  @IsString()
  @MinLength(1)
  answer: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateFaqDto extends PartialType(CreateFaqDto) {}
