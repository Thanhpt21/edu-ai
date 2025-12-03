// src/assignment/dto/create-assignment.dto.ts
import { IsString, IsOptional, IsInt, IsEnum, IsDateString, Min, Max } from 'class-validator';
import { AssignmentStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';

export class CreateAssignmentDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  @Transform(({ value }) => parseInt(value) || 100)
  maxScore?: number = 100;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => value ? parseInt(value) : null)
  courseId?: number | null;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => value ? parseInt(value) : null)
  lessonId?: number | null;

  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus = AssignmentStatus.DRAFT;
}