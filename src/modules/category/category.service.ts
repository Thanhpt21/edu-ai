import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';

import { Prisma } from '@prisma/client';
import { CategoryQueryDto } from './dto/category-query.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  // Tạo category mới
  async createCategory(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ 
      where: { name: dto.name } 
    });
    if (existing) throw new BadRequestException('Category đã tồn tại');

    const category = await this.prisma.category.create({ 
      data: {
        name: dto.name,
        description: dto.description,
      }
    });

    return {
      success: true,
      message: 'Tạo category thành công',
      data: new CategoryResponseDto(category),
    };
  }

  // Lấy danh sách categories (có phân trang + search)
  async getCategories(query: CategoryQueryDto) {
    const { page = 1, limit = 10, search = '' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CategoryWhereInput = search
      ? { 
          OR: [
            { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
            { description: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
          ]
        }
      : {};

    const [categories, total] = await this.prisma.$transaction([
      this.prisma.category.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          courses: {
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
          _count: {
            select: {
              courses: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách categories thành công',
      data: {
        data: categories.map((category) => ({
          ...new CategoryResponseDto(category),
          courseCount: category._count.courses,
          courses: category.courses.map(cc => cc.course),
        })),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  // Lấy tất cả categories (không phân trang)
  async getAllCategories(search: string = '') {
    const where: Prisma.CategoryWhereInput = search
      ? { 
          OR: [
            { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
            { description: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
          ]
        }
      : {};

    const categories = await this.prisma.category.findMany({
      where,
      include: {
        _count: {
          select: {
            courses: true,
          }
        }
      },
      orderBy: { name: 'asc' },
    });

    return {
      success: true,
      message: 'Lấy tất cả categories thành công',
      data: categories.map((category) => ({
        ...new CategoryResponseDto(category),
        courseCount: category._count.courses,
      })),
    };
  }

  // Lấy category theo id
  async getCategoryById(id: number) {
    const category = await this.prisma.category.findUnique({ 
      where: { id },
      include: {
        courses: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
                thumbnail: true,
                description: true,
                level: true,
                price: true,
                isPublished: true,
                instructor: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            courses: true,
          }
        }
      }
    });
    
    if (!category) throw new NotFoundException('Category không tồn tại');

    return {
      success: true,
      message: 'Lấy category thành công',
      data: {
        ...new CategoryResponseDto(category),
        courseCount: category._count.courses,
        courses: category.courses.map(cc => cc.course),
      },
    };
  }

  // Cập nhật category
  async updateCategory(id: number, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category không tồn tại');

    // Check duplicate name
    if (dto.name && dto.name !== category.name) {
      const existing = await this.prisma.category.findUnique({
        where: { name: dto.name },
      });
      if (existing) throw new BadRequestException('Category name đã tồn tại');
    }

    const updated = await this.prisma.category.update({ 
      where: { id }, 
      data: dto 
    });

    return {
      success: true,
      message: 'Cập nhật category thành công',
      data: new CategoryResponseDto(updated),
    };
  }

  // Xóa category
  async deleteCategory(id: number) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category không tồn tại');

    // Check if category has courses
    const courseCount = await this.prisma.courseCategory.count({
      where: { categoryId: id }
    });

    if (courseCount > 0) {
      throw new BadRequestException('Không thể xóa category đang có courses');
    }

    await this.prisma.category.delete({ where: { id } });

    return {
      success: true,
      message: 'Xóa category thành công',
      data: null,
    };
  }
}