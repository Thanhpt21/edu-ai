import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { VideosService } from 'src/modules/heygen/video/video.service';


@Injectable()
export class VideoSyncTask {
  constructor(private readonly videosService: VideosService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async syncPendingVideos() {
    const startTime = new Date();
    console.log(`🕒 [CRON START] Video sync started at: ${startTime.toISOString()}`);
    
    try {
      await this.videosService.syncPendingVideos();
      const endTime = new Date();
      console.log(`✅ [CRON END] Video sync completed at: ${endTime.toISOString()}`);
    } catch (error) {
      console.error(`❌ [CRON ERROR] Video sync failed:`, error);
    }
  }

  // Test ngay khi start
  async onModuleInit() {
    console.log('🚀 VideoSyncTask initialized');
    // Chạy test ngay
    await this.syncPendingVideos();
  }
}