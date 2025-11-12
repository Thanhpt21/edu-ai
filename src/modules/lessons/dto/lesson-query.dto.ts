import { IsOptional, IsString, IsNumber, IsInt } from 'class-validator';

export class LessonQueryDto {
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string = '';

  @IsOptional()
  @IsInt()
  courseId?: number;
}