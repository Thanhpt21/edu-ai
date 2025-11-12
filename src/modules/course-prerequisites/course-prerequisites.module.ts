import { Module } from '@nestjs/common';
import { CoursePrerequisitesService } from './course-prerequisites.service';
import { CoursePrerequisitesController } from './course-prerequisites.controller';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [CoursePrerequisitesController],
  providers: [CoursePrerequisitesService, PrismaService],
  exports: [CoursePrerequisitesService],
})
export class CoursePrerequisitesModule {}