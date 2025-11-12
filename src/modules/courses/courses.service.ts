import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseResponseDto } from './dto/course-response.dto';
import { CourseQueryDto } from './dto/course-query.dto';
import { Prisma, CourseLevel } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  // Tạo course mới
  async createCourse(dto: CreateCourseDto) {
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

    const course = await this.prisma.course.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        thumbnail: dto.thumbnail,
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

  // Lấy danh sách courses
  async getCourses(query: CourseQueryDto) {
    const { page = 1, limit = 10, search, level, isPublished, instructorId, categoryId, tagId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CourseWhereInput = {
      AND: [
        search ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
            { description: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
            { slug: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
          ],
        } : {},
        level ? { level } : {},
        isPublished !== undefined ? { isPublished } : {},
        instructorId ? { instructorId } : {},
        categoryId ? { categories: { some: { categoryId } } } : {},
        tagId ? { tags: { some: { tagId } } } : {},
      ],
    };

    const [courses, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
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
  async updateCourse(id: number, dto: UpdateCourseDto) {
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

    // Update course với transaction
    const updatedCourse = await this.prisma.$transaction(async (tx) => {
      // Update basic info
      const courseData: any = {
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        thumbnail: dto.thumbnail,
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
        await tx.courseCategory.createMany({
          data: dto.categoryIds.map(categoryId => ({ courseId: id, categoryId }))
        });
      }

      if (dto.tagIds) {
        await tx.courseTag.deleteMany({ where: { courseId: id } });
        await tx.courseTag.createMany({
          data: dto.tagIds.map(tagId => ({ courseId: id, tagId }))
        });
      }

      if (dto.prerequisiteIds) {
        await tx.coursePrerequisite.deleteMany({ where: { courseId: id } });
        if (dto.prerequisiteIds.length > 0) {
            // FIX: Sửa thành prerequisiteCourseId
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
      // FIX: Sử dụng Prisma.validator và đúng type
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
}