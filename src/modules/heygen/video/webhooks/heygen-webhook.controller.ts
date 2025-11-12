import {
  Controller,
  Post,
  Body,
  Headers,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HeyGenWebhookService } from './heygen-webhook.service';
import { WebhookEventDto } from './dto/webhook-event.dto';


@Controller('v1/webhooks/heygen')
export class HeyGenWebhookController {
  constructor(private readonly webhookService: HeyGenWebhookService) {}

  @Post('video/:videoId')
  async handleVideoWebhook(
    @Param('videoId') videoId: string,
    @Body() eventData: WebhookEventDto,
    @Headers('x-heygen-signature') signature: string,
  ) {
    try {
      await this.webhookService.handleVideoEvent(videoId, eventData, signature);
      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('test')
  async testWebhook(@Body() body: any) {
    return { success: true, message: 'Test webhook received' };
  }
}