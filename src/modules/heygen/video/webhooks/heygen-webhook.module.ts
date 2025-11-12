import { Module } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { HeyGenWebhookController } from './heygen-webhook.controller';
import { HeyGenWebhookService } from './heygen-webhook.service';

@Module({
  controllers: [HeyGenWebhookController],
  providers: [HeyGenWebhookService, PrismaService],
})
export class HeyGenWebhookModule {}