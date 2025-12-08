import { IsInt, IsOptional, IsArray } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateQuizAttemptDto {
  @IsInt()
  @Type(() => Number)
  quizId: number;

  @IsInt()
  @Type(() => Number)
  studentId: number;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
    return value;
  })
  answers?: any[];
}