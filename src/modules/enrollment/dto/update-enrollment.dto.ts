import { IsOptional, IsNumber, Min, Max } from 'class-validator';

export class UpdateEnrollmentDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;
}