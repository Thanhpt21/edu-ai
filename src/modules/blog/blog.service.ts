import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { BlogResponseDto } from './dto/blog-response.dto';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';

@Injectable()
export class BlogService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REQUEST) private readonly request: Request | any,
    private readonly uploadService: UploadService,
  ) {}

  async create(dto: CreateBlogDto, file?: Express.Multer.File) {
    const existing = await this.prisma.blog.findFirst({
      where: { slug: dto.slug },
    });
    if (existing) return { success: false, message: 'Slug blog đã tồn tại' };

    let thumbUrl: string | null = null;
    if (file) {
      thumbUrl = await this.uploadService.uploadLocalImage(file);
    }

    const isPublished: boolean =
      typeof dto.isPublished === 'string'
        ? dto.isPublished === 'true'
        : !!dto.isPublished;

    const blog = await this.prisma.blog.create({
      data: {
        title: dto.title,
        slug: dto.slug!,
        description: dto.description,
        thumb: thumbUrl,
        content: dto.content,
        isPublished,
        createdById: this.request.user.id,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return {
      success: true,
      message: 'Tạo blog thành công',
      data: new BlogResponseDto(blog),
    };
  }

  async getBlogs(page = 1, limit = 10, search = '') {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [blogs, total] = await this.prisma.$transaction([
      this.prisma.blog.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, name: true, avatar: true } },
        },
      }),
      this.prisma.blog.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách blog thành công',
      data: {
        data: blogs.map((b) => new BlogResponseDto(b)),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  async getAll(search = '') {
    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const blogs = await this.prisma.blog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true, avatar: true } },
      },
    });

    return {
      success: true,
      message: 'Lấy danh sách blog thành công',
      data: blogs.map((b) => new BlogResponseDto(b)),
    };
  }

  async getById(id: number) {
    const blog = await this.prisma.blog.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, avatar: true } },
      },
    });
    if (!blog) return { success: false, message: 'Blog không tồn tại' };

    return {
      success: true,
      message: 'Lấy blog thành công',
      data: new BlogResponseDto(blog),
    };
  }

  async update(id: number, dto: UpdateBlogDto, file?: Express.Multer.File) {
    const blog = await this.prisma.blog.findUnique({ where: { id } });
    if (!blog) return { success: false, message: 'Blog không tồn tại' };

    // Xử lý thumbnail
    let thumbUrl = blog.thumb;
    if (file) {
      if (blog.thumb) await this.uploadService.deleteLocalImage(blog.thumb);
      thumbUrl = await this.uploadService.uploadLocalImage(file);
    }

    // Chuyển string 'true'/'false' thành boolean
    const isPublished: boolean =
      typeof dto.isPublished === 'string'
        ? dto.isPublished === 'true'
        : !!dto.isPublished;

    let content = '[]';
    if (dto.content) {
      if (typeof dto.content === 'string') {
        try {
          JSON.parse(dto.content); // check valid JSON
          content = dto.content;
        } catch {
          content = '[]';
        }
      } else {
        content = JSON.stringify(dto.content);
      }
    }

    const updated = await this.prisma.blog.update({
      where: { id },
      data: {
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        thumb: thumbUrl,
        isPublished,
        content,
      },
      include: {
        createdBy: { select: { id: true, name: true, avatar: true } },
      },
    });

    return {
      success: true,
      message: 'Cập nhật blog thành công',
      data: new BlogResponseDto(updated),
    };
  }

  async delete(id: number) {
    const blog = await this.prisma.blog.findUnique({ where: { id } });
    if (!blog) return { success: false, message: 'Blog không tồn tại' };

    if (blog.thumb) {
      await this.uploadService.deleteLocalImage(blog.thumb);
    }

    await this.prisma.blog.delete({ where: { id } });

    return { success: true, message: 'Xóa blog thành công' };
  }

  async getBlogBySlug(slug: string) {
    const blog = await this.prisma.blog.findFirst({
      where: { slug },
      include: {
        createdBy: { select: { id: true, name: true, avatar: true } },
      },
    });

    if (!blog) {
      return { success: false, message: 'Blog không tồn tại' };
    }

    await this.prisma.blog.update({
      where: { id: blog.id },
      data: { numberViews: blog.numberViews + 1 },
    });

    return {
      success: true,
      message: 'Lấy blog thành công',
      data: new BlogResponseDto(blog),
    };
  }
}
