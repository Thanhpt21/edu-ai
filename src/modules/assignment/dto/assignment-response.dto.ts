// src/assignment/dto/assignment-response.dto.ts
import { Assignment, AssignmentStatus } from '@prisma/client';

export class AssignmentResponseDto {
  id: number;
  title: string;
  description?: string;
  fileUrl?: string;
  dueDate?: Date;
  maxScore: number;
  courseId?: number;
  lessonId?: number;
  status: AssignmentStatus;
  createdAt: Date;
  updatedAt: Date;
  course?: any;
  lesson?: any;
  stats?: {
    totalSubmissions: number;
    gradedSubmissions: number;
    averageScore?: number;
    submittedByUser?: boolean;
    userScore?: number;
  };

  constructor(assignment: Assignment) {
    this.id = assignment.id;
    this.title = assignment.title;
    this.description = assignment.description ?? undefined;
    this.fileUrl = assignment.fileUrl ?? undefined;
    this.dueDate = assignment.dueDate ?? undefined;
    this.maxScore = assignment.maxScore;
    this.courseId = assignment.courseId ?? undefined;
    this.lessonId = assignment.lessonId ?? undefined;
    this.status = assignment.status;
    this.createdAt = assignment.createdAt;
    this.updatedAt = assignment.updatedAt;
  }
}