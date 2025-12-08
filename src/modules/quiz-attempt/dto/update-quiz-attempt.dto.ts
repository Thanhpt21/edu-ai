import { IsOptional, IsInt, IsArray, IsNumber } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdateQuizAttemptDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  score?: number;

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