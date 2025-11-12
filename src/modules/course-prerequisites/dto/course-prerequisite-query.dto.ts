import { IsOptional, IsNumber } from 'class-validator';

export class CoursePrerequisiteQueryDto {
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  limit?: number = 10;

  @IsOptional()
  @IsNumber()
  courseId?: number;

  @IsOptional()
  @IsNumber()
  prerequisiteCourseId?: number;
}