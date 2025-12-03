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
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { EnrollmentQueryDto } from './dto/enrollment-query.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  // Tạo enrollment mới
  @Post()
  @UseGuards(JwtAuthGuard)
  async createEnrollment(@Body() dto: CreateEnrollmentDto) {
    return this.enrollmentsService.createEnrollment(dto);
  }

  // Lấy danh sách enrollments
  @Get()
  @UseGuards(JwtAuthGuard)
  async getEnrollments(@Query() query: EnrollmentQueryDto) {
    return this.enrollmentsService.getEnrollments(query);
  }

  // Lấy enrollments của user
  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  async getUserEnrollments(@Param('userId', ParseIntPipe) userId: number) {
    return this.enrollmentsService.getUserEnrollments(userId);
  }

  // Lấy enrollments của course
  @Get('course/:courseId')
  @UseGuards(JwtAuthGuard)
  async getCourseEnrollments(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.enrollmentsService.getCourseEnrollments(courseId);
  }

  // Kiểm tra enrollment
  @Get('check/:userId/:courseId')
  @UseGuards(JwtAuthGuard)
  async checkEnrollment(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('courseId', ParseIntPipe) courseId: number
  ) {
    return this.enrollmentsService.checkEnrollment(userId, courseId);
  }

  // Lấy enrollment theo id
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getEnrollmentById(@Param('id', ParseIntPipe) id: number) {
    return this.enrollmentsService.getEnrollmentById(id);
  }

  // Cập nhật enrollment
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateEnrollment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEnrollmentDto
  ) {
    return this.enrollmentsService.updateEnrollment(id, dto);
  }

  // Cập nhật progress tự động
  @Put(':id/progress')
  @UseGuards(JwtAuthGuard)
  async updateProgress(@Param('id', ParseIntPipe) id: number) {
    return this.enrollmentsService.updateProgress(id);
  }

  // Xóa enrollment
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteEnrollment(@Param('id', ParseIntPipe) id: number) {
    return this.enrollmentsService.deleteEnrollment(id);
  }
}