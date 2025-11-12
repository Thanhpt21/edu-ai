import { LessonProgress } from '@prisma/client';

export class LessonProgressResponseDto {
  id: number;
  userId: number;
  lessonId: number;
  completed: boolean;
  completedAt?: Date;


  constructor(progress: LessonProgress) {
    this.id = progress.id;
    this.userId = progress.userId;
    this.lessonId = progress.lessonId;
    this.completed = progress.completed;
    this.completedAt = progress.completedAt ?? undefined;
  }
}