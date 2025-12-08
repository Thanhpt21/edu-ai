// src/quiz/quiz.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { UploadService } from '../upload/upload.service'; // Dù không dùng file, vẫn giữ cấu trúc
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { QuizResponseDto } from './dto/quiz-response.dto';
import { QuizQueryDto } from './dto/quiz-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class QuizService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService, // Giữ cấu trúc
  ) {}

  // Helper function cho include (đã đơn giản hóa)
  private getQuizInclude() {
    return {
      course: {
        select: { id: true, title: true, slug: true, level: true },
      },
      lesson: {
        select: { id: true, title: true, order: true },
      },
      questions: {
        select: { id: true },
      },
      _count: {
        select: { questions: true, attempts: true },
      },
    };
  }

  // Helper function format response
  private formatQuizResponse(quiz: any) {
    // Tính tổng số câu hỏi và lần thi
    const totalQuestions = quiz._count?.questions ?? 0;
    const totalAttempts = quiz._count?.attempts ?? 0;

    // Giả định tính averageScore trong stats (cần logic cụ thể cho QuizAttempts)
    const stats = {
      totalQuestions,
      totalAttempts,
      averageScore: 0, // Cần logic tính điểm thật
    };

    return {
      ...new QuizResponseDto(quiz),
      course: quiz.course,
      lesson: quiz.lesson,
      stats,
    };
  }

  // Helper function check tồn tại
  private async checkCourseLessonExistence(
    courseId: number | null | undefined,
    lessonId: number | null | undefined,
  ): Promise<void> {
    if (courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
      });
      if (!course) throw new BadRequestException('Course không tồn tại');
    }
    if (lessonId) {
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: lessonId },
      });
      if (!lesson) throw new BadRequestException('Lesson không tồn tại');
    }
  }

  // =========== QUIZ CRUD ===========

  async createQuiz(dto: CreateQuizDto) {
    await this.checkCourseLessonExistence(dto.courseId, dto.lessonId);

    try {
      const quiz = await this.prisma.quiz.create({
        data: {
          title: dto.title,
          description: dto.description || null,
          courseId: dto.courseId || null,
          lessonId: dto.lessonId || null,
          duration: dto.duration || null,
          isPublished: dto.isPublished,
          randomizeQuestions: dto.randomizeQuestions,
          questionOrder: dto.questionOrder || undefined,
        },
        include: this.getQuizInclude(),
      });

      return {
        success: true,
        message: 'Tạo quiz thành công',
        data: this.formatQuizResponse(quiz),
      };
    } catch (error: any) {
      throw new BadRequestException(`Không thể tạo quiz: ${error.message}`);
    }
  }

  async getQuizzes(query: QuizQueryDto) {
    const {
      page = 1,
      limit = 10,
      courseId,
      lessonId,
      isPublished,
      search = '',
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.QuizWhereInput = {
      ...(courseId && { courseId: courseId }),
      ...(lessonId && { lessonId: lessonId }),
      ...(isPublished !== undefined && { isPublished: isPublished }),
      ...(search && {
        OR: [
          // Sử dụng mode: 'insensitive' as const
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
          {
            course: { title: { contains: search, mode: 'insensitive' as const } },
          },
        ],
      }),
    };

    const [quizzes, total] = await this.prisma.$transaction([
      this.prisma.quiz.findMany({
        where,
        skip,
        take: Number(limit),
        include: this.getQuizInclude(),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.quiz.count({ where }),
    ]);

    const quizzesWithStats = quizzes.map((quiz) =>
      this.formatQuizResponse(quiz),
    );

    return {
      success: true,
      message: 'Lấy danh sách quizzes thành công',
      data: {
        data: quizzesWithStats,
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  async getQuizById(id: number) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: this.getQuizInclude(),
    });

    if (!quiz) {
      throw new NotFoundException('Quiz không tồn tại');
    }

    return {
      success: true,
      message: 'Lấy quiz thành công',
      data: this.formatQuizResponse(quiz),
    };
  }

  async getCourseQuizzes(courseId: number) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) throw new NotFoundException('Course không tồn tại');

    const quizzes = await this.prisma.quiz.findMany({
      where: { courseId, isPublished: true },
      include: this.getQuizInclude(),
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      message: 'Lấy danh sách quizzes của course thành công',
      data: quizzes.map((quiz) => this.formatQuizResponse(quiz)),
    };
  }

  async getLessonQuizzes(lessonId: number) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });
    if (!lesson) throw new NotFoundException('Lesson không tồn tại');

    const quizzes = await this.prisma.quiz.findMany({
      where: { lessonId, isPublished: true },
      include: this.getQuizInclude(),
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      message: 'Lấy danh sách quizzes của lesson thành công',
      data: quizzes.map((quiz) => this.formatQuizResponse(quiz)),
    };
  }

async updateQuiz(id: number, dto: UpdateQuizDto) {
  const quiz = await this.prisma.quiz.findUnique({ where: { id } });
  if (!quiz) throw new NotFoundException('Quiz không tồn tại');

  await this.checkCourseLessonExistence(dto.courseId, dto.lessonId);

  // Lọc dữ liệu update
  const updateData: Prisma.QuizUpdateInput = {};

  if (dto.title !== undefined) updateData.title = dto.title;
  if (dto.description !== undefined) updateData.description = dto.description;
  
  // Xử lý các trường relation
  if (dto.courseId !== undefined) {
    updateData.course = dto.courseId === null 
      ? { disconnect: true } 
      : { connect: { id: dto.courseId } };
  }
  
  if (dto.lessonId !== undefined) {
    updateData.lesson = dto.lessonId === null 
      ? { disconnect: true } 
      : { connect: { id: dto.lessonId } };
  }
  
  if (dto.duration !== undefined) updateData.duration = dto.duration;
  if (dto.isPublished !== undefined) updateData.isPublished = dto.isPublished;
  if (dto.randomizeQuestions !== undefined)
    updateData.randomizeQuestions = dto.randomizeQuestions;
  if (dto.questionOrder !== undefined)
    updateData.questionOrder = dto.questionOrder;

  try {
    const updated = await this.prisma.quiz.update({
      where: { id },
      data: updateData,
      include: this.getQuizInclude(),
    });

    return {
      success: true,
      message: 'Cập nhật quiz thành công',
      data: this.formatQuizResponse(updated),
    };
  } catch (error: any) {
    throw new BadRequestException(`Không thể cập nhật quiz: ${error.message}`);
  }
}

  async deleteQuiz(id: number) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id } });
    if (!quiz) throw new NotFoundException('Quiz không tồn tại');

    try {
      await this.prisma.quiz.delete({ where: { id } });

      return {
        success: true,
        message: 'Xóa quiz thành công',
        data: null,
      };
    } catch (error: any) {
      throw new BadRequestException(`Không thể xóa quiz: ${error.message}`);
    }
  }

    async getQuizStats(courseId?: number) {
    try {
        // Tạo điều kiện where
        const where: Prisma.QuizWhereInput = {};
        if (courseId) {
        where.courseId = courseId;
        }

        // Lấy tổng số quizzes
        const totalQuizzes = await this.prisma.quiz.count({ where });

        // Lấy tổng số quizzes đã published
        const publishedQuizzes = await this.prisma.quiz.count({
        where: { ...where, isPublished: true },
        });

        // Lấy tổng số questions trong tất cả quizzes
        const totalQuestionsResult = await this.prisma.quiz.findMany({
        where,
        select: {
            _count: {
            select: { questions: true },
            },
        },
        });

        const totalQuestions = totalQuestionsResult.reduce(
        (sum, quiz) => sum + (quiz._count?.questions || 0),
        0,
        );

        // Lấy tổng số attempts trong tất cả quizzes
        const totalAttemptsResult = await this.prisma.quiz.findMany({
        where,
        select: {
            _count: {
            select: { attempts: true },
            },
        },
        });

        const totalAttempts = totalAttemptsResult.reduce(
        (sum, quiz) => sum + (quiz._count?.attempts || 0),
        0,
        );

        // Tính averageScore (nếu có attempts)
        let averageScore = 0;
        if (totalAttempts > 0) {
        const attemptsWithScores = await this.prisma.quizAttempt.findMany({
            where: {
            quiz: where,
            score: { not: null },
            },
            select: { score: true },
        });

        if (attemptsWithScores.length > 0) {
            const totalScore = attemptsWithScores.reduce(
            (sum, attempt) => sum + (attempt.score || 0),
            0,
            );
            averageScore = Math.round((totalScore / attemptsWithScores.length) * 100) / 100;
        }
        }

        // Lấy thống kê quizzes theo course (cách 1: dùng findMany và nhóm thủ công)
        const quizzesWithCourses = await this.prisma.quiz.findMany({
        where,
        select: {
            courseId: true,
            course: {
            select: {
                id: true,
                title: true,
            },
            },
        },
        });

        // Nhóm thủ công
        const quizzesByCourseMap = new Map<number, { courseId: number, courseTitle: string, count: number }>();
        
        quizzesWithCourses.forEach((quiz) => {
        const courseId = quiz.courseId;
        if (courseId) {
            const existing = quizzesByCourseMap.get(courseId) || {
            courseId,
            courseTitle: quiz.course?.title || 'Unknown',
            count: 0,
            };
            existing.count++;
            quizzesByCourseMap.set(courseId, existing);
        } else {
            // Xử lý quizzes không có course
            const noCourseKey = 0;
            const existing = quizzesByCourseMap.get(noCourseKey) || {
            courseId: 0,
            courseTitle: 'No Course',
            count: 0,
            };
            existing.count++;
            quizzesByCourseMap.set(noCourseKey, existing);
        }
        });

        const quizzesByCourse = Array.from(quizzesByCourseMap.values());

        return {
        success: true,
        message: 'Lấy thống kê thành công',
        data: {
            totalQuizzes,
            totalQuestions,
            totalAttempts,
            publishedQuizzes,
            averageScore,
            unpublishedQuizzes: totalQuizzes - publishedQuizzes,
            quizzesByCourse,
            // Thêm một số thống kê khác
            quizzesByStatus: {
            published: publishedQuizzes,
            unpublished: totalQuizzes - publishedQuizzes,
            },
        },
        };
    } catch (error: any) {
        throw new BadRequestException(`Không thể lấy thống kê: ${error.message}`);
    }
    }
}