import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateBlogPostDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsOptional()
  @IsString()
  slug?: string; // auto-generated from title if omitted

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  readTime?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateBlogPostDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  readTime?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
