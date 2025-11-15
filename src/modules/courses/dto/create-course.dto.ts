import { CourseLevel } from '@prisma/client';
import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, IsEnum } from 'class-validator';


export class CreateCourseDto {
  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;


  @IsOptional()
  @IsEnum(CourseLevel)
  level?: CourseLevel;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsNumber()
  instructorId: number;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  categoryIds?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  tagIds?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  prerequisiteIds?: number[];
}