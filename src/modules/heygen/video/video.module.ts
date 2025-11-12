import { Module } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { VideosController } from './video.controller';
import { VideosService } from './video.service';
import { HeyGenApiService } from '../shared/heygen-api.service';
import { HttpModule } from '@nestjs/axios';
import { VideoSyncTask } from 'src/task/video-sync.task';
// Thêm nếu dùng queue
// import { VideosProcessorModule } from './videos.processor.module';

@Module({
// imports: [VideosProcessorModule], // Thêm nếu dùng queue
 imports: [
    HttpModule, // THÊM DÒNG NÀY
  ],
  controllers: [VideosController],
  providers: [VideosService, PrismaService, HeyGenApiService, VideoSyncTask],
  exports: [VideosService],
})
export class VideosModule {}