import { Module } from '@nestjs/common';

import { PrismaService } from 'prisma/prisma.service';
import { AvatarsController } from './avatar.controller';
import { AvatarsService } from './avatar.service';

@Module({
  controllers: [AvatarsController],
  providers: [AvatarsService, PrismaService],
  exports: [AvatarsService],
})
export class AvatarsModule {}