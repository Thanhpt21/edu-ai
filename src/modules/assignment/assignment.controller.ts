// src/assignment/assignment.controller.ts
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
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AssignmentService } from './assignment.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { AssignmentQueryDto } from './dto/assignment-query.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AssignmentStatus } from '@prisma/client';

@Controller('assignments')
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  // =========== ASSIGNMENT CRUD ===========

  // Tạo assignment mới (với file upload)
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @UsePipes(new ValidationPipe({ transform: true })) 
  async createAssignment(
    @Body() dto: CreateAssignmentDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50MB
          new FileTypeValidator({ 
            fileType: /^(application\/pdf|application\/msword|application\/vnd.openxmlformats-officedocument.wordprocessingml.document|application\/vnd.ms-excel|application\/vnd.openxmlformats-officedocument.spreadsheetml.sheet|application\/vnd.ms-powerpoint|application\/vnd.openxmlformats-officedocument.presentationml.presentation|text\/plain|image\/jpeg|image\/png|image\/gif|application\/zip|application\/x-rar-compressed|application\/x-7z-compressed)$/ 
          }),
        ],
        fileIsRequired: false,
      })
    ) file?: Express.Multer.File,
  ) {
    
    return this.assignmentService.createAssignment(dto, file);
  }

  // Lấy danh sách assignments
@Get()
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true }))
async getAssignments(
  @Query() query: AssignmentQueryDto, 
) {
  return this.assignmentService.getAssignments(query);
}
  // Lấy assignment theo ID
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getAssignmentById(@Param('id', ParseIntPipe) id: number) {
    return this.assignmentService.getAssignmentById(id);
  }

  // Lấy assignments của course
  @Get('course/:courseId')
  @UseGuards(JwtAuthGuard)
  async getCourseAssignments(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.assignmentService.getCourseAssignments(courseId);
  }

  // Lấy assignments của lesson
  @Get('lesson/:lessonId')
  @UseGuards(JwtAuthGuard)
  async getLessonAssignments(@Param('lessonId', ParseIntPipe) lessonId: number) {
    return this.assignmentService.getLessonAssignments(lessonId);
  }

  // Cập nhật assignment (với file upload)
  @Put(':id')
@UseInterceptors(FileInterceptor('file'))
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateAssignment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAssignmentDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50MB
          new FileTypeValidator({ 
            fileType: /^(application\/pdf|application\/msword|application\/vnd.openxmlformats-officedocument.wordprocessingml.document|application\/vnd.ms-excel|application\/vnd.openxmlformats-officedocument.spreadsheetml.sheet|application\/vnd.ms-powerpoint|application\/vnd.openxmlformats-officedocument.presentationml.presentation|text\/plain|image\/jpeg|image\/png|image\/gif|application\/zip|application\/x-rar-compressed|application\/x-7z-compressed)$/ 
          }),
        ],
        fileIsRequired: false,
      })
    ) file?: Express.Multer.File,
  ) {
    
    return this.assignmentService.updateAssignment(id, dto, file);
  }

  // Thay đổi status assignment
  @Put(':id/status')
  @UseGuards(JwtAuthGuard)
  async changeAssignmentStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: AssignmentStatus,
  ) {
    return this.assignmentService.changeAssignmentStatus(id, status);
  }

  // Thay đổi status assignment bằng PUT (alternative)
  @Put(':id/status')
  @UseGuards(JwtAuthGuard)
  async changeAssignmentStatusPut(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: AssignmentStatus,
  ) {
    return this.assignmentService.changeAssignmentStatus(id, status);
  }

  // Xóa assignment
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteAssignment(@Param('id', ParseIntPipe) id: number) {
    return this.assignmentService.deleteAssignment(id);
  }

 @Delete(':id/file')
  @UseGuards(JwtAuthGuard)
  async deleteAssignmentFiles(@Param('id', ParseIntPipe) id: number) {
    
    return this.assignmentService.deleteAssignmentFile(id);
  }

  // =========== ADDITIONAL ENDPOINTS ===========

  // Lấy assignments của user (đã nộp)
  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  async getUserAssignments(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('courseId') courseId?: string
  ) {
    
    // You can implement this if needed
    // return this.assignmentService.getUserAssignments(userId, courseId ? parseInt(courseId) : undefined);
    
    // Temporary implementation
    return {
      success: true,
      message: 'Endpoint not implemented yet',
      data: []
    };
  }

  // Tìm assignments theo nhiều tiêu chí
  @Get('search/advanced')
  @UseGuards(JwtAuthGuard)
  async searchAssignments(
    @Query('keyword') keyword?: string,
    @Query('courseId') courseId?: string,
    @Query('lessonId') lessonId?: string,
    @Query('status') status?: AssignmentStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    
    const query: AssignmentQueryDto = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      search: keyword || '',
      courseId: courseId ? parseInt(courseId) : undefined,
      lessonId: lessonId ? parseInt(lessonId) : undefined,
      status: status
    };
    
    return this.assignmentService.getAssignments(query);
  }

  // =========== STATS ENDPOINTS ===========

  // Lấy thống kê assignments
  @Get('stats/summary')
  @UseGuards(JwtAuthGuard)
  async getAssignmentStats(
    @Query('courseId') courseId?: string,
    @Query('instructorId') instructorId?: string
  ) {
    
    // You can implement stats endpoint
    return {
      success: true,
      message: 'Stats endpoint not implemented yet',
      data: {
        totalAssignments: 0,
        publishedAssignments: 0,
        draftAssignments: 0,
        closedAssignments: 0,
        totalSubmissions: 0,
        averageScore: 0
      }
    };
  }

  // =========== FILE MANAGEMENT ===========

  // Xóa file của assignment (chỉ xóa file, không xóa assignment)
  @Delete(':id/file')
  @UseGuards(JwtAuthGuard)
  async deleteAssignmentFile(@Param('id', ParseIntPipe) id: number) {
    // You can implement this endpoint to only delete the file
    // return this.assignmentService.deleteAssignmentFile(id);
    
    return {
      success: true,
      message: 'Delete file endpoint not implemented yet',
      data: null
    };
  }
}