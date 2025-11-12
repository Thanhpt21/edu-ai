import { CoursePrerequisite } from '@prisma/client';

export class CoursePrerequisiteResponseDto {
  id: number;
  courseId: number;
  prerequisiteCourseId: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(prerequisite: CoursePrerequisite) {
    this.id = prerequisite.id;
    this.courseId = prerequisite.courseId;
    this.prerequisiteCourseId = prerequisite.prerequisiteCourseId;
    this.createdAt = prerequisite.createdAt;
    this.updatedAt = prerequisite.updatedAt;
  }
}