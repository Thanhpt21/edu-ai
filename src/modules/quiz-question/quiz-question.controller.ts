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
import { QuizQuestionService } from './quiz-question.service';
import { CreateQuizQuestionDto } from './dto/create-quiz-question.dto';
import { UpdateQuizQuestionDto } from './dto/update-quiz-question.dto';
import { QuizQuestionQueryDto } from './dto/quiz-question-query.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('quiz-questions')
export class QuizQuestionController {
  constructor(private readonly quizQuestionService: QuizQuestionService) {}

  // =========== CRUD ENDPOINTS ===========

  @Post()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async createQuestion(@Body() dto: CreateQuizQuestionDto) {
    return this.quizQuestionService.createQuestion(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async getQuestions(@Query() query: QuizQuestionQueryDto) {
    return this.quizQuestionService.getQuestions(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getQuestionById(@Param('id', ParseIntPipe) id: number) {
    return this.quizQuestionService.getQuestionById(id);
  }

  @Get('quiz/:quizId')
  async getQuestionsByQuiz(
    @Param('quizId', ParseIntPipe) quizId: number,
    @Query('randomize') randomize?: string,
  ) {
    const shouldRandomize = randomize === 'true';
    return this.quizQuestionService.getQuestionsByQuiz(quizId, shouldRandomize);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateQuestion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQuizQuestionDto,
  ) {
    return this.quizQuestionService.updateQuestion(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteQuestion(@Param('id', ParseIntPipe) id: number) {
    return this.quizQuestionService.deleteQuestion(id);
  }

  // =========== BULK OPERATIONS ===========

  @Post('bulk/:quizId')
  @UseGuards(JwtAuthGuard)
  async bulkCreateQuestions(
    @Param('quizId', ParseIntPipe) quizId: number,
    @Body() questions: CreateQuizQuestionDto[],
  ) {
    return this.quizQuestionService.bulkCreateQuestions(quizId, questions);
  }
}