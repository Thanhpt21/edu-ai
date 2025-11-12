import { Blog } from "@prisma/client";

export class BlogResponseDto {
  id: number;
  title: string;
  slug: string;
  description: string;
  thumb: string | null;
  content: any; // JSON
  numberViews: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: number;
    name: string;
    avatar: string | null;
  };

  constructor(blog: Blog & { createdBy: any }) {
    this.id = blog.id;
    this.title = blog.title;
    this.slug = blog.slug;
    this.description = blog.description;
    this.thumb = blog.thumb;
    this.content = blog.content;
    this.numberViews = blog.numberViews;
    this.isPublished = blog.isPublished;
    this.createdAt = blog.createdAt;
    this.updatedAt = blog.updatedAt;
    this.createdBy = blog.createdBy; // chỉ có id, name, avatar
  }
}
