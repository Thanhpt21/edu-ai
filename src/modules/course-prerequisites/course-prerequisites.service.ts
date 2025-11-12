import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateCoursePrerequisiteDto } from './dto/create-course-prerequisite.dto';
import { UpdateCoursePrerequisiteDto } from './dto/update-course-prerequisite.dto';
import { CoursePrerequisiteResponseDto } from './dto/course-prerequisite-response.dto';
import { CoursePrerequisiteQueryDto } from './dto/course-prerequisite-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CoursePrerequisitesService {
  constructor(private prisma: PrismaService) {}

  // Tạo prerequisite mới
  async createCoursePrerequisite(dto: CreateCoursePrerequisiteDto) {
    // Check if courses exist
    await this.verifyCoursesExist(dto.courseId, dto.prerequisiteCourseId);

    // Check for circular dependency
    await this.checkCircularDependency(dto.courseId, dto.prerequisiteCourseId);

    // Check if prerequisite already exists
    const existing = await this.prisma.coursePrerequisite.findUnique({
      where: {
        courseId_prerequisiteCourseId: {
          courseId: dto.courseId,
          prerequisiteCourseId: dto.prerequisiteCourseId,
        },
      },
    });
    if (existing) throw new BadRequestException('Prerequisite đã tồn tại');

    // Check if trying to add self as prerequisite
    if (dto.courseId === dto.prerequisiteCourseId) {
      throw new BadRequestException('Không thể thêm khóa học làm prerequisite cho chính nó');
    }

    const prerequisite = await this.prisma.coursePrerequisite.create({
      data: dto,
      include: this.getPrerequisiteInclude(),
    });

    return {
      success: true,
      message: 'Tạo prerequisite thành công',
      data: this.formatPrerequisiteResponse(prerequisite),
    };
  }

  // Lấy danh sách prerequisites
  async getCoursePrerequisites(query: CoursePrerequisiteQueryDto) {
    const { page = 1, limit = 10, courseId, prerequisiteCourseId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CoursePrerequisiteWhereInput = {
      AND: [
        courseId ? { courseId } : {},
        prerequisiteCourseId ? { prerequisiteCourseId } : {},
      ],
    };

    const [prerequisites, total] = await this.prisma.$transaction([
      this.prisma.coursePrerequisite.findMany({
        where,
        skip,
        take: limit,
        include: this.getPrerequisiteInclude(),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.coursePrerequisite.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách prerequisites thành công',
      data: {
        data: prerequisites.map(p => this.formatPrerequisiteResponse(p)),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  // Lấy prerequisite theo id
  async getCoursePrerequisiteById(id: number) {
    const prerequisite = await this.prisma.coursePrerequisite.findUnique({
      where: { id },
      include: this.getPrerequisiteInclude(),
    });
    
    if (!prerequisite) throw new NotFoundException('Prerequisite không tồn tại');

    return {
      success: true,
      message: 'Lấy prerequisite thành công',
      data: this.formatPrerequisiteResponse(prerequisite),
    };
  }

  // Lấy prerequisites của một course
  async getPrerequisitesByCourseId(courseId: number) {
    const prerequisites = await this.prisma.coursePrerequisite.findMany({
      where: { courseId },
      include: this.getPrerequisiteInclude(),
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      message: 'Lấy prerequisites của course thành công',
      data: prerequisites.map(p => this.formatPrerequisiteResponse(p)),
    };
  }

  // Lấy courses mà require course này làm prerequisite
  async getRequiredByCourses(prerequisiteCourseId: number) {
    const prerequisites = await this.prisma.coursePrerequisite.findMany({
      where: { prerequisiteCourseId },
      include: this.getPrerequisiteInclude(),
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      message: 'Lấy courses require prerequisite thành công',
      data: prerequisites.map(p => this.formatPrerequisiteResponse(p)),
    };
  }

  // Cập nhật prerequisite
  async updateCoursePrerequisite(id: number, dto: UpdateCoursePrerequisiteDto) {
    const prerequisite = await this.prisma.coursePrerequisite.findUnique({ 
      where: { id } 
    });
    if (!prerequisite) throw new NotFoundException('Prerequisite không tồn tại');

    // Verify courses exist if provided
    if (dto.courseId || dto.prerequisiteCourseId) {
      await this.verifyCoursesExist(
        dto.courseId || prerequisite.courseId,
        dto.prerequisiteCourseId || prerequisite.prerequisiteCourseId
      );
    }

    // Check circular dependency if changing relations
    if (dto.courseId || dto.prerequisiteCourseId) {
      await this.checkCircularDependency(
        dto.courseId || prerequisite.courseId,
        dto.prerequisiteCourseId || prerequisite.prerequisiteCourseId
      );
    }

    // Check if trying to add self as prerequisite
    if ((dto.courseId || prerequisite.courseId) === (dto.prerequisiteCourseId || prerequisite.prerequisiteCourseId)) {
      throw new BadRequestException('Không thể thêm khóa học làm prerequisite cho chính nó');
    }

    const updated = await this.prisma.coursePrerequisite.update({
      where: { id },
      data: dto,
      include: this.getPrerequisiteInclude(),
    });

    return {
      success: true,
      message: 'Cập nhật prerequisite thành công',
      data: this.formatPrerequisiteResponse(updated),
    };
  }

  // Xóa prerequisite
  async deleteCoursePrerequisite(id: number) {
    const prerequisite = await this.prisma.coursePrerequisite.findUnique({ 
      where: { id } 
    });
    if (!prerequisite) throw new NotFoundException('Prerequisite không tồn tại');

    await this.prisma.coursePrerequisite.delete({ where: { id } });

    return {
      success: true,
      message: 'Xóa prerequisite thành công',
      data: null,
    };
  }

  // Xóa prerequisite bằng courseId và prerequisiteCourseId
  async deleteCoursePrerequisiteByCourses(courseId: number, prerequisiteCourseId: number) {
    const prerequisite = await this.prisma.coursePrerequisite.findUnique({
      where: {
        courseId_prerequisiteCourseId: {
          courseId,
          prerequisiteCourseId,
        },
      },
    });
    
    if (!prerequisite) throw new NotFoundException('Prerequisite không tồn tại');

    await this.prisma.coursePrerequisite.delete({
      where: {
        courseId_prerequisiteCourseId: {
          courseId,
          prerequisiteCourseId,
        },
      },
    });

    return {
      success: true,
      message: 'Xóa prerequisite thành công',
      data: null,
    };
  }

  // Helper methods
  private getPrerequisiteInclude() {
    return {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          level: true,
        },
      },
      prerequisite: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          level: true,
        },
      },
    };
  }

  private formatPrerequisiteResponse(prerequisite: any) {
    return {
      ...new CoursePrerequisiteResponseDto(prerequisite),
      course: prerequisite.course,
      prerequisite: prerequisite.prerequisite,
    };
  }

  private async verifyCoursesExist(courseId: number, prerequisiteCourseId: number) {
    const [course, prerequisiteCourse] = await Promise.all([
      this.prisma.course.findUnique({ where: { id: courseId } }),
      this.prisma.course.findUnique({ where: { id: prerequisiteCourseId } }),
    ]);

    if (!course) throw new BadRequestException('Course không tồn tại');
    if (!prerequisiteCourse) throw new BadRequestException('Prerequisite course không tồn tại');
  }

  private async checkCircularDependency(courseId: number, prerequisiteCourseId: number) {
    // Check if prerequisite course already requires the main course (circular dependency)
    const circularCheck = await this.prisma.coursePrerequisite.findUnique({
      where: {
        courseId_prerequisiteCourseId: {
          courseId: prerequisiteCourseId,
          prerequisiteCourseId: courseId,
        },
      },
    });

    if (circularCheck) {
      throw new BadRequestException('Circular dependency detected');
    }

    // Check deeper circular dependencies
    const visited = new Set<number>();
    const hasCircular = await this.checkDependencyChain(prerequisiteCourseId, courseId, visited);
    if (hasCircular) {
      throw new BadRequestException('Circular dependency detected in dependency chain');
    }
  }

  private async checkDependencyChain(startCourseId: number, targetCourseId: number, visited: Set<number>): Promise<boolean> {
    if (visited.has(startCourseId)) return false;
    visited.add(startCourseId);

    if (startCourseId === targetCourseId) return true;

    const prerequisites = await this.prisma.coursePrerequisite.findMany({
      where: { courseId: startCourseId },
    });

    for (const prereq of prerequisites) {
      const found = await this.checkDependencyChain(prereq.prerequisiteCourseId, targetCourseId, visited);
      if (found) return true;
    }

    return false;
  }
}