import { Course, CourseLevel } from '@prisma/client';

export class CourseResponseDto {
  id: number;
  title: string;
  slug: string;
  description?: string;
  thumbnail?: string;
  level: CourseLevel;
  price?: number;
  isPublished: boolean;
  instructorId: number;
  totalViews: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(course: Course) {
    this.id = course.id;
    this.title = course.title;
    this.slug = course.slug;
    this.description = course.description ?? undefined;
    this.thumbnail = course.thumbnail ?? undefined;
    this.level = course.level;
    this.price = course.price ?? undefined;
    this.isPublished = course.isPublished;
    this.instructorId = course.instructorId;
    this.totalViews = course.totalViews;
    this.createdAt = course.createdAt;
    this.updatedAt = course.updatedAt;
  }
}