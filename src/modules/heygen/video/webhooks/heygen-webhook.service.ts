import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { HeygenVideoStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { WebhookEventDto, WebhookVideoStatus } from './dto/webhook-event.dto';

@Injectable()
export class HeyGenWebhookService {
  private readonly logger = new Logger(HeyGenWebhookService.name);

  constructor(private prisma: PrismaService) {}

  async handleVideoEvent(videoId: string, eventData: WebhookEventDto, signature: string) {
    // Find video by HeyGen videoId
    const video = await this.prisma.heygenVideo.findUnique({
      where: { videoId },
    });

    if (!video) {
      this.logger.error(`Video not found for videoId: ${videoId}`);
      throw new BadRequestException('Video not found');
    }

    // Kiểm tra webhookSecret có tồn tại không
    if (!video.webhookSecret) {
      this.logger.error(`Webhook secret not found for video: ${videoId}`);
      throw new BadRequestException('Webhook secret not configured');
    }

    // Verify webhook signature - FIX: truyền video.webhookSecret (không còn null)
    if (!this.verifySignature(signature, video.webhookSecret, eventData)) {
      this.logger.error(`Invalid webhook signature for video: ${videoId}`);
      throw new BadRequestException('Invalid signature');
    }

    this.logger.log(`Processing webhook for video: ${videoId}, status: ${eventData.data.status}`);

    // Update video based on webhook event
    const updateData: any = {
      status: this.mapHeyGenStatus(eventData.data.status),
      updatedAt: new Date(),
    };

    if (eventData.data.status === WebhookVideoStatus.COMPLETED) {
      updateData.videoUrl = eventData.data.video_url;
      updateData.thumbnailUrl = eventData.data.thumbnail_url;
      updateData.duration = eventData.data.duration;
      updateData.completedAt = new Date();
      updateData.errorMessage = null;
      updateData.lastError = null;
    } else if (eventData.data.status === WebhookVideoStatus.FAILED) {
      updateData.errorMessage = eventData.data.error_message;
      updateData.lastError = eventData.data.error_message;
    } else if (eventData.data.status === WebhookVideoStatus.PROCESSING) {
      updateData.status = HeygenVideoStatus.PROCESSING;
    }

    // Add metadata if available
    if (eventData.data.metadata) {
      updateData.metadata = eventData.data.metadata;
    }

    await this.prisma.heygenVideo.update({
      where: { id: video.id },
      data: updateData,
    });

    this.logger.log(`Video ${videoId} updated to status: ${updateData.status}`);
  }

  private verifySignature(signature: string, secret: string, payload: any): boolean {
    if (!secret || !signature) {
      return false;
    }

    try {
      const hmac = crypto.createHmac('sha256', secret);
      const expectedSignature = hmac
        .update(JSON.stringify(payload))
        .digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      this.logger.error('Error verifying signature:', error);
      return false;
    }
  }

  private mapHeyGenStatus(heygenStatus: WebhookVideoStatus): HeygenVideoStatus {
    const statusMap: { [key in WebhookVideoStatus]: HeygenVideoStatus } = {
      [WebhookVideoStatus.PENDING]: HeygenVideoStatus.PENDING,
      [WebhookVideoStatus.WAITING]: HeygenVideoStatus.WAITING,
      [WebhookVideoStatus.PROCESSING]: HeygenVideoStatus.PROCESSING,
      [WebhookVideoStatus.COMPLETED]: HeygenVideoStatus.COMPLETED,
      [WebhookVideoStatus.FAILED]: HeygenVideoStatus.FAILED,
    };

    return statusMap[heygenStatus] || HeygenVideoStatus.FAILED;
  }
}