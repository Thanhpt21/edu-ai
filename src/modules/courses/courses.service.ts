import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseResponseDto } from './dto/course-response.dto';
import { CourseQueryDto } from './dto/course-query.dto';
import { Prisma, CourseLevel } from '@prisma/client';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';

@Injectable()
export class CoursesService {
  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private readonly request: Request | any,
    private readonly uploadService: UploadService,
  ) {}

  // Tạo course mới
  async createCourse(dto: CreateCourseDto, file?: Express.Multer.File) {
  // Check unique slug
  const existingSlug = await this.prisma.course.findUnique({ 
    where: { slug: dto.slug } 
  });
  if (existingSlug) throw new BadRequestException('Slug đã tồn tại');

  // Verify instructor exists
  const instructor = await this.prisma.user.findUnique({
    where: { id: dto.instructorId }
  });
  if (!instructor) throw new BadRequestException('Instructor không tồn tại');

  // Verify categories, tags, prerequisites exist
  await this.verifyRelations(dto.categoryIds, dto.tagIds, dto.prerequisiteIds);

  // FIX: Xử lý cả file upload và thumbnail URL từ JSON
  let thumbnailUrl: string | null = null;
  
  // Ưu tiên file upload nếu có
  if (file) {
    thumbnailUrl = await this.uploadService.uploadLocalImage(file);
  } 
  // Nếu không có file upload nhưng có thumbnail URL từ JSON
  else if (dto.thumbnail) {
    thumbnailUrl = dto.thumbnail;
  }

  const course = await this.prisma.course.create({
    data: {
      title: dto.title,
      slug: dto.slug,
      description: dto.description,
      thumbnail: thumbnailUrl, // Sử dụng URL từ upload service hoặc JSON
      level: dto.level || CourseLevel.BEGINNER,
      price: dto.price || 0,
      isPublished: dto.isPublished || false,
      instructorId: dto.instructorId,
      categories: dto.categoryIds ? {
        create: dto.categoryIds.map(categoryId => ({ categoryId }))
      } : undefined,
      tags: dto.tagIds ? {
        create: dto.tagIds.map(tagId => ({ tagId }))
      } : undefined,
      prerequisites: dto.prerequisiteIds ? {
        create: dto.prerequisiteIds.map(prerequisiteCourseId => ({ 
          prerequisiteCourseId 
        }))
      } : undefined,
    },
    include: this.getCourseInclude(),
  });

  return {
    success: true,
    message: 'Tạo course thành công',
    data: this.formatCourseResponse(course),
  };
}

// Lấy danh sách courses (có phân trang)
async getCourses(query: CourseQueryDto) {
  const { page = 1, limit = 10, ...filters } = query;
  const skip = (page - 1) * limit;

  const where = this.buildWhereClause(filters);

  const [courses, total] = await this.prisma.$transaction([
    this.prisma.course.findMany({
      where,
      skip,
      take: Number(limit),
      include: this.getCourseInclude(),
      orderBy: { createdAt: 'desc' },
    }),
    this.prisma.course.count({ where }),
  ]);

  return {
    success: true,
    message: 'Lấy danh sách courses thành công',
    data: {
      data: courses.map(course => this.formatCourseResponse(course)),
      total,
      page,
      pageCount: Math.ceil(total / limit),
    },
  };
}

// Lấy tất cả courses (không phân trang)
async getAll(query: CourseQueryDto) {
  try {
    console.log('GET ALL COURSES QUERY:', query);
    
    const where = this.buildWhereClause(query);
    console.log('WHERE CLAUSE:', JSON.stringify(where, null, 2));

    const courses = await this.prisma.course.findMany({
      where,
      include: this.getCourseInclude(),
      orderBy: { createdAt: 'desc' },
    });

    console.log('FOUND COURSES:', courses.length);

    return {
      success: true,
      message: 'Lấy tất cả courses thành công',
      data: courses.map(course => this.formatCourseResponse(course)),
    };
  } catch (error) {
    console.error('ERROR IN GET ALL COURSES:', error);
    throw error;
  }
}

// Helper method để xây dựng where clause
private buildWhereClause(filters: any): Prisma.CourseWhereInput {
  try {
    const { search, level, isPublished, instructorId, categoryId, tagId } = filters;
    
    console.log('FILTERS RECEIVED:', filters);

    let levelEnum: CourseLevel | undefined;
    if (level) {
      levelEnum = this.convertToCourseLevel(level);
      console.log('CONVERTED LEVEL:', level, '->', levelEnum);
    }

    const conditions = [
      search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ],
      },
      levelEnum && { level: levelEnum },
      isPublished !== undefined && { isPublished: isPublished === 'true' ? true : isPublished === 'false' ? false : isPublished },
      instructorId && { instructorId: Number(instructorId) },
      categoryId && { categories: { some: { categoryId: Number(categoryId) } } },
      tagId && { tags: { some: { tagId: Number(tagId) } } },
    ].filter(Boolean);

    console.log('FILTER CONDITIONS:', conditions);

    return conditions.length > 0 ? { AND: conditions as Prisma.CourseWhereInput[] } : {};
  } catch (error) {
    console.error('ERROR IN BUILD WHERE CLAUSE:', error);
    throw error;
  }
}
  

  // Lấy course theo id
  async getCourseById(id: number) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: this.getCourseInclude(),
    });
    
    if (!course) throw new NotFoundException('Course không tồn tại');

    return {
      success: true,
      message: 'Lấy course thành công',
      data: this.formatCourseResponse(course),
    };
  }

  // Lấy course theo slug
  async getCourseBySlug(slug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: this.getCourseInclude(),
    });
    
    if (!course) throw new NotFoundException('Course không tồn tại');

    // Tăng view count
    await this.prisma.course.update({
      where: { id: course.id },
      data: { totalViews: { increment: 1 } }
    });

    return {
      success: true,
      message: 'Lấy course thành công',
      data: this.formatCourseResponse(course),
    };
  }

  // Cập nhật course
  async updateCourse(id: number, dto: UpdateCourseDto, file?: Express.Multer.File) {
  const course = await this.prisma.course.findUnique({ where: { id } });
  if (!course) throw new NotFoundException('Course không tồn tại');

  // Check unique slug
  if (dto.slug && dto.slug !== course.slug) {
    const existingSlug = await this.prisma.course.findUnique({
      where: { slug: dto.slug },
    });
    if (existingSlug) throw new BadRequestException('Slug đã tồn tại');
  }

  // Verify relations
  await this.verifyRelations(dto.categoryIds, dto.tagIds, dto.prerequisiteIds);

  // FIX: Xử lý cả file upload và thumbnail URL từ JSON
  let thumbnailUrl = course.thumbnail;
  
  // Ưu tiên file upload nếu có
  if (file) {
    // Xóa ảnh cũ nếu tồn tại
    if (course.thumbnail) {
      await this.uploadService.deleteLocalImage(course.thumbnail);
    }
    // Upload ảnh mới
    thumbnailUrl = await this.uploadService.uploadLocalImage(file);
  } 
  // Nếu không có file upload nhưng có thumbnail URL từ JSON
  else if (dto.thumbnail !== undefined) {
    // Nếu có thumbnail mới từ JSON
    if (dto.thumbnail && dto.thumbnail !== course.thumbnail) {
      // Xóa ảnh cũ nếu tồn tại
      if (course.thumbnail) {
        await this.uploadService.deleteLocalImage(course.thumbnail);
      }
      thumbnailUrl = dto.thumbnail;
    }
    // Nếu thumbnail là null/empty (xóa ảnh)
    else if (dto.thumbnail === null || dto.thumbnail === '') {
      if (course.thumbnail) {
        await this.uploadService.deleteLocalImage(course.thumbnail);
      }
      thumbnailUrl = null;
    }
  }

  // Update course với transaction
  const updatedCourse = await this.prisma.$transaction(async (tx) => {
    // Update basic info
    const courseData: any = {
      title: dto.title,
      slug: dto.slug,
      description: dto.description,
      thumbnail: thumbnailUrl, // Sử dụng URL từ upload service hoặc JSON
      level: dto.level,
      price: dto.price,
      isPublished: dto.isPublished,
      instructorId: dto.instructorId,
    };

    // Remove undefined fields
    Object.keys(courseData).forEach(key => {
      if (courseData[key] === undefined) {
        delete courseData[key];
      }
    });

    const updated = await tx.course.update({
      where: { id },
      data: courseData,
      include: this.getCourseInclude(),
    });

    // Update relations if provided
    if (dto.categoryIds) {
      await tx.courseCategory.deleteMany({ where: { courseId: id } });
      if (dto.categoryIds.length > 0) {
        await tx.courseCategory.createMany({
          data: dto.categoryIds.map(categoryId => ({ courseId: id, categoryId }))
        });
      }
    }

    if (dto.tagIds) {
      await tx.courseTag.deleteMany({ where: { courseId: id } });
      if (dto.tagIds.length > 0) {
        await tx.courseTag.createMany({
          data: dto.tagIds.map(tagId => ({ courseId: id, tagId }))
        });
      }
    }

    if (dto.prerequisiteIds) {
      await tx.coursePrerequisite.deleteMany({ where: { courseId: id } });
      if (dto.prerequisiteIds.length > 0) {
        await tx.coursePrerequisite.createMany({
          data: dto.prerequisiteIds.map(prerequisiteCourseId => ({ 
            courseId: id, 
            prerequisiteCourseId 
          }))
        });
      }
    }

    return updated;
  });

  return {
    success: true,
    message: 'Cập nhật course thành công',
    data: this.formatCourseResponse(updatedCourse),
  };
}

  // Xóa course
  async deleteCourse(id: number) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Course không tồn tại');

    // Xóa thumbnail nếu tồn tại
    if (course.thumbnail) {
      await this.uploadService.deleteLocalImage(course.thumbnail);
    }

    await this.prisma.course.delete({ where: { id } });

    return {
      success: true,
      message: 'Xóa course thành công',
      data: null,
    };
  }

  // Toggle publish status
  async togglePublish(id: number) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Course không tồn tại');

    const updated = await this.prisma.course.update({
      where: { id },
      data: { isPublished: !course.isPublished },
      include: this.getCourseInclude(),
    });

    return {
      success: true,
      message: `Course đã được ${updated.isPublished ? 'publish' : 'unpublish'}`,
      data: this.formatCourseResponse(updated),
    };
  }

  // Helper methods
  private getCourseInclude(): Prisma.CourseInclude {
    return {
      instructor: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        }
      },
      categories: {
        include: {
          category: true
        }
      },
      tags: {
        include: {
          tag: true
        }
      },
      prerequisites: {
        include: {
          prerequisite: {
            select: {
              id: true,
              title: true,
              slug: true,
            }
          }
        }
      },
      requiredBy: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
            }
          }
        }
      },
      lessons: {
        select: {
          id: true,
          title: true,
          order: true,
        },
        orderBy: {
          order: 'asc'
        } as Prisma.LessonOrderByWithRelationInput
      },
      _count: {
        select: {
          lessons: true,
          enrollments: true,
          reviews: true,
        }
      }
    };
  }

  private formatCourseResponse(course: any) {
    return {
      ...new CourseResponseDto(course),
      instructor: course.instructor,
      categories: course.categories.map(cc => cc.category),
      tags: course.tags.map(ct => ct.tag),
      prerequisites: course.prerequisites.map(cp => cp.prerequisite),
      requiredBy: course.requiredBy.map(cp => cp.course),
      lessons: course.lessons,
      stats: {
        lessonCount: course._count.lessons,
        enrollmentCount: course._count.enrollments,
        reviewCount: course._count.reviews,
      }
    };
  }

  private async verifyRelations(categoryIds?: number[], tagIds?: number[], prerequisiteIds?: number[]) {
    if (categoryIds && categoryIds.length > 0) {
      const categories = await this.prisma.category.findMany({
        where: { id: { in: categoryIds } }
      });
      if (categories.length !== categoryIds.length) {
        throw new BadRequestException('Một số categories không tồn tại');
      }
    }

    if (tagIds && tagIds.length > 0) {
      const tags = await this.prisma.tag.findMany({
        where: { id: { in: tagIds } }
      });
      if (tags.length !== tagIds.length) {
        throw new BadRequestException('Một số tags không tồn tại');
      }
    }

    if (prerequisiteIds && prerequisiteIds.length > 0) {
      const prerequisites = await this.prisma.course.findMany({
        where: { id: { in: prerequisiteIds } }
      });
      if (prerequisites.length !== prerequisiteIds.length) {
        throw new BadRequestException('Một số prerequisites không tồn tại');
      }
    }
  }

  private convertToCourseLevel(level: string): CourseLevel {
  const levelMap: { [key: string]: CourseLevel } = {
    'beginner': CourseLevel.BEGINNER,
    'intermediate': CourseLevel.INTERMEDIATE,
    'advanced': CourseLevel.ADVANCED,
    'BEGINNER': CourseLevel.BEGINNER,
    'INTERMEDIATE': CourseLevel.INTERMEDIATE,
    'ADVANCED': CourseLevel.ADVANCED,
  };

  const courseLevel = levelMap[level.toLowerCase()];
  if (!courseLevel) {
    throw new BadRequestException(`Level '${level}' không hợp lệ. Các giá trị hợp lệ: beginner, intermediate, advanced`);
  }

  return courseLevel;
}
}