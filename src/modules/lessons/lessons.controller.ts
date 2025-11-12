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
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { LessonQueryDto } from './dto/lesson-query.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  // Tạo lesson mới
  @Post()
  @UseGuards(JwtAuthGuard)
  async createLesson(@Body() dto: CreateLessonDto) {
    return this.lessonsService.createLesson(dto);
  }

  // Lấy danh sách lessons
  @Get()
  async getLessons(@Query() query: LessonQueryDto) {
    return this.lessonsService.getLessons(query);
  }

  // Lấy lessons theo courseId
  @Get('course/:courseId')
  async getLessonsByCourseId(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.lessonsService.getLessonsByCourseId(courseId);
  }

  // Lấy lesson theo id
  @Get(':id')
  async getLessonById(@Param('id', ParseIntPipe) id: number) {
    return this.lessonsService.getLessonById(id);
  }

  // Cập nhật lesson
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateLesson(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLessonDto
  ) {
    return this.lessonsService.updateLesson(id, dto);
  }

  // Xóa lesson
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteLesson(@Param('id', ParseIntPipe) id: number) {
    return this.lessonsService.deleteLesson(id);
  }

  // Sắp xếp lessons order
  @Post('course/:courseId/reorder')
  @UseGuards(JwtAuthGuard)
  async reorderLessons(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() body: { lessons: Array<{ id: number; order: number }> }
  ) {
    return this.lessonsService.reorderLessons(courseId, body.lessons);
  }
}