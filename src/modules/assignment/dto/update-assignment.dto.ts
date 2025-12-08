// src/assignment/dto/update-assignment.dto.ts
import { IsString, IsOptional, IsInt, IsEnum, IsDateString, Min, Max } from 'class-validator';
import { AssignmentStatus } from '@prisma/client';
import { Transform } from 'class-transformer';

export class UpdateAssignmentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string | null;

  @IsOptional()
    @Transform(({ value }) => {
    if (!value || value === '' || value === 'null') {
        return null
    }
    return value
    })
    dueDate?: string | null

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  @Transform(({ value }) => value !== undefined ? parseInt(value) : undefined)
  maxScore?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    return parseInt(value);
  })
  courseId?: number | null;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    return parseInt(value);
  })
  lessonId?: number | null;

  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus;
}