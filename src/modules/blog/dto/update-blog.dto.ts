// dto/update-blog.dto.ts
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ContentItemDto } from './content-item.dto';
import { Type } from 'class-transformer';

export class UpdateBlogDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  thumb?: string;

  @IsOptional()
  @IsString()
  content: string;


  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
