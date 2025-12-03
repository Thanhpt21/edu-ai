// src/assignment/assignment.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { AssignmentResponseDto } from './dto/assignment-response.dto';
import { AssignmentQueryDto } from './dto/assignment-query.dto';
import { Prisma, AssignmentStatus } from '@prisma/client';

@Injectable()
export class AssignmentService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService
  ) {}

  // =========== ASSIGNMENT CRUD ===========

  // Tạo assignment mới
 async createAssignment(dto: CreateAssignmentDto, file?: Express.Multer.File) {
    console.log(`📥 [createAssignment] DTO received:`, dto);
    console.log(`📥 [createAssignment] DTO types:`, {
      courseId: typeof dto.courseId,
      lessonId: typeof dto.lessonId,
      maxScore: typeof dto.maxScore
    });

    // Verify course exists if provided (đã là number sau transform)
    if (dto.courseId) {
      console.log(`🔍 [createAssignment] Checking course: ${dto.courseId} (type: ${typeof dto.courseId})`);
      const course = await this.prisma.course.findUnique({
        where: { id: dto.courseId }
      });
      if (!course) {
        console.error(`❌ [createAssignment] Course not found: ${dto.courseId}`);
        throw new BadRequestException('Course không tồn tại');
      }
      console.log(`✅ [createAssignment] Course found: ${course.title}`);
    }

    // Verify lesson exists if provided (đã là number sau transform)
    if (dto.lessonId) {
      console.log(`🔍 [createAssignment] Checking lesson: ${dto.lessonId} (type: ${typeof dto.lessonId})`);
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: dto.lessonId }
      });
      if (!lesson) {
        console.error(`❌ [createAssignment] Lesson not found: ${dto.lessonId}`);
        throw new BadRequestException('Lesson không tồn tại');
      }
      console.log(`✅ [createAssignment] Lesson found: ${lesson.title}`);
    }

    // Upload file nếu có - SỬ DỤNG FILE BUCKET
    let fileUrl: string | null = dto.fileUrl || null;
    if (file) {
      try {
        console.log(`📤 [createAssignment] Uploading file: ${file.originalname}`);
        const uploadResult = await this.uploadService.uploadAssignmentFile(
          file,
          dto.courseId || undefined,
          undefined // assignmentId chưa có khi tạo mới
        );

        if (!uploadResult.success) {
          console.error(`❌ [createAssignment] Upload failed:`, uploadResult.error);
          throw new BadRequestException(uploadResult.error || 'Upload file thất bại');
        }

        fileUrl = uploadResult.url || null;
        console.log(`✅ [createAssignment] File uploaded: ${fileUrl}`);
      } catch (error: any) {
        console.error(`❌ [createAssignment] Upload error:`, error.message);
        throw new BadRequestException(`Upload file thất bại: ${error.message}`);
      }
    }

    // Parse dueDate từ string sang Date
    let dueDateValue: Date | null = null;
    if (dto.dueDate) {
      try {
        const parsedDate = new Date(dto.dueDate);
        if (!isNaN(parsedDate.getTime())) {
          dueDateValue = parsedDate;
          console.log(`✅ [createAssignment] DueDate parsed: ${dueDateValue}`);
        } else {
          console.warn(`⚠️ [createAssignment] Invalid dueDate format: ${dto.dueDate}`);
        }
      } catch (error) {
        console.warn(`⚠️ [createAssignment] Error parsing dueDate:`, error.message);
      }
    }

    // Prepare data for Prisma
    const assignmentData: any = {
      title: dto.title,
      description: dto.description || null,
      fileUrl: fileUrl,
      dueDate: dueDateValue,
      maxScore: dto.maxScore || 100,
      courseId: dto.courseId || null,
      lessonId: dto.lessonId || null,
      status: dto.status || AssignmentStatus.DRAFT,
    };

    console.log(`📝 [createAssignment] Creating assignment with data:`, {
      title: assignmentData.title,
      courseId: assignmentData.courseId,
      lessonId: assignmentData.lessonId,
      maxScore: assignmentData.maxScore,
      status: assignmentData.status
    });

    // Create assignment
    try {
      const assignment = await this.prisma.assignment.create({
        data: assignmentData,
        include: this.getAssignmentInclude(),
      });

      console.log(`✅ [createAssignment] Assignment created: ${assignment.id}`);

      // Tính thống kê
      const stats = await this.getAssignmentStats(assignment.id);

      return {
        success: true,
        message: 'Tạo bài tập thành công',
        data: {
          ...this.formatAssignmentResponse(assignment),
          stats,
        },
      };
    } catch (error: any) {
      console.error(`❌ [createAssignment] Prisma create error:`, error.message);
      throw new BadRequestException(`Không thể tạo bài tập: ${error.message}`);
    }
  }

  // Lấy danh sách assignments
  async getAssignments(query: AssignmentQueryDto) {
    const { page = 1, limit = 10, courseId, lessonId, status, search = '' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AssignmentWhereInput = {
      AND: [
        courseId ? { courseId } : {},
        lessonId ? { lessonId } : {},
        status ? { status } : {},
        search ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
            { description: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
            { course: { title: { contains: search, mode: 'insensitive' as Prisma.QueryMode } } },
          ],
        } : {},
      ],
    };

    console.log(`🔍 [getAssignments] Query:`, { page, limit, courseId, lessonId, status, search });

    const [assignments, total] = await this.prisma.$transaction([
      this.prisma.assignment.findMany({
        where,
        skip,
        take: Number(limit),
        include: this.getAssignmentInclude(),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.assignment.count({ where }),
    ]);

    console.log(`✅ [getAssignments] Found ${assignments.length} assignments, total: ${total}`);

    // Tính thống kê cho từng assignment
    const assignmentsWithStats = await Promise.all(
      assignments.map(async (assignment) => {
        const stats = await this.getAssignmentStats(assignment.id);
        return {
          ...this.formatAssignmentResponse(assignment),
          stats,
        };
      })
    );

    return {
      success: true,
      message: 'Lấy danh sách assignments thành công',
      data: {
        data: assignmentsWithStats,
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  // Lấy assignment theo ID
  async getAssignmentById(id: number) {
    console.log(`🔍 [getAssignmentById] Getting assignment: ${id}`);
    
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: this.getAssignmentInclude(),
    });
    
    if (!assignment) {
      console.error(`❌ [getAssignmentById] Assignment not found: ${id}`);
      throw new NotFoundException('Assignment không tồn tại');
    }

    const stats = await this.getAssignmentStats(id);

    console.log(`✅ [getAssignmentById] Found assignment: ${assignment.title}`);

    return {
      success: true,
      message: 'Lấy assignment thành công',
      data: {
        ...this.formatAssignmentResponse(assignment),
        stats,
      },
    };
  }

  // Lấy assignments của course
  async getCourseAssignments(courseId: number) {
    console.log(`🔍 [getCourseAssignments] Getting assignments for course: ${courseId}`);
    
    const course = await this.prisma.course.findUnique({
      where: { id: courseId }
    });
    if (!course) {
      console.error(`❌ [getCourseAssignments] Course not found: ${courseId}`);
      throw new NotFoundException('Course không tồn tại');
    }

    const assignments = await this.prisma.assignment.findMany({
      where: { 
        courseId,
        status: AssignmentStatus.PUBLISHED // Chỉ lấy published assignments
      },
      include: this.getAssignmentInclude(),
      orderBy: { createdAt: 'desc' },
    });

    console.log(`✅ [getCourseAssignments] Found ${assignments.length} assignments for course ${courseId}`);

    const assignmentsWithStats = await Promise.all(
      assignments.map(async (assignment) => {
        const stats = await this.getAssignmentStats(assignment.id);
        return {
          ...this.formatAssignmentResponse(assignment),
          stats,
        };
      })
    );

    return {
      success: true,
      message: 'Lấy danh sách bài tập của course thành công',
      data: assignmentsWithStats,
    };
  }

  // Lấy assignments của lesson
  async getLessonAssignments(lessonId: number) {
    console.log(`🔍 [getLessonAssignments] Getting assignments for lesson: ${lessonId}`);
    
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId }
    });
    if (!lesson) {
      console.error(`❌ [getLessonAssignments] Lesson not found: ${lessonId}`);
      throw new NotFoundException('Lesson không tồn tại');
    }

    const assignments = await this.prisma.assignment.findMany({
      where: { 
        lessonId,
        status: AssignmentStatus.PUBLISHED
      },
      include: this.getAssignmentInclude(),
      orderBy: { createdAt: 'desc' },
    });

    console.log(`✅ [getLessonAssignments] Found ${assignments.length} assignments for lesson ${lessonId}`);

    const assignmentsWithStats = await Promise.all(
      assignments.map(async (assignment) => {
        const stats = await this.getAssignmentStats(assignment.id);
        return {
          ...this.formatAssignmentResponse(assignment),
          stats,
        };
      })
    );

    return {
      success: true,
      message: 'Lấy danh sách bài tập của lesson thành công',
      data: assignmentsWithStats,
    };
  }

  // Cập nhật assignment
  async updateAssignment(id: number, dto: UpdateAssignmentDto, file?: Express.Multer.File) {
    console.log(`🔍 [updateAssignment] Updating assignment: ${id}`, dto);
    
    const assignment = await this.prisma.assignment.findUnique({ where: { id } });
    if (!assignment) {
      console.error(`❌ [updateAssignment] Assignment not found: ${id}`);
      throw new NotFoundException('Assignment không tồn tại');
    }

    // Upload file mới nếu có - SỬ DỤNG FILE BUCKET
    let fileUrl: string | null = assignment.fileUrl;
    if (file) {
      try {
        // Xóa file cũ nếu có
        if (assignment.fileUrl) {
          console.log(`🗑️ [updateAssignment] Deleting old file: ${assignment.fileUrl}`);
          const deleteResult = await this.uploadService.deleteFile(assignment.fileUrl);
          if (!deleteResult.success) {
            console.warn(`⚠️ [updateAssignment] Failed to delete old file: ${deleteResult.error}`);
          }
        }

        console.log(`📤 [updateAssignment] Uploading new file...`);
        const uploadResult = await this.uploadService.uploadAssignmentFile(
          file,
          assignment.courseId || dto.courseId || undefined,
          assignment.id
        );

        if (!uploadResult.success) {
          throw new BadRequestException(uploadResult.error || 'Upload file thất bại');
        }

        fileUrl = uploadResult.url || null;
        console.log(`✅ [updateAssignment] New file uploaded: ${fileUrl}`);
      } catch (error: any) {
        console.error(`❌ [updateAssignment] Upload file error:`, error.message);
        throw new BadRequestException(`Upload file thất bại: ${error.message}`);
      }
    } else if (dto.fileUrl !== undefined) {
      // Nếu có dto.fileUrl (có thể là null để xóa file)
      fileUrl = dto.fileUrl || null;
    }

    // Parse dueDate từ string sang Date nếu có
    let dueDateValue: Date | null = assignment.dueDate;
    if (dto.dueDate !== undefined) {
      if (dto.dueDate === null || dto.dueDate === '') {
        dueDateValue = null;
      } else {
        try {
          const parsedDate = new Date(dto.dueDate);
          if (!isNaN(parsedDate.getTime())) {
            dueDateValue = parsedDate;
          } else {
            console.warn(`⚠️ [updateAssignment] Invalid dueDate format: ${dto.dueDate}`);
          }
        } catch (error) {
          console.warn(`⚠️ [updateAssignment] Error parsing dueDate: ${error.message}`);
        }
      }
    }

    // Build update data với type đúng
    const updateData: any = {};

    // Chỉ update các field có giá trị (không phải undefined)
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description || null;
    if (fileUrl !== undefined) updateData.fileUrl = fileUrl;
    if (dueDateValue !== undefined) updateData.dueDate = dueDateValue;
    if (dto.maxScore !== undefined) updateData.maxScore = dto.maxScore;
    if (dto.courseId !== undefined) updateData.courseId = dto.courseId || null;
    if (dto.lessonId !== undefined) updateData.lessonId = dto.lessonId || null;
    if (dto.status !== undefined) updateData.status = dto.status;

    console.log(`🔧 [updateAssignment] Update data:`, updateData);

    const updated = await this.prisma.assignment.update({
      where: { id },
      data: updateData,
      include: this.getAssignmentInclude(),
    });

    const stats = await this.getAssignmentStats(id);

    console.log(`✅ [updateAssignment] Assignment updated successfully`);

    return {
      success: true,
      message: 'Cập nhật bài tập thành công',
      data: {
        ...this.formatAssignmentResponse(updated),
        stats,
      },
    };
  }

  // Xóa assignment
  async deleteAssignment(id: number) {
    console.log(`🗑️ [deleteAssignment] Deleting assignment: ${id}`);
    
    const assignment = await this.prisma.assignment.findUnique({ where: { id } });
    if (!assignment) {
      console.error(`❌ [deleteAssignment] Assignment not found: ${id}`);
      throw new NotFoundException('Assignment không tồn tại');
    }

    // Xóa file nếu có
    if (assignment.fileUrl) {
      try {
        console.log(`🗑️ [deleteAssignment] Deleting file: ${assignment.fileUrl}`);
        const deleteResult = await this.uploadService.deleteFile(assignment.fileUrl);
        
        if (!deleteResult.success) {
          console.warn(`⚠️ [deleteAssignment] Failed to delete file: ${deleteResult.error}`);
        } else {
          console.log(`✅ [deleteAssignment] File deleted successfully`);
        }
      } catch (error: any) {
        console.warn(`⚠️ [deleteAssignment] Error deleting file: ${error.message}`);
      }
    }

    await this.prisma.assignment.delete({ where: { id } });

    console.log(`✅ [deleteAssignment] Assignment deleted successfully`);

    return {
      success: true,
      message: 'Xóa bài tập thành công',
      data: null,
    };
  }

  // Thay đổi status assignment
  async changeAssignmentStatus(id: number, status: AssignmentStatus) {
  const assignment = await this.prisma.assignment.findUnique({ 
    where: { id } 
  });
  
  if (!assignment) {
    throw new NotFoundException('Assignment không tồn tại');
  }

  // Validate status input
  const validStatuses = Object.values(AssignmentStatus);
  if (!validStatuses.includes(status)) {
    throw new BadRequestException(`Status không hợp lệ: ${status}. Status hợp lệ: ${validStatuses.join(', ')}`);
  }

  // Map status message
  const statusMessages: Record<AssignmentStatus, string> = {
    [AssignmentStatus.DRAFT]: 'chuyển về nháp',
    [AssignmentStatus.PUBLISHED]: 'công bố',
    [AssignmentStatus.CLOSED]: 'đóng',
  };

  const statusMessage = statusMessages[status] || 'cập nhật trạng thái';

  const updated = await this.prisma.assignment.update({
    where: { id },
    data: { status },
    include: this.getAssignmentInclude(),
  });

  const stats = await this.getAssignmentStats(id);

  return {
    success: true,
    message: `Đã ${statusMessage} bài tập`,
    data: {
      ...this.formatAssignmentResponse(updated),
      stats,
    },
  };
}

async deleteAssignmentFile(id: number) {
  const assignment = await this.prisma.assignment.findUnique({ 
    where: { id } 
  });
  
  if (!assignment) {
    throw new NotFoundException('Assignment không tồn tại');
  }

  if (!assignment.fileUrl) {
    return {
      success: true,
      message: 'Bài tập không có file để xóa',
      data: null,
    };
  }

  // Lưu lại file URL trước khi xóa
  const originalFileUrl = assignment.fileUrl;

  // Xóa file từ storage (không cần chờ kết quả)
  try {
    // Gọi async nhưng không cần await nếu không cần kết quả
    this.uploadService.deleteFile(originalFileUrl)
      .then(result => {
        // Log kết quả xóa file
        if (result.success) {
          console.log(`✅ File deleted from storage: ${originalFileUrl}`);
        } else {
          console.warn(`⚠️ File delete from storage failed: ${result.error}`);
        }
      })
      .catch(error => {
        console.warn(`⚠️ Error in file deletion: ${error.message}`);
      });
  } catch (error) {
    // Bỏ qua lỗi khi gọi deleteFile
    console.warn(`⚠️ Error calling deleteFile: ${error.message}`);
  }

  // Cập nhật assignment - xóa fileUrl từ database
  const updatedAssignment = await this.prisma.assignment.update({
    where: { id },
    data: {
      fileUrl: null,
    },
    include: this.getAssignmentInclude(),
  });

  // Tính lại stats
  const stats = await this.getAssignmentStats(id);

  return {
    success: true,
    message: 'Đã xóa file bài tập thành công',
    data: {
      ...this.formatAssignmentResponse(updatedAssignment),
      stats,
      fileUrlDeleted: originalFileUrl, // Thông báo file nào đã được xóa
    },
  };
}

  // =========== HELPER METHODS ===========

  // Lấy thống kê assignment
  private async getAssignmentStats(assignmentId: number) {
    try {
      const submissions = await this.prisma.assignmentSubmission.findMany({
        where: { assignmentId },
        select: {
          score: true,
        },
      });

      const totalSubmissions = submissions.length;
      const gradedSubmissions = submissions.filter(s => s.score !== null).length;
      
      let averageScore = 0;
      if (gradedSubmissions > 0) {
        const totalScore = submissions
          .filter(s => s.score !== null)
          .reduce((sum, s) => sum + (s.score || 0), 0);
        averageScore = Math.round((totalScore / gradedSubmissions) * 100) / 100; // Làm tròn 2 chữ số thập phân
      }

      return {
        totalSubmissions,
        gradedSubmissions,
        averageScore,
      };
    } catch (error) {
      console.error(`❌ [getAssignmentStats] Error getting stats:`, error);
      return {
        totalSubmissions: 0,
        gradedSubmissions: 0,
        averageScore: 0,
      };
    }
  }

  private getAssignmentInclude() {
    return {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          level: true,
          instructor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      lesson: {
        select: {
          id: true,
          title: true,
          order: true,
        },
      },
      _count: {
        select: {
          submissions: true,
        },
      },
    };
  }

  private formatAssignmentResponse(assignment: any) {
    return {
      ...new AssignmentResponseDto(assignment),
      course: assignment.course,
      lesson: assignment.lesson,
    };
  }
}