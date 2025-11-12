import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { EnrollmentResponseDto } from './dto/enrollment-response.dto';
import { EnrollmentQueryDto } from './dto/enrollment-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  // Tạo enrollment mới
  async createEnrollment(dto: CreateEnrollmentDto) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId }
    });
    if (!user) throw new BadRequestException('User không tồn tại');

    // Check if course exists
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId }
    });
    if (!course) throw new BadRequestException('Course không tồn tại');

    // Check if already enrolled
    const existing = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: dto.userId,
          courseId: dto.courseId,
        },
      },
    });
    if (existing) throw new BadRequestException('User đã đăng ký khóa học này');

    const enrollment = await this.prisma.enrollment.create({
      data: {
        userId: dto.userId,
        courseId: dto.courseId,
        progress: dto.progress || 0,
      },
      include: this.getEnrollmentInclude(),
    });

    return {
      success: true,
      message: 'Đăng ký khóa học thành công',
      data: this.formatEnrollmentResponse(enrollment),
    };
  }

  // Lấy danh sách enrollments
  async getEnrollments(query: EnrollmentQueryDto) {
    const { page = 1, limit = 10, userId, courseId, search = '' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.EnrollmentWhereInput = {
      AND: [
        userId ? { userId } : {},
        courseId ? { courseId } : {},
        search ? {
          OR: [
            { user: { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } } },
            { user: { email: { contains: search, mode: 'insensitive' as Prisma.QueryMode } } },
            { course: { title: { contains: search, mode: 'insensitive' as Prisma.QueryMode } } },
            { course: { slug: { contains: search, mode: 'insensitive' as Prisma.QueryMode } } },
          ],
        } : {},
      ],
    };

    const [enrollments, total] = await this.prisma.$transaction([
      this.prisma.enrollment.findMany({
        where,
        skip,
        take: Number(limit),
        include: this.getEnrollmentInclude(),
        orderBy: { enrolledAt: 'desc' },
      }),
      this.prisma.enrollment.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách enrollments thành công',
      data: {
        data: enrollments.map(enrollment => this.formatEnrollmentResponse(enrollment)),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  // Lấy enrollments của user
  async getUserEnrollments(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) throw new NotFoundException('User không tồn tại');

    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      include: this.getEnrollmentInclude(),
      orderBy: { enrolledAt: 'desc' },
    });

    return {
      success: true,
      message: 'Lấy danh sách khóa học đã đăng ký thành công',
      data: enrollments.map(enrollment => this.formatEnrollmentResponse(enrollment)),
    };
  }

  // Lấy enrollments của course
  async getCourseEnrollments(courseId: number) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId }
    });
    if (!course) throw new NotFoundException('Course không tồn tại');

    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId },
      include: this.getEnrollmentInclude(),
      orderBy: { enrolledAt: 'desc' },
    });

    return {
      success: true,
      message: 'Lấy danh sách học viên thành công',
      data: enrollments.map(enrollment => this.formatEnrollmentResponse(enrollment)),
    };
  }

  // Lấy enrollment theo id
  async getEnrollmentById(id: number) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      include: this.getEnrollmentInclude(),
    });
    
    if (!enrollment) throw new NotFoundException('Enrollment không tồn tại');

    return {
      success: true,
      message: 'Lấy enrollment thành công',
      data: this.formatEnrollmentResponse(enrollment),
    };
  }

  // Kiểm tra user đã enrolled chưa
  async checkEnrollment(userId: number, courseId: number) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      include: this.getEnrollmentInclude(),
    });

    return {
      success: true,
      message: 'Kiểm tra enrollment thành công',
      data: enrollment ? this.formatEnrollmentResponse(enrollment) : null,
    };
  }

  // Cập nhật enrollment
  async updateEnrollment(id: number, dto: UpdateEnrollmentDto) {
    const enrollment = await this.prisma.enrollment.findUnique({ where: { id } });
    if (!enrollment) throw new NotFoundException('Enrollment không tồn tại');

    const updated = await this.prisma.enrollment.update({
      where: { id },
      data: dto,
      include: this.getEnrollmentInclude(),
    });

    return {
      success: true,
      message: 'Cập nhật enrollment thành công',
      data: this.formatEnrollmentResponse(updated),
    };
  }

  // Cập nhật progress tự động dựa trên lesson progress
  async updateProgress(enrollmentId: number) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          include: {
            lessons: {
              select: { id: true },
            },
          },
        },
      },
    });
    
    if (!enrollment) throw new NotFoundException('Enrollment không tồn tại');

    // Đếm số lesson đã completed
    const completedLessons = await this.prisma.lessonProgress.count({
      where: {
        userId: enrollment.userId,
        lessonId: {
          in: enrollment.course.lessons.map(lesson => lesson.id),
        },
        completed: true,
      },
    });

    const totalLessons = enrollment.course.lessons.length;
    const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    const updated = await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { progress },
      include: this.getEnrollmentInclude(),
    });

    return {
      success: true,
      message: 'Cập nhật progress thành công',
      data: this.formatEnrollmentResponse(updated),
    };
  }

  // Xóa enrollment
  async deleteEnrollment(id: number) {
    const enrollment = await this.prisma.enrollment.findUnique({ where: { id } });
    if (!enrollment) throw new NotFoundException('Enrollment không tồn tại');

    await this.prisma.enrollment.delete({ where: { id } });

    return {
      success: true,
      message: 'Hủy đăng ký khóa học thành công',
      data: null,
    };
  }

  // Helper methods
  private getEnrollmentInclude() {
    return {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          level: true,
          price: true,
          instructor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              lessons: true,
            },
          },
        },
      },
    };
  }

  private formatEnrollmentResponse(enrollment: any) {
    return {
      ...new EnrollmentResponseDto(enrollment),
      user: enrollment.user,
      course: {
        ...enrollment.course,
        totalLessons: enrollment.course._count.lessons,
      },
    };
  }
}