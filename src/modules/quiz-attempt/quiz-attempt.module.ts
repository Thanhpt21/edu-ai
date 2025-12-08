import { Module } from '@nestjs/common';
import { QuizAttemptService } from './quiz-attempt.service';
import { QuizAttemptController } from './quiz-attempt.controller';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [QuizAttemptController],
  providers: [QuizAttemptService, PrismaService],
  exports: [QuizAttemptService],
})
export class QuizAttemptModule {}