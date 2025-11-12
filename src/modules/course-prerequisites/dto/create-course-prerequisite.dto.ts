import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateCoursePrerequisiteDto {
  @IsInt()
  @IsNotEmpty()
  courseId: number;

  @IsInt()
  @IsNotEmpty()
  prerequisiteCourseId: number;
}