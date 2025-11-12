import { IsString, IsOptional, IsNumber, IsInt, IsUrl } from 'class-validator';

export class CreateLessonDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsInt()
  courseId: number;

  @IsOptional()
  @IsInt()
  durationMin?: number;
}