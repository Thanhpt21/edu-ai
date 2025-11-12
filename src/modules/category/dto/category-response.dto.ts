import { Category } from '@prisma/client';

export class CategoryResponseDto {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(category: Category) {
    this.id = category.id;
    this.name = category.name;
    this.description = category.description ?? undefined;
    this.createdAt = category.createdAt;
    this.updatedAt = category.updatedAt;
  }
}