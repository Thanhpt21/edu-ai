import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateQuizQuestionDto } from './dto/create-quiz-question.dto';
import { UpdateQuizQuestionDto } from './dto/update-quiz-question.dto';
import { QuizQuestionResponseDto } from './dto/quiz-question-response.dto';
import { QuizQuestionQueryDto } from './dto/quiz-question-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class QuizQuestionService {
  constructor(private prisma: PrismaService) {}

  // Helper function format response
  private formatQuestionResponse(question: any) {
    return new QuizQuestionResponseDto(question);
  }

  // Helper function check quiz tồn tại
  private async checkQuizExistence(quizId: number): Promise<void> {
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) throw new BadRequestException('Quiz không tồn tại');
  }

  // =========== CRUD OPERATIONS ===========

  async createQuestion(dto: CreateQuizQuestionDto) {
    await this.checkQuizExistence(dto.quizId);

    try {
      // Validate options là array
      if (!Array.isArray(dto.options)) {
        throw new BadRequestException('Options phải là mảng');
      }

      // Validate correct answer nằm trong options
      const optionValues = dto.options.map((opt) =>
        typeof opt === 'object' ? opt.value || opt : opt,
      );
      if (!optionValues.includes(dto.correct)) {
        throw new BadRequestException('Câu trả lời đúng phải nằm trong options');
      }

      const question = await this.prisma.quizQuestion.create({
        data: {
          quizId: dto.quizId,
          question: dto.question,
          options: dto.options,
          correct: dto.correct,
        },
      });

      return {
        success: true,
        message: 'Tạo câu hỏi thành công',
        data: this.formatQuestionResponse(question),
      };
    } catch (error: any) {
      throw new BadRequestException(`Không thể tạo câu hỏi: ${error.message}`);
    }
  }

  async getQuestions(query: QuizQuestionQueryDto) {
    const {
      page = 1,
      limit = 10,
      quizId,
      search = '',
      randomize = false,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.QuizQuestionWhereInput = {
      ...(quizId && { quizId }),
      ...(search && {
        question: { contains: search, mode: 'insensitive' as const },
      }),
    };

    // Xác định orderBy
    const orderBy: Prisma.QuizQuestionOrderByWithRelationInput = randomize
      ? { id: 'asc' } // Prisma không hỗ trợ random trực tiếp, có thể xử lý sau
      : { createdAt: 'desc' };

    const [questions, total] = await this.prisma.$transaction([
      this.prisma.quizQuestion.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy,
      }),
      this.prisma.quizQuestion.count({ where }),
    ]);

    // Xử lý randomize nếu cần
    if (randomize && questions.length > 0) {
      this.shuffleArray(questions);
    }

    return {
      success: true,
      message: 'Lấy danh sách câu hỏi thành công',
      data: {
        data: questions.map((q) => this.formatQuestionResponse(q)),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  async getQuestionById(id: number) {
    const question = await this.prisma.quizQuestion.findUnique({
      where: { id },
    });

    if (!question) {
      throw new NotFoundException('Câu hỏi không tồn tại');
    }

    return {
      success: true,
      message: 'Lấy câu hỏi thành công',
      data: this.formatQuestionResponse(question),
    };
  }

async getQuestionsByQuiz(quizId: number, randomize: boolean = false) {
  await this.checkQuizExistence(quizId);

  let questions = await this.prisma.quizQuestion.findMany({
    where: { quizId },
    orderBy: { createdAt: 'asc' },
  });

  // Xử lý randomize
  if (randomize && questions.length > 0) {
    // Random thứ tự câu hỏi
    this.shuffleArray(questions);
    
    // Random thứ tự options trong từng câu hỏi
    questions = questions.map(question => {
      // Chuyển đổi JsonValue thành array
      const optionsArray = this.convertJsonToArray(question.options);
      const shuffledOptions = [...optionsArray];
      this.shuffleArray(shuffledOptions);
      
      return {
        ...question,
        options: shuffledOptions,
      };
    });
  }

  return {
    success: true,
    message: 'Lấy câu hỏi của quiz thành công',
    data: questions.map((q) => this.formatQuestionResponse(q)),
  };
}

// Thêm helper method để convert JsonValue
private convertJsonToArray(jsonValue: any): any[] {
  if (Array.isArray(jsonValue)) {
    return jsonValue;
  }
  
  if (jsonValue === null || jsonValue === undefined) {
    return [];
  }
  
  // Nếu là string, thử parse JSON
  if (typeof jsonValue === 'string') {
    try {
      const parsed = JSON.parse(jsonValue);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [jsonValue];
    }
  }
  
  // Nếu là object, convert thành array
  if (typeof jsonValue === 'object') {
    return Object.values(jsonValue);
  }
  
  return [jsonValue];
}



  async updateQuestion(id: number, dto: UpdateQuizQuestionDto) {
    const question = await this.prisma.quizQuestion.findUnique({
      where: { id },
    });
    if (!question) throw new NotFoundException('Câu hỏi không tồn tại');

    if (dto.quizId !== undefined) {
      await this.checkQuizExistence(dto.quizId);
    }

    // Validate nếu có options và correct
    if (dto.options && dto.correct) {
      const optionValues = dto.options.map((opt) =>
        typeof opt === 'object' ? opt.value || opt : opt,
      );
      if (!optionValues.includes(dto.correct)) {
        throw new BadRequestException('Câu trả lời đúng phải nằm trong options');
      }
    }

    try {
      const updated = await this.prisma.quizQuestion.update({
        where: { id },
        data: {
          ...(dto.quizId !== undefined && { quizId: dto.quizId }),
          ...(dto.question !== undefined && { question: dto.question }),
          ...(dto.options !== undefined && { options: dto.options }),
          ...(dto.correct !== undefined && { correct: dto.correct }),
        },
      });

      return {
        success: true,
        message: 'Cập nhật câu hỏi thành công',
        data: this.formatQuestionResponse(updated),
      };
    } catch (error: any) {
      throw new BadRequestException(`Không thể cập nhật câu hỏi: ${error.message}`);
    }
  }

  async deleteQuestion(id: number) {
    const question = await this.prisma.quizQuestion.findUnique({
      where: { id },
    });
    if (!question) throw new NotFoundException('Câu hỏi không tồn tại');

    try {
      await this.prisma.quizQuestion.delete({ where: { id } });

      return {
        success: true,
        message: 'Xóa câu hỏi thành công',
        data: null,
      };
    } catch (error: any) {
      throw new BadRequestException(`Không thể xóa câu hỏi: ${error.message}`);
    }
  }

  async bulkCreateQuestions(quizId: number, questions: CreateQuizQuestionDto[]) {
    await this.checkQuizExistence(quizId);

    try {
      // Validate từng câu hỏi
      for (const question of questions) {
        if (!Array.isArray(question.options)) {
          throw new BadRequestException('Options phải là mảng');
        }

        const optionValues = question.options.map((opt) =>
          typeof opt === 'object' ? opt.value || opt : opt,
        );
        if (!optionValues.includes(question.correct)) {
          throw new BadRequestException('Câu trả lời đúng phải nằm trong options');
        }
      }

      const createdQuestions = await this.prisma.$transaction(
        questions.map((question) =>
          this.prisma.quizQuestion.create({
            data: {
              quizId,
              question: question.question,
              options: question.options,
              correct: question.correct,
            },
          }),
        ),
      );

      return {
        success: true,
        message: `Tạo ${createdQuestions.length} câu hỏi thành công`,
        data: createdQuestions.map((q) => this.formatQuestionResponse(q)),
      };
    } catch (error: any) {
      throw new BadRequestException(`Không thể tạo câu hỏi hàng loạt: ${error.message}`);
    }
  }

  // Helper function để shuffle array (cho randomize)
 private shuffleArray(array: any[]): any[] {
  if (!array || !Array.isArray(array)) {
    return array;
  }
  
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

}