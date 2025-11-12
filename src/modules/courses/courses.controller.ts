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
  Patch,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseQueryDto } from './dto/course-query.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // Tạo course mới
  @Post()
  @UseGuards(JwtAuthGuard)
  async createCourse(@Body() dto: CreateCourseDto) {
    return this.coursesService.createCourse(dto);
  }

  // Lấy danh sách courses
  @Get()
  async getCourses(@Query() query: CourseQueryDto) {
    return this.coursesService.getCourses(query);
  }

  // Lấy course theo id
  @Get(':id')
  async getCourseById(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.getCourseById(id);
  }

  // Lấy course theo slug
  @Get('slug/:slug')
  async getCourseBySlug(@Param('slug') slug: string) {
    return this.coursesService.getCourseBySlug(slug);
  }

  // Cập nhật course
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateCourse(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCourseDto
  ) {
    return this.coursesService.updateCourse(id, dto);
  }

  // Xóa course
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteCourse(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.deleteCourse(id);
  }

  // Toggle publish status
  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard)
  async togglePublish(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.togglePublish(id);
  }
}