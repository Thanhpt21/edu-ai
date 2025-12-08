import { IsInt, IsArray, IsOptional, IsNumber } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class SubmitQuizAttemptDto {
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
  answers: any[];

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  score?: number;
}