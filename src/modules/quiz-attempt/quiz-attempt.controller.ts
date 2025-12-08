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
import { QuizAttemptService } from './quiz-attempt.service';
import { CreateQuizAttemptDto } from './dto/create-quiz-attempt.dto';
import { SubmitQuizAttemptDto } from './dto/submit-quiz-attempt.dto';
import { UpdateQuizAttemptDto } from './dto/update-quiz-attempt.dto';
import { QuizAttemptQueryDto } from './dto/quiz-attempt-query.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('quiz-attempts')
export class QuizAttemptController {
  constructor(private readonly quizAttemptService: QuizAttemptService) {}

  // =========== CRUD ENDPOINTS ===========

  @Post()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async startAttempt(@Body() dto: CreateQuizAttemptDto) {
    return this.quizAttemptService.startAttempt(dto);
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async submitAttempt(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitQuizAttemptDto,
  ) {
    return this.quizAttemptService.submitAttempt(id, dto);
  }

  @Get('quiz/:quizId/user/:studentId/active')
  async getActiveAttempt(
    @Param('quizId', ParseIntPipe) quizId: number,
    @Param('studentId', ParseIntPipe) studentId: number,
  ) {
    return this.quizAttemptService.getActiveAttempt(quizId, studentId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async getAttempts(@Query() query: QuizAttemptQueryDto) {
    return this.quizAttemptService.getAttempts(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getAttemptById(@Param('id', ParseIntPipe) id: number) {
    return this.quizAttemptService.getAttemptById(id);
  }

  @Get('quiz/:quizId/user/:studentId')
  @UseGuards(JwtAuthGuard)
  async getUserQuizAttempts(
    @Param('quizId', ParseIntPipe) quizId: number,
    @Param('studentId', ParseIntPipe) studentId: number,
  ) {
    return this.quizAttemptService.getUserQuizAttempts(quizId, studentId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateAttempt(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQuizAttemptDto,
  ) {
    return this.quizAttemptService.updateAttempt(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteAttempt(@Param('id', ParseIntPipe) id: number) {
    return this.quizAttemptService.deleteAttempt(id);
  }

  // =========== STATISTICS ENDPOINTS ===========

  @Get('quiz/:quizId/statistics')
  @UseGuards(JwtAuthGuard)
  async getQuizStatistics(@Param('quizId', ParseIntPipe) quizId: number) {
    return this.quizAttemptService.getQuizStatistics(quizId);
  }

    @Get('user/:studentId/statistics')
    @UseGuards(JwtAuthGuard)
    async getUserStatistics(@Param('studentId', ParseIntPipe) studentId: number) {
    // Sửa: Gọi service method thay vì return hardcoded
    return this.quizAttemptService.getUserStatistics(studentId);
    }
}