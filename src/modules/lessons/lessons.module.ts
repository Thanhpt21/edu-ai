import { Module } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { LessonsController } from './lessons.controller';
import { PrismaService } from 'prisma/prisma.service';
import { UploadService } from '../upload/upload.service';

@Module({
  controllers: [LessonsController],
  providers: [LessonsService, PrismaService, UploadService],
  exports: [LessonsService],
})
export class LessonsModule {}