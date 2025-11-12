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
} from '@nestjs/common';
import { LessonProgressService } from './lesson-progress.service';
import { CreateLessonProgressDto } from './dto/create-lesson-progress.dto';
import { UpdateLessonProgressDto } from './dto/update-lesson-progress.dto';
import { LessonProgressQueryDto } from './dto/lesson-progress-query.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('lesson-progress')
export class LessonProgressController {
  constructor(private readonly lessonProgressService: LessonProgressService) {}

  // Tạo hoặc cập nhật progress
  @Post()
  @UseGuards(JwtAuthGuard)
  async createOrUpdateLessonProgress(@Body() dto: CreateLessonProgressDto) {
    return this.lessonProgressService.createOrUpdateLessonProgress(dto);
  }

  // Đánh dấu lesson hoàn thành
  @Post('user/:userId/lesson/:lessonId/complete')
  @UseGuards(JwtAuthGuard)
  async markLessonCompleted(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('lessonId', ParseIntPipe) lessonId: number
  ) {
    return this.lessonProgressService.markLessonCompleted(userId, lessonId);
  }

  // Đánh dấu lesson chưa hoàn thành
  @Post('user/:userId/lesson/:lessonId/incomplete')
  @UseGuards(JwtAuthGuard)
  async markLessonIncomplete(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('lessonId', ParseIntPipe) lessonId: number
  ) {
    return this.lessonProgressService.markLessonIncomplete(userId, lessonId);
  }

  // Lấy danh sách progress
  @Get()
  async getLessonProgress(@Query() query: LessonProgressQueryDto) {
    return this.lessonProgressService.getLessonProgress(query);
  }

  // Lấy progress của user trong course
  @Get('user/:userId/course/:courseId')
  async getCourseProgress(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('courseId', ParseIntPipe) courseId: number
  ) {
    return this.lessonProgressService.getCourseProgress(userId, courseId);
  }

  // Lấy progress theo id
  @Get(':id')
  async getLessonProgressById(@Param('id', ParseIntPipe) id: number) {
    return this.lessonProgressService.getLessonProgressById(id);
  }

  // Lấy progress của user cho lesson
  @Get('user/:userId/lesson/:lessonId')
  async getUserLessonProgress(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('lessonId', ParseIntPipe) lessonId: number
  ) {
    return this.lessonProgressService.getUserLessonProgress(userId, lessonId);
  }

  // Lấy lesson tiếp theo cần học
  @Get('user/:userId/course/:courseId/next-lesson')
  async getNextLesson(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('courseId', ParseIntPipe) courseId: number
  ) {
    return this.lessonProgressService.getNextLesson(userId, courseId);
  }

  // Cập nhật progress
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateLessonProgress(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLessonProgressDto
  ) {
    return this.lessonProgressService.updateLessonProgress(id, dto);
  }

  // Xóa progress
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteLessonProgress(@Param('id', ParseIntPipe) id: number) {
    return this.lessonProgressService.deleteLessonProgress(id);
  }
}