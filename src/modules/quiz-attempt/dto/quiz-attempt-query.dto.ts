import { IsOptional, IsInt, IsBoolean, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class QuizAttemptQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  quizId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  studentId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  courseId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  lessonId?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  submitted?: boolean;

  @IsOptional()
  @IsString()
  sortBy?: string = 'startedAt';

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value === 'asc' ? 'asc' : 'desc')
  sortOrder?: 'asc' | 'desc' = 'desc';
}