import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateLessonProgressDto {
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}