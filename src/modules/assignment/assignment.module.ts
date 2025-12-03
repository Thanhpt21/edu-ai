// src/assignment/assignment.module.ts
import { Module } from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { AssignmentController } from './assignment.controller';
import { PrismaService } from 'prisma/prisma.service';
import { UploadService } from '../upload/upload.service';

@Module({
  controllers: [AssignmentController],
  providers: [AssignmentService, PrismaService, UploadService],
  exports: [AssignmentService],
})
export class AssignmentModule {}