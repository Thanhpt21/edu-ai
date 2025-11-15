import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { LessonResponseDto } from './dto/lesson-response.dto';
import { LessonQueryDto } from './dto/lesson-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class LessonsService {
  constructor(private prisma: PrismaService) {}

  // Tạo lesson mới
  async createLesson(dto: CreateLessonDto) {
    // Verify course exists
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId }
    });
    if (!course) throw new BadRequestException('Course không tồn tại');

    // Get max order for this course
    const maxOrder = await this.prisma.lesson.aggregate({
      where: { courseId: dto.courseId },
      _max: { order: true },
    });

    const lesson = await this.prisma.lesson.create({
      data: {
        title: dto.title,
        content: dto.content,
        videoUrl: dto.videoUrl,
        order: dto.order || (maxOrder._max.order || 0) + 1,
        courseId: dto.courseId,
        durationMin: dto.durationMin,
      },
      include: this.getLessonInclude(),
    });

    return {
      success: true,
      message: 'Tạo lesson thành công',
      data: this.formatLessonResponse(lesson),
    };
  }

  // Lấy danh sách lessons
  async getLessons(query: LessonQueryDto) {
    const { page = 1, limit = 10, search, courseId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.LessonWhereInput = {
      AND: [
        search ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
            { content: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
          ],
        } : {},
        courseId ? { courseId } : {},
      ],
    };

    const [lessons, total] = await this.prisma.$transaction([
      this.prisma.lesson.findMany({
        where,
        skip,
        take: Number(limit),
        include: this.getLessonInclude(),
        orderBy: [{ courseId: 'asc' }, { order: 'asc' }],
      }),
      this.prisma.lesson.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách lessons thành công',
      data: {
        data: lessons.map(lesson => this.formatLessonResponse(lesson)),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  // Lấy lessons theo courseId
  async getLessonsByCourseId(courseId: number) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId }
    });
    if (!course) throw new NotFoundException('Course không tồn tại');

    const lessons = await this.prisma.lesson.findMany({
      where: { courseId },
      include: this.getLessonInclude(),
      orderBy: { order: 'asc' },
    });

    return {
      success: true,
      message: 'Lấy danh sách lessons của course thành công',
      data: lessons.map(lesson => this.formatLessonResponse(lesson)),
    };
  }

  // Lấy lesson theo id
  async getLessonById(id: number) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: this.getLessonInclude(),
    });
    
    if (!lesson) throw new NotFoundException('Lesson không tồn tại');

    // Tăng view count
    await this.prisma.lesson.update({
      where: { id },
      data: { totalViews: { increment: 1 } }
    });

    return {
      success: true,
      message: 'Lấy lesson thành công',
      data: this.formatLessonResponse(lesson),
    };
  }

  async getLessonByIdForAdmin(id: number) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: this.getLessonInclude(),
    });
    
    if (!lesson) throw new NotFoundException('Lesson không tồn tại');

    // KHÔNG tăng view count cho admin

    return {
      success: true,
      message: 'Lấy lesson thành công',
      data: this.formatLessonResponse(lesson),
    };
  }

  // Cập nhật lesson
  async updateLesson(id: number, dto: UpdateLessonDto) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException('Lesson không tồn tại');

    // Verify course exists if changing course
    if (dto.courseId && dto.courseId !== lesson.courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: dto.courseId }
      });
      if (!course) throw new BadRequestException('Course không tồn tại');
    }

    const updated = await this.prisma.lesson.update({
      where: { id },
      data: dto,
      include: this.getLessonInclude(),
    });

    return {
      success: true,
      message: 'Cập nhật lesson thành công',
      data: this.formatLessonResponse(updated),
    };
  }

  // Xóa lesson
  async deleteLesson(id: number) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException('Lesson không tồn tại');

    await this.prisma.lesson.delete({ where: { id } });

    return {
      success: true,
      message: 'Xóa lesson thành công',
      data: null,
    };
  }

  // Sắp xếp lại lessons order
  async reorderLessons(courseId: number, lessonOrders: Array<{ id: number; order: number }>) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId }
    });
    if (!course) throw new NotFoundException('Course không tồn tại');

    // Verify all lessons belong to this course
    const lessonIds = lessonOrders.map(lo => lo.id);
    const lessons = await this.prisma.lesson.findMany({
      where: { id: { in: lessonIds } }
    });

    const invalidLessons = lessons.filter(lesson => lesson.courseId !== courseId);
    if (invalidLessons.length > 0) {
      throw new BadRequestException('Một số lessons không thuộc về course này');
    }

    // Update orders in transaction
    await this.prisma.$transaction(
      lessonOrders.map(lessonOrder =>
        this.prisma.lesson.update({
          where: { id: lessonOrder.id },
          data: { order: lessonOrder.order },
        })
      )
    );

    const updatedLessons = await this.prisma.lesson.findMany({
      where: { courseId },
      include: this.getLessonInclude(),
      orderBy: { order: 'asc' },
    });

    return {
      success: true,
      message: 'Sắp xếp lessons thành công',
      data: updatedLessons.map(lesson => this.formatLessonResponse(lesson)),
    };
  }

  // Helper methods
private getLessonInclude() {
  return {
    course: {
      select: {
        id: true,
        title: true,
        slug: true,
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    },
    // TẠM THỜI COMMENT HOẶC XÓA các relations chưa có
    // quizzes: {
    //   select: {
    //     id: true,
    //     title: true,
    //   }
    // },
    // assignments: {
    //   select: {
    //     id: true,
    //     title: true,
    //   }
    // },
    heygenVideos: {
      select: {
        id: true,
        videoId: true,
        title: true,
        status: true,
        videoUrl: true,        // THÊM field này
        thumbnailUrl: true,    // THÊM field này (nếu có)
        duration: true,        // THÊM field này (nếu có)
      }
    },
    _count: {
      select: {
        progress: true,
        // quizzes: true,     // Tạm comment
        // assignments: true, // Tạm comment
        heygenVideos: true,
      }
    }
  };
}

private formatLessonResponse(lesson: any) {
  return {
    ...new LessonResponseDto(lesson),
    course: lesson.course,
    // quizzes: lesson.quizzes,      // Tạm comment
    // assignments: lesson.assignments, // Tạm comment
    heygenVideos: lesson.heygenVideos,
    stats: {
      progressCount: lesson._count.progress,
      // quizCount: lesson._count.quizzes,        // Tạm comment  
      // assignmentCount: lesson._count.assignments, // Tạm comment
      heygenVideoCount: lesson._count.heygenVideos,
    }
  };
}
}