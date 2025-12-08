import { IsString, IsInt, IsArray, IsOptional, IsObject } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateQuizQuestionDto {
  @IsInt()
  @Transform(({ value }) => parseInt(value))
  quizId: number;

  @IsString()
  question: string;

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
  options: any[];

  @IsString()
  correct: string;

}