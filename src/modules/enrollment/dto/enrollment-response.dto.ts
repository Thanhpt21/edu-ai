import { Enrollment } from '@prisma/client';

export class EnrollmentResponseDto {
  id: number;
  userId: number;
  courseId: number;
  enrolledAt: Date;
  progress?: number;

  constructor(enrollment: Enrollment) {
    this.id = enrollment.id;
    this.userId = enrollment.userId;
    this.courseId = enrollment.courseId;
    this.enrolledAt = enrollment.enrolledAt;
    this.progress = enrollment.progress ?? undefined;
  }
}