// src/quiz/quiz.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  ParseIntPipe,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { QuizService } from './quiz.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { QuizQueryDto } from './dto/quiz-query.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard'; // Đảm bảo đường dẫn đúng

@Controller('quizzes')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  // =========== QUIZ CRUD ===========

  // Tạo Quiz mới
  @Post()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async createQuiz(@Body() dto: CreateQuizDto) {
    return this.quizService.createQuiz(dto);
  }

  // Lấy danh sách quizzes (phân trang, tìm kiếm)
  @Get()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async getQuizzes(@Query() query: QuizQueryDto) {
    return this.quizService.getQuizzes(query);
  }

  // Lấy quiz theo ID
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getQuizById(@Param('id', ParseIntPipe) id: number) {
    return this.quizService.getQuizById(id);
  }

  // Lấy quizzes của course
  @Get('course/:courseId')
  async getCourseQuizzes(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.quizService.getCourseQuizzes(courseId);
  }

  // Lấy quizzes của lesson
  @Get('lesson/:lessonId')
  async getLessonQuizzes(@Param('lessonId', ParseIntPipe) lessonId: number) {
    return this.quizService.getLessonQuizzes(lessonId);
  }

  // Cập nhật quiz
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateQuiz(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQuizDto,
  ) {
    return this.quizService.updateQuiz(id, dto);
  }

  // Xóa quiz
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteQuiz(@Param('id', ParseIntPipe) id: number) {
    return this.quizService.deleteQuiz(id);
  }

  // =========== STATS ENDPOINTS (Template) ===========

  // Lấy thống kê quiz
    @Get('stats/summary')
    @UseGuards(JwtAuthGuard)
    async getQuizStats(
    @Query('courseId', new ParseIntPipe({ optional: true })) courseId?: number,
    ) {
    return this.quizService.getQuizStats(courseId);
    }
}