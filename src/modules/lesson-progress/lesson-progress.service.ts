import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateLessonProgressDto } from './dto/create-lesson-progress.dto';
import { UpdateLessonProgressDto } from './dto/update-lesson-progress.dto';
import { LessonProgressResponseDto } from './dto/lesson-progress-response.dto';
import { LessonProgressQueryDto } from './dto/lesson-progress-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class LessonProgressService {
  constructor(private prisma: PrismaService) {}

  // Tạo hoặc cập nhật lesson progress
  async createOrUpdateLessonProgress(dto: CreateLessonProgressDto) {
    // Verify user and lesson exist
    await this.verifyUserAndLessonExist(dto.userId, dto.lessonId);

    const progress = await this.prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: dto.userId,
          lessonId: dto.lessonId,
        },
      },
      update: {
        completed: dto.completed !== undefined ? dto.completed : true,
        completedAt: dto.completed ? new Date() : null,
      },
      create: {
        userId: dto.userId,
        lessonId: dto.lessonId,
        completed: dto.completed !== undefined ? dto.completed : true,
        completedAt: dto.completed ? new Date() : null,
      },
      include: this.getProgressInclude(),
    });

    return {
      success: true,
      message: 'Cập nhật progress thành công',
      data: this.formatProgressResponse(progress),
    };
  }

  // Đánh dấu lesson hoàn thành
  async markLessonCompleted(userId: number, lessonId: number) {
    await this.verifyUserAndLessonExist(userId, lessonId);

    const progress = await this.prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {
        completed: true,
        completedAt: new Date(),
      },
      create: {
        userId,
        lessonId,
        completed: true,
        completedAt: new Date(),
      },
      include: this.getProgressInclude(),
    });

    return {
      success: true,
      message: 'Đánh dấu lesson hoàn thành thành công',
      data: this.formatProgressResponse(progress),
    };
  }

  // Đánh dấu lesson chưa hoàn thành
  async markLessonIncomplete(userId: number, lessonId: number) {
    await this.verifyUserAndLessonExist(userId, lessonId);

    const progress = await this.prisma.lessonProgress.update({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      data: {
        completed: false,
        completedAt: null,
      },
      include: this.getProgressInclude(),
    });

    return {
      success: true,
      message: 'Đánh dấu lesson chưa hoàn thành thành công',
      data: this.formatProgressResponse(progress),
    };
  }

  // Lấy danh sách progress
  async getLessonProgress(query: LessonProgressQueryDto) {
    const { page = 1, limit = 10, userId, lessonId, courseId, completed } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.LessonProgressWhereInput = {
      AND: [
        userId ? { userId } : {},
        lessonId ? { lessonId } : {},
        courseId ? { lesson: { courseId } } : {},
        completed !== undefined ? { completed } : {},
      ],
    };

    const [progress, total] = await this.prisma.$transaction([
      this.prisma.lessonProgress.findMany({
        where,
        skip,
        take: limit,
        include: this.getProgressInclude(),
        orderBy: { id: 'desc' }, 
      }),
      this.prisma.lessonProgress.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách progress thành công',
      data: {
        data: progress.map(p => this.formatProgressResponse(p)),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  // Lấy progress của user trong course
  async getCourseProgress(userId: number, courseId: number) {
    // Verify course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: {
          select: { id: true },
        },
      },
    });
    if (!course) throw new NotFoundException('Course không tồn tại');

    // Get all lessons in course
    const lessonIds = course.lessons.map(lesson => lesson.id);

    // Get progress for these lessons
    const progress = await this.prisma.lessonProgress.findMany({
      where: {
        userId,
        lessonId: { in: lessonIds },
      },
      include: this.getProgressInclude(),
    });

    const completedLessons = progress.filter(p => p.completed);
    const totalLessons = lessonIds.length;
    const completionPercentage = totalLessons > 0 ? (completedLessons.length / totalLessons) * 100 : 0;

    return {
      success: true,
      message: 'Lấy course progress thành công',
      data: {
        course: {
          id: course.id,
          title: course.title,
          slug: course.slug,
        },
        progress: progress.map(p => this.formatProgressResponse(p)),
        stats: {
          totalLessons,
          completedLessons: completedLessons.length,
          completionPercentage: Math.round(completionPercentage),
        },
      },
    };
  }

  // Lấy progress theo id
  async getLessonProgressById(id: number) {
    const progress = await this.prisma.lessonProgress.findUnique({
      where: { id },
      include: this.getProgressInclude(),
    });
    
    if (!progress) throw new NotFoundException('Progress không tồn tại');

    return {
      success: true,
      message: 'Lấy progress thành công',
      data: this.formatProgressResponse(progress),
    };
  }

  // Lấy progress của user cho lesson
  async getUserLessonProgress(userId: number, lessonId: number) {
    const progress = await this.prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      include: this.getProgressInclude(),
    });

    return {
      success: true,
      message: 'Lấy user lesson progress thành công',
      data: progress ? this.formatProgressResponse(progress) : null,
    };
  }

  // Lấy lesson tiếp theo cần học
  async getNextLesson(userId: number, courseId: number) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            order: true,
          },
        },
      },
    });
    if (!course) throw new NotFoundException('Course không tồn tại');

    // Get progress for all lessons in course
    const lessonIds = course.lessons.map(lesson => lesson.id);
    const progress = await this.prisma.lessonProgress.findMany({
      where: {
        userId,
        lessonId: { in: lessonIds },
      },
    });

    // Find first incomplete lesson
    const completedLessonIds = new Set(progress.filter(p => p.completed).map(p => p.lessonId));
    const nextLesson = course.lessons.find(lesson => !completedLessonIds.has(lesson.id));

    return {
      success: true,
      message: 'Lấy next lesson thành công',
      data: {
        nextLesson,
        completedLessons: completedLessonIds.size,
        totalLessons: course.lessons.length,
      },
    };
  }

  // Cập nhật progress
  async updateLessonProgress(id: number, dto: UpdateLessonProgressDto) {
    const progress = await this.prisma.lessonProgress.findUnique({ 
      where: { id } 
    });
    if (!progress) throw new NotFoundException('Progress không tồn tại');

    const updateData: any = {
      completed: dto.completed,
    };

    if (dto.completed && !progress.completed) {
      updateData.completedAt = new Date();
    } else if (!dto.completed) {
      updateData.completedAt = null;
    }

    const updated = await this.prisma.lessonProgress.update({
      where: { id },
      data: updateData,
      include: this.getProgressInclude(),
    });

    return {
      success: true,
      message: 'Cập nhật progress thành công',
      data: this.formatProgressResponse(updated),
    };
  }

  // Xóa progress
  async deleteLessonProgress(id: number) {
    const progress = await this.prisma.lessonProgress.findUnique({ 
      where: { id } 
    });
    if (!progress) throw new NotFoundException('Progress không tồn tại');

    await this.prisma.lessonProgress.delete({ where: { id } });

    return {
      success: true,
      message: 'Xóa progress thành công',
      data: null,
    };
  }

  // Helper methods
  private getProgressInclude() {
    return {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      lesson: {
        select: {
          id: true,
          title: true,
          order: true,
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      },
    };
  }

  private formatProgressResponse(progress: any) {
    return {
      ...new LessonProgressResponseDto(progress),
      user: progress.user,
      lesson: progress.lesson,
    };
  }

  private async verifyUserAndLessonExist(userId: number, lessonId: number) {
    const [user, lesson] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.lesson.findUnique({ where: { id: lessonId } }),
    ]);

    if (!user) throw new BadRequestException('User không tồn tại');
    if (!lesson) throw new BadRequestException('Lesson không tồn tại');
  }
}