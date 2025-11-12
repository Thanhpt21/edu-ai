import { Lesson } from '@prisma/client';

export class LessonResponseDto {
  id: number;
  title: string;
  content?: string;
  videoUrl?: string;
  order: number;
  courseId: number;
  totalViews: number;
  durationMin?: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(lesson: Lesson) {
    this.id = lesson.id;
    this.title = lesson.title;
    this.content = lesson.content ?? undefined;
    this.videoUrl = lesson.videoUrl ?? undefined;
    this.order = lesson.order;
    this.courseId = lesson.courseId;
    this.totalViews = lesson.totalViews;
    this.durationMin = lesson.durationMin ?? undefined;
    this.createdAt = lesson.createdAt;
    this.updatedAt = lesson.updatedAt;
  }
}