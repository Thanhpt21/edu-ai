import { Module } from '@nestjs/common';
import { LessonProgressService } from './lesson-progress.service';
import { LessonProgressController } from './lesson-progress.controller';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [LessonProgressController],
  providers: [LessonProgressService, PrismaService],
  exports: [LessonProgressService],
})
export class LessonProgressModule {}