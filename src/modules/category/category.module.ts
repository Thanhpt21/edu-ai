import { Module } from '@nestjs/common';

import { PrismaService } from 'prisma/prisma.service';
import { CategoriesController } from './category.controller';
import { CategoriesService } from './category.service';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, PrismaService],
  exports: [CategoriesService],
})
export class CategoriesModule {}