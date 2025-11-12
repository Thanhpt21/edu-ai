import { IsInt, IsBoolean, IsOptional } from 'class-validator';

export class CreateLessonProgressDto {
  @IsInt()
  userId: number;

  @IsInt()
  lessonId: number;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}