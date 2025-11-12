import { IsOptional, IsString, IsNumber } from 'class-validator';

export class CategoryQueryDto {
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string = '';
}