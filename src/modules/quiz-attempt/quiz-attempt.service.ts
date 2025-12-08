import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateQuizAttemptDto } from './dto/create-quiz-attempt.dto';
import { SubmitQuizAttemptDto } from './dto/submit-quiz-attempt.dto';
import { UpdateQuizAttemptDto } from './dto/update-quiz-attempt.dto';
import { QuizAttemptResponseDto } from './dto/quiz-attempt-response.dto';
import { QuizAttemptQueryDto } from './dto/quiz-attempt-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class QuizAttemptService {
  constructor(private prisma: PrismaService) {}

  // Helper function format response
  private formatAttemptResponse(attempt: any) {
    return new QuizAttemptResponseDto(attempt);
  }

  // Helper function check tồn tại
  private async checkQuizExistence(quizId: number): Promise<void> {
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) throw new BadRequestException('Quiz không tồn tại');
  }

  private async checkUserExistence(userId: number): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User không tồn tại');
  }

  // Helper tính điểm tự động
  private async calculateScore(quizId: number, answers: any[]): Promise<number> {
    try {
      // Lấy tất cả câu hỏi của quiz
      const questions = await this.prisma.quizQuestion.findMany({
        where: { quizId },
        select: {
          id: true,
          correct: true,
        },
      });

      if (questions.length === 0) return 0;

      // Tạo map cho dễ truy cập
      const questionMap = new Map();
      questions.forEach(q => {
        questionMap.set(q.id, q.correct);
      });

      // Tính số câu đúng
      let correctCount = 0;
      answers.forEach(answer => {
        const correctAnswer = questionMap.get(answer.questionId);
        if (correctAnswer && answer.selectedOption === correctAnswer) {
          correctCount++;
        }
      });

      // Tính điểm (tối đa 100 điểm)
      const score = Math.round((correctCount / questions.length) * 100);
      return score;
    } catch (error) {
      console.error('Error calculating score:', error);
      return 0;
    }
  }

  // =========== CRUD OPERATIONS ===========

  async startAttempt(dto: CreateQuizAttemptDto) {
    await this.checkQuizExistence(dto.quizId);
    await this.checkUserExistence(dto.studentId);

    // Kiểm tra attempt count hiện tại
    const latestAttempt = await this.prisma.quizAttempt.findFirst({
      where: {
        quizId: dto.quizId,
        studentId: dto.studentId,
      },
      orderBy: { attemptCount: 'desc' },
    });

    const attemptCount = latestAttempt ? latestAttempt.attemptCount + 1 : 1;

    // Kiểm tra nếu attempt đã tồn tại và chưa submit
    const existingAttempt = await this.prisma.quizAttempt.findUnique({
      where: {
        quizId_studentId_attemptCount: {
          quizId: dto.quizId,
          studentId: dto.studentId,
          attemptCount: attemptCount,
        },
      },
    });

    if (existingAttempt) {
      if (existingAttempt.submittedAt) {
        throw new ConflictException('Bạn đã hoàn thành attempt này rồi');
      }
      // Nếu attempt tồn tại nhưng chưa submit, trả về attempt đó
      return {
        success: true,
        message: 'Đã có attempt đang làm, tiếp tục làm attempt này',
        data: this.formatAttemptResponse(existingAttempt),
      };
    }

    try {
      const attempt = await this.prisma.quizAttempt.create({
        data: {
          quizId: dto.quizId,
          studentId: dto.studentId,
          answers: dto.answers || [],
          attemptCount: attemptCount,
          startedAt: new Date(),
        },
        include: {
          quiz: {
            select: {
              id: true,
              title: true,
              courseId: true,
              lessonId: true,
              duration: true,
              isPublished: true,
            },
          },
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Bắt đầu làm quiz thành công',
        data: this.formatAttemptResponse(attempt),
      };
    } catch (error: any) {
      throw new BadRequestException(`Không thể bắt đầu quiz: ${error.message}`);
    }
  }

  async submitAttempt(id: number, dto: SubmitQuizAttemptDto) {
  const attempt = await this.prisma.quizAttempt.findUnique({
    where: { id },
    include: { quiz: true },
  });

  if (!attempt) throw new NotFoundException('Attempt không tồn tại');
  if (attempt.submittedAt) {
    throw new BadRequestException('Attempt đã được submit rồi');
  }

  try {
    // Tính điểm tự động nếu không có score
    let score = dto.score;
    if (score === undefined && dto.answers && dto.answers.length > 0) {
      score = await this.calculateScore(attempt.quizId, dto.answers);
    }

    const updated = await this.prisma.quizAttempt.update({
      where: { id },
      data: {
        submittedAt: new Date(),
        score: score || null,
        answers: dto.answers || attempt.answers,
        // Không có updatedAt field
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            courseId: true,
            lessonId: true,
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Submit quiz thành công',
      data: this.formatAttemptResponse(updated),
    };
  } catch (error: any) {
    throw new BadRequestException(`Không thể submit quiz: ${error.message}`);
  }
}

  async getAttempts(query: QuizAttemptQueryDto) {
    const {
      page = 1,
      limit = 10,
      quizId,
      studentId,
      courseId,
      lessonId,
      submitted,
      sortBy = 'startedAt',
      sortOrder = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    // Build where condition
    const where: Prisma.QuizAttemptWhereInput = {
      ...(quizId && { quizId }),
      ...(studentId && { studentId }),
      ...(submitted !== undefined && {
        submittedAt: submitted ? { not: null } : null,
      }),
      ...((courseId || lessonId) && {
        quiz: {
          ...(courseId && { courseId }),
          ...(lessonId && { lessonId }),
        },
      }),
    };

    // Build orderBy
    const orderBy: Prisma.QuizAttemptOrderByWithRelationInput = {};
    const validSortFields = ['startedAt', 'submittedAt', 'score', 'attemptCount', 'createdAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'startedAt';
    orderBy[sortField] = sortOrder;

    const [attempts, total] = await this.prisma.$transaction([
      this.prisma.quizAttempt.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy,
        include: {
          quiz: {
            select: {
              id: true,
              title: true,
              courseId: true,
              lessonId: true,
            },
          },
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.quizAttempt.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách attempts thành công',
      data: {
        data: attempts.map((attempt) => this.formatAttemptResponse(attempt)),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  async getAttemptById(id: number) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            description: true,
            courseId: true,
            lessonId: true,
            duration: true,
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt không tồn tại');
    }

    return {
      success: true,
      message: 'Lấy attempt thành công',
      data: this.formatAttemptResponse(attempt),
    };
  }

  async getUserQuizAttempts(quizId: number, studentId: number) {
    await this.checkQuizExistence(quizId);
    await this.checkUserExistence(studentId);

    const attempts = await this.prisma.quizAttempt.findMany({
      where: {
        quizId,
        studentId,
      },
      orderBy: { startedAt: 'desc' },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            courseId: true,
            lessonId: true,
          },
        },
      },
    });

    // Tính thống kê
    const totalAttempts = attempts.length;
    const submittedAttempts = attempts.filter(a => a.submittedAt).length;
    const highestScore = attempts.reduce((max, attempt) => {
      return attempt.score && attempt.score > max ? attempt.score : max;
    }, 0);

    return {
      success: true,
      message: 'Lấy lịch sử attempts thành công',
      data: {
        attempts: attempts.map((attempt) => this.formatAttemptResponse(attempt)),
        stats: {
          totalAttempts,
          submittedAttempts,
          highestScore,
          averageScore: submittedAttempts > 0 
            ? attempts
                .filter(a => a.score !== null)
                .reduce((sum, a) => sum + (a.score || 0), 0) / submittedAttempts
            : 0,
          completionRate: totalAttempts > 0 
            ? Math.round((submittedAttempts / totalAttempts) * 100) 
            : 0,
        },
      },
    };
  }

  async updateAttempt(id: number, dto: UpdateQuizAttemptDto) {
  const attempt = await this.prisma.quizAttempt.findUnique({ where: { id } });
  if (!attempt) throw new NotFoundException('Attempt không tồn tại');

  try {
    const updateData: Prisma.QuizAttemptUpdateInput = {};
    // Không có updatedAt field

    if (dto.score !== undefined) updateData.score = dto.score;
    if (dto.answers !== undefined) updateData.answers = dto.answers;

    const updated = await this.prisma.quizAttempt.update({
      where: { id },
      data: updateData,
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            courseId: true,
            lessonId: true,
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Cập nhật attempt thành công',
      data: this.formatAttemptResponse(updated),
    };
  } catch (error: any) {
    throw new BadRequestException(`Không thể cập nhật attempt: ${error.message}`);
  }
}

  async deleteAttempt(id: number) {
    const attempt = await this.prisma.quizAttempt.findUnique({ where: { id } });
    if (!attempt) throw new NotFoundException('Attempt không tồn tại');

    try {
      await this.prisma.quizAttempt.delete({ where: { id } });

      return {
        success: true,
        message: 'Xóa attempt thành công',
        data: null,
      };
    } catch (error: any) {
      throw new BadRequestException(`Không thể xóa attempt: ${error.message}`);
    }
  }

  async getQuizStatistics(quizId: number) {
    await this.checkQuizExistence(quizId);

    const attempts = await this.prisma.quizAttempt.findMany({
      where: {
        quizId,
        submittedAt: { not: null },
        score: { not: null },
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const totalAttempts = attempts.length;
    const averageScore = totalAttempts > 0
      ? attempts.reduce((sum, a) => sum + (a.score || 0), 0) / totalAttempts
      : 0;

    // Phân bố điểm
    const scoreDistribution = attempts.reduce((dist, attempt) => {
      const score = attempt.score || 0;
      let range: string;
      
      if (score >= 90) range = '90-100';
      else if (score >= 80) range = '80-89';
      else if (score >= 70) range = '70-79';
      else if (score >= 60) range = '60-69';
      else if (score >= 50) range = '50-59';
      else range = '0-49';
      
      dist[range] = (dist[range] || 0) + 1;
      return dist;
    }, {} as Record<string, number>);

    // Top performers
    const topPerformers = [...attempts]
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 10)
      .map(attempt => ({
        studentId: attempt.studentId,
        studentName: attempt.student?.name || `User ${attempt.studentId}`,
        score: attempt.score,
        submittedAt: attempt.submittedAt,
        attemptCount: attempt.attemptCount,
      }));

    // Lấy thông tin quiz để tính completion rate
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        _count: {
          select: { attempts: true },
        },
      },
    });

    const allAttemptsCount = quiz?._count?.attempts || 0;
    const completionRate = allAttemptsCount > 0 
      ? Math.round((totalAttempts / allAttemptsCount) * 100)
      : 0;

    return {
      success: true,
      message: 'Lấy thống kê quiz thành công',
      data: {
        quizId,
        totalAttempts,
        submittedAttempts: totalAttempts,
        averageScore: Math.round(averageScore * 100) / 100,
        highestScore: attempts.length > 0 
          ? Math.max(...attempts.map(a => a.score || 0))
          : 0,
        lowestScore: attempts.length > 0 
          ? Math.min(...attempts.map(a => a.score || 0))
          : 0,
        scoreDistribution,
        topPerformers,
        completionRate,
        totalStudents: new Set(attempts.map(a => a.studentId)).size,
      },
    };
  }

  async getUserStatistics(studentId: number) {
    await this.checkUserExistence(studentId);

    const attempts = await this.prisma.quizAttempt.findMany({
        where: {
        studentId,
        submittedAt: { not: null },
        score: { not: null },
        },
        include: {
        quiz: {
            select: {
            id: true,
            title: true,
            courseId: true,
            lessonId: true,
            },
        },
        },
    });

    const totalAttempts = attempts.length;
    const totalQuizzes = new Set(attempts.map(a => a.quizId)).size;
    const averageScore = totalAttempts > 0
        ? attempts.reduce((sum, a) => sum + (a.score || 0), 0) / totalAttempts
        : 0;

    // Phân tích theo quiz
    const quizStats = attempts.reduce((stats, attempt) => {
        const quizId = attempt.quizId;
        if (!stats[quizId]) {
        stats[quizId] = {
            quizId,
            quizTitle: attempt.quiz?.title || `Quiz ${quizId}`,
            attempts: 0,
            totalScore: 0,
            highestScore: 0,
            lastAttempt: attempt.startedAt,
        };
        }
        
        stats[quizId].attempts++;
        stats[quizId].totalScore += attempt.score || 0;
        stats[quizId].highestScore = Math.max(stats[quizId].highestScore, attempt.score || 0);
        if (attempt.startedAt > stats[quizId].lastAttempt) {
        stats[quizId].lastAttempt = attempt.startedAt;
        }
        
        return stats;
    }, {} as Record<number, any>);

    // Chuyển thành array và tính average
    const quizStatsArray = Object.values(quizStats).map((stat: any) => ({
        ...stat,
        averageScore: Math.round((stat.totalScore / stat.attempts) * 100) / 100,
    }));

    return {
        success: true,
        message: 'Lấy thống kê user thành công',
        data: {
        studentId,
        totalAttempts,
        totalQuizzes,
        averageScore: Math.round(averageScore * 100) / 100,
        highestScore: attempts.length > 0 
            ? Math.max(...attempts.map(a => a.score || 0))
            : 0,
        quizStats: quizStatsArray,
        recentAttempts: attempts
            .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
            .slice(0, 5)
            .map(attempt => ({
            quizId: attempt.quizId,
            quizTitle: attempt.quiz?.title,
            score: attempt.score,
            submittedAt: attempt.submittedAt,
            attemptCount: attempt.attemptCount,
            })),
        },
    };
  }

  async getActiveAttempt(quizId: number, studentId: number) {
  await this.checkQuizExistence(quizId);
  await this.checkUserExistence(studentId);

  // Tìm attempt có submittedAt = null (chưa nộp)
  const activeAttempt = await this.prisma.quizAttempt.findFirst({
    where: {
      quizId,
      studentId,
      submittedAt: null,
    },
    orderBy: { startedAt: 'desc' },
    include: {
      quiz: {
        select: {
          id: true,
          title: true,
          courseId: true,
          lessonId: true,
        },
      },
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!activeAttempt) {
    throw new NotFoundException('Không tìm thấy attempt đang làm dở');
  }

  return {
    success: true,
    message: 'Lấy attempt đang làm dở thành công',
    data: this.formatAttemptResponse(activeAttempt),
  };
}
}