import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { LessonResponseDto } from './dto/lesson-response.dto';
import { LessonQueryDto } from './dto/lesson-query.dto';
import { Prisma } from '@prisma/client';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class LessonsService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService
  ) {}

  // Tạo lesson mới
  async createLesson(dto: CreateLessonDto, videoFile?: Express.Multer.File) {
    // Parse dto values từ string sang number (vì FormData gửi string)
    const parsedDto = {
      ...dto,
      courseId: Number(dto.courseId),
      order: dto.order ? Number(dto.order) : undefined,
      durationMin: dto.durationMin ? Number(dto.durationMin) : undefined,
    };

    // Verify course exists
    const course = await this.prisma.course.findUnique({
      where: { id: parsedDto.courseId }  // Sử dụng parsedDto.courseId
    });
    if (!course) throw new BadRequestException('Course không tồn tại');

    // Xử lý upload video nếu có file
    let finalVideoUrl = parsedDto.videoUrl;
    let durationMin: number | undefined = parsedDto.durationMin;

    if (videoFile) {
      try {
        // Upload video lên Supabase
        const uploadResult = await this.uploadService.uploadLessonVideo(
          videoFile,
          0, // lessonId tạm = 0
          parsedDto.courseId  // Sử dụng parsedDto.courseId
        );

        finalVideoUrl = uploadResult.url;

        // Nếu có duration từ video, ưu tiên dùng nó
        if (uploadResult.duration && !durationMin) {
          durationMin = Math.ceil(uploadResult.duration / 60);
        }

        console.log(`✅ Video uploaded to Supabase: ${finalVideoUrl}`);
      } catch (uploadError: any) {
        throw new BadRequestException(`Upload video thất bại: ${uploadError.message}`);
      }
    }

    // Get max order for this course
    const maxOrder = await this.prisma.lesson.aggregate({
      where: { courseId: parsedDto.courseId },
      _max: { order: true },
    });

    // Tạo lesson
    const lesson = await this.prisma.lesson.create({
      data: {
        title: parsedDto.title,
        content: parsedDto.content,
        videoUrl: finalVideoUrl,
        order: parsedDto.order || (maxOrder._max.order || 0) + 1,
        courseId: parsedDto.courseId,
        durationMin: durationMin,
      },
      include: this.getLessonInclude(),
    });

    return {
      success: true,
      message: 'Tạo lesson thành công',
      data: this.formatLessonResponse(lesson),
    };
  }
  // Lấy danh sách lessons
  async getLessons(query: LessonQueryDto) {
    const { page = 1, limit = 10, search, courseId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.LessonWhereInput = {
      AND: [
        search ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
            { content: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
          ],
        } : {},
        courseId ? { courseId } : {},
      ],
    };

    const [lessons, total] = await this.prisma.$transaction([
      this.prisma.lesson.findMany({
        where,
        skip,
        take: Number(limit),
        include: this.getLessonInclude(),
        orderBy: [{ courseId: 'asc' }, { order: 'asc' }],
      }),
      this.prisma.lesson.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách lessons thành công',
      data: {
        data: lessons.map(lesson => this.formatLessonResponse(lesson)),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }


  // Lấy lessons theo courseId
  async getLessonsByCourseId(courseId: number) {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId }
      });
      if (!course) throw new NotFoundException('Course không tồn tại');

      const lessons = await this.prisma.lesson.findMany({
        where: { courseId },
        include: this.getLessonInclude(),
        orderBy: { order: 'asc' },
      });

      return {
        success: true,
        message: 'Lấy danh sách lessons của course thành công',
        data: lessons.map(lesson => this.formatLessonResponse(lesson)),
      };
    }

  // Lấy lesson theo id
  async getLessonById(id: number) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: this.getLessonInclude(),
    });
    
    if (!lesson) throw new NotFoundException('Lesson không tồn tại');

    // Tăng view count
    await this.prisma.lesson.update({
      where: { id },
      data: { totalViews: { increment: 1 } }
    });

    return {
      success: true,
      message: 'Lấy lesson thành công',
      data: this.formatLessonResponse(lesson),
    };
  }

  async getLessonByIdForAdmin(id: number) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: this.getLessonInclude(),
    });
    
    if (!lesson) throw new NotFoundException('Lesson không tồn tại');

    // KHÔNG tăng view count cho admin

    return {
      success: true,
      message: 'Lấy lesson thành công',
      data: this.formatLessonResponse(lesson),
    };
  }

    // Cập nhật lesson
  async updateLesson(id: number, dto: UpdateLessonDto, videoFile?: Express.Multer.File) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException('Lesson không tồn tại');

    // Parse dto values từ string sang number (vì FormData gửi string)
    const parsedDto = {
      ...dto,
      courseId: dto.courseId ? Number(dto.courseId) : undefined,
      order: dto.order ? Number(dto.order) : undefined,
      durationMin: dto.durationMin ? Number(dto.durationMin) : undefined,
    };

    // Verify course exists if changing course
    if (parsedDto.courseId && parsedDto.courseId !== lesson.courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: parsedDto.courseId }  // Sử dụng parsedDto.courseId (đã là number)
      });
      if (!course) throw new BadRequestException('Course không tồn tại');
    }

    // Xử lý upload video mới nếu có
    let finalVideoUrl = parsedDto.videoUrl ?? lesson.videoUrl;
    let finalDurationMin = parsedDto.durationMin ?? lesson.durationMin;

    if (videoFile) {
      try {
        // Xóa video cũ nếu có (video từ Supabase)
        if (lesson.videoUrl && this.isSupabaseUrl(lesson.videoUrl)) {
          await this.uploadService.deleteVideo(lesson.videoUrl);
          console.log(`🗑️ Đã xóa video cũ: ${lesson.videoUrl}`);
        }

        // Upload video mới
        const uploadResult = await this.uploadService.uploadLessonVideo(
          videoFile,
          id,
          parsedDto.courseId || lesson.courseId
        );

        finalVideoUrl = uploadResult.url;

        // Cập nhật duration nếu có
        if (uploadResult.duration && !finalDurationMin) {
          finalDurationMin = Math.ceil(uploadResult.duration / 60);
        }

        console.log(`✅ Video mới uploaded: ${finalVideoUrl}`);
      } catch (uploadError: any) {
        throw new BadRequestException(`Upload video thất bại: ${uploadError.message}`);
      }
    }

    const updateData: any = {
      ...parsedDto,
      videoUrl: finalVideoUrl,
      durationMin: finalDurationMin,
    };

    const updated = await this.prisma.lesson.update({
      where: { id },
      data: updateData,
      include: this.getLessonInclude(),
    });

    return {
      success: true,
      message: 'Cập nhật bài học thành công',
      data: this.formatLessonResponse(updated),
    };
  }

  // Thêm helper method để kiểm tra URL có phải từ Supabase không
  private isSupabaseUrl(url: string): boolean {
    if (!url) return false;
    return url.includes('supabase.co') || url.includes('supabase.in');
  }


  // Xóa lesson
 async deleteLesson(id: number) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException('Lesson không tồn tại');

    // Xóa video từ Supabase nếu là video uploaded
    if (lesson.videoUrl && lesson.videoUrl.includes('supabase.co')) {
      try {
        await this.uploadService.deleteVideo(lesson.videoUrl);
        console.log(`🗑️ Đã xóa video từ Supabase: ${lesson.videoUrl}`);
      } catch (deleteError) {
        console.warn(`⚠️ Không thể xóa video từ Supabase: ${deleteError.message}`);
      }
    }

    await this.prisma.lesson.delete({ where: { id } });

    return {
      success: true,
      message: 'Xóa lesson thành công',
      data: null,
    };
  }

  // Sắp xếp lại lessons order
  async reorderLessons(courseId: number, lessonOrders: Array<{ id: number; order: number }>) {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId }
      });
      if (!course) throw new NotFoundException('Course không tồn tại');

      // Verify all lessons belong to this course
      const lessonIds = lessonOrders.map(lo => lo.id);
      const lessons = await this.prisma.lesson.findMany({
        where: { id: { in: lessonIds } }
      });

      const invalidLessons = lessons.filter(lesson => lesson.courseId !== courseId);
      if (invalidLessons.length > 0) {
        throw new BadRequestException('Một số lessons không thuộc về course này');
      }

      // Update orders in transaction
      await this.prisma.$transaction(
        lessonOrders.map(lessonOrder =>
          this.prisma.lesson.update({
            where: { id: lessonOrder.id },
            data: { order: lessonOrder.order },
          })
        )
      );

      const updatedLessons = await this.prisma.lesson.findMany({
        where: { courseId },
        include: this.getLessonInclude(),
        orderBy: { order: 'asc' },
      });

      return {
        success: true,
        message: 'Sắp xếp lessons thành công',
        data: updatedLessons.map(lesson => this.formatLessonResponse(lesson)),
      };
    }
  // Helper methods
  private getLessonInclude() {
    return {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          instructor: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      },
      heygenVideos: {
        select: {
          id: true,
          videoId: true,
          title: true,
          status: true,
          videoUrl: true,
          thumbnailUrl: true,
          duration: true,
        }
      },
      _count: {
        select: {
          progress: true,
          heygenVideos: true,
        }
      }
    };
  }

  private formatLessonResponse(lesson: any) {
    return {
      ...new LessonResponseDto(lesson),
      course: lesson.course,
      heygenVideos: lesson.heygenVideos,
      stats: {
        progressCount: lesson._count.progress,
        heygenVideoCount: lesson._count.heygenVideos,
      }
    };
  }
}