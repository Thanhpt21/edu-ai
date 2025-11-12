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
import { CoursePrerequisitesService } from './course-prerequisites.service';
import { CreateCoursePrerequisiteDto } from './dto/create-course-prerequisite.dto';
import { UpdateCoursePrerequisiteDto } from './dto/update-course-prerequisite.dto';
import { CoursePrerequisiteQueryDto } from './dto/course-prerequisite-query.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('course-prerequisites')
export class CoursePrerequisitesController {
  constructor(private readonly coursePrerequisitesService: CoursePrerequisitesService) {}

  // Tạo prerequisite mới
  @Post()
  @UseGuards(JwtAuthGuard)
  async createCoursePrerequisite(@Body() dto: CreateCoursePrerequisiteDto) {
    return this.coursePrerequisitesService.createCoursePrerequisite(dto);
  }

  // Lấy danh sách prerequisites
  @Get()
  async getCoursePrerequisites(@Query() query: CoursePrerequisiteQueryDto) {
    return this.coursePrerequisitesService.getCoursePrerequisites(query);
  }

  // Lấy prerequisite theo id
  @Get(':id')
  async getCoursePrerequisiteById(@Param('id', ParseIntPipe) id: number) {
    return this.coursePrerequisitesService.getCoursePrerequisiteById(id);
  }

  // Lấy prerequisites của một course
  @Get('course/:courseId')
  async getPrerequisitesByCourseId(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.coursePrerequisitesService.getPrerequisitesByCourseId(courseId);
  }

  // Lấy courses mà require course này làm prerequisite
  @Get('prerequisite/:prerequisiteCourseId')
  async getRequiredByCourses(@Param('prerequisiteCourseId', ParseIntPipe) prerequisiteCourseId: number) {
    return this.coursePrerequisitesService.getRequiredByCourses(prerequisiteCourseId);
  }

  // Cập nhật prerequisite
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateCoursePrerequisite(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCoursePrerequisiteDto
  ) {
    return this.coursePrerequisitesService.updateCoursePrerequisite(id, dto);
  }

  // Xóa prerequisite theo id
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteCoursePrerequisite(@Param('id', ParseIntPipe) id: number) {
    return this.coursePrerequisitesService.deleteCoursePrerequisite(id);
  }

  // Xóa prerequisite bằng courseId và prerequisiteCourseId
  @Delete('course/:courseId/prerequisite/:prerequisiteCourseId')
  @UseGuards(JwtAuthGuard)
  async deleteCoursePrerequisiteByCourses(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('prerequisiteCourseId', ParseIntPipe) prerequisiteCourseId: number
  ) {
    return this.coursePrerequisitesService.deleteCoursePrerequisiteByCourses(courseId, prerequisiteCourseId);
  }
}