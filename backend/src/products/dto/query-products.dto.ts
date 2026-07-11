import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export const PRODUCT_SORTS = [
  'newest',
  'price-asc',
  'price-desc',
  'rating',
  'bestselling',
] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export class QueryProductsDto {
  @IsOptional()
  @IsString()
  category?: string; // category slug

  @IsOptional()
  @IsString()
  material?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  minPrice?: number; // in currency units (e.g. dollars)

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  inStock?: boolean;

  @IsOptional()
  @IsIn(PRODUCT_SORTS)
  sort?: ProductSort = 'newest';

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 12;
}
