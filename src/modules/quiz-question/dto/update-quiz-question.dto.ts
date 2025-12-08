import { IsOptional, IsString, IsArray, IsObject, IsInt } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdateQuizQuestionDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  quizId?: number;

  @IsOptional()
  @IsString()
  question?: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  options?: any[];

  @IsOptional()
  @IsString()
  correct?: string;

}