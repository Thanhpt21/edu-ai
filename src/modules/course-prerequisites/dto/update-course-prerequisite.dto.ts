import { IsInt, IsOptional } from 'class-validator';

export class UpdateCoursePrerequisiteDto {
  @IsOptional()
  @IsInt()
  courseId?: number;

  @IsOptional()
  @IsInt()
  prerequisiteCourseId?: number;
}