import { Module } from '@nestjs/common';
import { AvatarIVVideoService } from './avatar-iv-video.service';
import { AvatarIVVideoController } from './avatar-iv-video.controller';
import { PrismaService } from 'prisma/prisma.service';
import { HeyGenApiService } from '../shared/heygen-api.service';

@Module({
  controllers: [AvatarIVVideoController],
  providers: [AvatarIVVideoService, PrismaService, HeyGenApiService],
  exports: [AvatarIVVideoService],
})
export class AvatarIVVideoModule {}