// src/assignment/dto/assignment-query.dto.ts
import { IsOptional, IsInt, IsString, IsEnum } from 'class-validator';
import { AssignmentStatus } from '@prisma/client';

export class AssignmentQueryDto {
  @IsOptional()
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @IsInt()
  limit?: number = 10;

  @IsOptional()
  @IsInt()
  courseId?: number;

  @IsOptional()
  @IsInt()
  lessonId?: number;

  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus;

  @IsOptional()
  @IsString()
  search?: string = '';
}