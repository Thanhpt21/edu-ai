import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagResponseDto } from './dto/tag-response.dto';
import { TagQueryDto } from './dto/tag-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  // Tạo tag mới
  async createTag(dto: CreateTagDto) {
    const existing = await this.prisma.tag.findUnique({ 
      where: { name: dto.name } 
    });
    if (existing) throw new BadRequestException('Tag đã tồn tại');

    const tag = await this.prisma.tag.create({ 
      data: {
        name: dto.name,
        description: dto.description,
      }
    });

    return {
      success: true,
      message: 'Tạo tag thành công',
      data: new TagResponseDto(tag),
    };
  }

  // Lấy danh sách tags (có phân trang + search)
  async getTags(query: TagQueryDto) {
    const { page = 1, limit = 10, search = '' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TagWhereInput = search
      ? { 
          OR: [
            { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
            { description: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
          ]
        }
      : {};

    const [tags, total] = await this.prisma.$transaction([
      this.prisma.tag.findMany({
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
      this.prisma.tag.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách tags thành công',
      data: {
        data: tags.map((tag) => ({
          ...new TagResponseDto(tag),
          courseCount: tag._count.courses,
          courses: tag.courses.map(ct => ct.course),
        })),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  // Lấy tất cả tags (không phân trang)
  async getAllTags(search: string = '') {
    const where: Prisma.TagWhereInput = search
      ? { 
          OR: [
            { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
            { description: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
          ]
        }
      : {};

    const tags = await this.prisma.tag.findMany({
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
      message: 'Lấy tất cả tags thành công',
      data: tags.map((tag) => ({
        ...new TagResponseDto(tag),
        courseCount: tag._count.courses,
      })),
    };
  }

  // Lấy tag theo id
  async getTagById(id: number) {
    const tag = await this.prisma.tag.findUnique({ 
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
    
    if (!tag) throw new NotFoundException('Tag không tồn tại');

    return {
      success: true,
      message: 'Lấy tag thành công',
      data: {
        ...new TagResponseDto(tag),
        courseCount: tag._count.courses,
        courses: tag.courses.map(ct => ct.course),
      },
    };
  }

  // Cập nhật tag
  async updateTag(id: number, dto: UpdateTagDto) {
    const tag = await this.prisma.tag.findUnique({ where: { id } });
    if (!tag) throw new NotFoundException('Tag không tồn tại');

    // Check duplicate name
    if (dto.name && dto.name !== tag.name) {
      const existing = await this.prisma.tag.findUnique({
        where: { name: dto.name },
      });
      if (existing) throw new BadRequestException('Tag name đã tồn tại');
    }

    const updated = await this.prisma.tag.update({ 
      where: { id }, 
      data: dto 
    });

    return {
      success: true,
      message: 'Cập nhật tag thành công',
      data: new TagResponseDto(updated),
    };
  }

  // Xóa tag
  async deleteTag(id: number) {
    const tag = await this.prisma.tag.findUnique({ where: { id } });
    if (!tag) throw new NotFoundException('Tag không tồn tại');

    // Check if tag has courses
    const courseCount = await this.prisma.courseTag.count({
      where: { tagId: id }
    });

    if (courseCount > 0) {
      throw new BadRequestException('Không thể xóa tag đang có courses');
    }

    await this.prisma.tag.delete({ where: { id } });

    return {
      success: true,
      message: 'Xóa tag thành công',
      data: null,
    };
  }
}