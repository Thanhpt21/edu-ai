import { Module } from '@nestjs/common';

import { PrismaService } from 'prisma/prisma.service';
import { VoicesController } from './voice.controller';
import { VoicesService } from './voice.service';

@Module({
  controllers: [VoicesController],
  providers: [VoicesService, PrismaService],
  exports: [VoicesService],
})
export class VoicesModule {}