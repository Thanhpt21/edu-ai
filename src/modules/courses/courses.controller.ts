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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
  @UseInterceptors(FileInterceptor('thumbnail'))
  async createCourse(
    @Body() dto: CreateCourseDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.coursesService.createCourse(dto, file);
  }

  // Lấy danh sách courses
  @Get()
  async getCourses(@Query() query: CourseQueryDto) {
    return this.coursesService.getCourses(query);
  }

  @Get('all/list')
  async getAllCourses(@Query() query: CourseQueryDto) {
    return this.coursesService.getAll(query);
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
  @UseInterceptors(FileInterceptor('thumbnail'))
  async updateCourse(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCourseDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.coursesService.updateCourse(id, dto, file);
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