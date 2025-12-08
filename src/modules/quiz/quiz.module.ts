// src/quiz/quiz.module.ts
import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { PrismaService } from 'prisma/prisma.service';
import { UploadService } from '../upload/upload.service';

@Module({
  controllers: [QuizController],
  providers: [QuizService, PrismaService, UploadService],
  exports: [QuizService],
})
export class QuizModule {}