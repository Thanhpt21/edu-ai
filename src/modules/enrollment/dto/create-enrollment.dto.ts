import { IsInt, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateEnrollmentDto {
  @IsInt()
  userId: number;

  @IsInt()
  courseId: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;
}