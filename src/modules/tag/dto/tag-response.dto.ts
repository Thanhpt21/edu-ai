import { Tag } from '@prisma/client';

export class TagResponseDto {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(tag: Tag) {
    this.id = tag.id;
    this.name = tag.name;
    this.description = tag.description ?? undefined;
    this.createdAt = tag.createdAt;
    this.updatedAt = tag.updatedAt;
  }
}