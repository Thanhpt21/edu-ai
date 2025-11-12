import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { HeyGenApiService } from '../shared/heygen-api.service';
import { HeygenVideoStatus } from '@prisma/client';
import { IVideoGenerationRequest } from '../shared/interfaces/heygen-api.interface';

export interface VideoGenerationJob {
  videoId: number;
  retryCount: number;
}

@Injectable()
@Processor('video-generation')
export class VideosProcessor {
  private readonly logger = new Logger(VideosProcessor.name);

  constructor(
    private prisma: PrismaService,
    private heygenApiService: HeyGenApiService,
  ) {}

  @Process('generate')
  async handleVideoGeneration(job: Job<VideoGenerationJob>) {
    const { videoId, retryCount } = job.data;

    try {
      this.logger.log(`Processing video generation job for videoId: ${videoId}`);

      const video = await this.prisma.heygenVideo.findUnique({
        where: { id: videoId },
        include: { 
          avatar: {
            select: {
              id: true,
              avatarId: true,
              name: true,
            }
          }, 
          voice: {
            select: {
              id: true,
              voiceId: true,
              name: true,
            }
          } 
        },
      });

      if (!video) {
        throw new Error(`Video not found: ${videoId}`);
      }

      // Update status to processing
      await this.prisma.heygenVideo.update({
        where: { id: videoId },
        data: { status: HeygenVideoStatus.PROCESSING },
      });

      // Tạo request payload đúng với V2 API - ĐÃ SỬA
      const requestPayload: IVideoGenerationRequest = {
        video_inputs: [
          {
            character: {
              type: 'avatar' as const,
              avatar_id: video.avatar.avatarId,
              avatar_style: 'normal'
            },
            voice: {
              type: 'text' as const,
              input_text: video.inputText,
              voice_id: video.voice.voiceId
            },
            ...(video.backgroundType && {
              background: {
                type: video.backgroundType as 'color' | 'image' | 'video',
                ...(video.backgroundColor && { value: video.backgroundColor }),
                ...(video.backgroundImageUrl && { value: video.backgroundImageUrl }),
                ...(video.backgroundVideoUrl && { value: video.backgroundVideoUrl }),
                ...(video.backgroundPlayStyle && { 
                  play_style: video.backgroundPlayStyle as 'fit_to_scene' | 'freeze' | 'loop' | 'full_video'
                })
              }
            })
          }
        ],
        ...(video.dimensionWidth && video.dimensionHeight && {
          dimension: {
            width: video.dimensionWidth,
            height: video.dimensionHeight,
          }
        }),
        test: false,
      };



      // Call HeyGen API V2
      const heygenResponse = await this.heygenApiService.generateVideo(requestPayload);

      // XỬ LÝ RESPONSE LINH HOẠT - ĐÃ SỬA
      let heygenVideoId: string;
      
      // V2 API có thể trả về direct fields hoặc data wrapper
      if (heygenResponse.video_id) {
        // Trường hợp 1: Direct fields (V2 API)
        heygenVideoId = heygenResponse.video_id;
      } else if (heygenResponse.data?.video_id) {
        // Trường hợp 2: Có data wrapper
        heygenVideoId = heygenResponse.data.video_id;
      } else {
        // Fallback: tạo videoId tạm thời
        heygenVideoId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.warn('⚠️ Không tìm thấy video_id trong response, sử dụng temp ID:', heygenVideoId);
      }

      // VALIDATE VIDEO ID
      if (!heygenVideoId || heygenVideoId.startsWith('temp_')) {
        throw new Error(`Invalid video ID received from HeyGen: ${heygenVideoId}`);
      }

      // Update with HeyGen video ID
      await this.prisma.heygenVideo.update({
        where: { id: videoId },
        data: {
          videoId: heygenVideoId,
          status: HeygenVideoStatus.PENDING, // HeyGen will update via webhook
          retryCount: retryCount + 1,
        },
      });

      this.logger.log(`Video generation started for HeyGen ID: ${heygenVideoId}`);
      
      return { success: true, heygenVideoId: heygenVideoId };
    } catch (error) {
      this.logger.error(`Video generation failed for videoId: ${videoId}`, error.stack);

      // Update video status to failed
      await this.prisma.heygenVideo.update({
        where: { id: videoId },
        data: {
          status: HeygenVideoStatus.FAILED,
          lastError: error.message,
          retryCount: retryCount + 1,
        },
      });

      throw error;
    }
  }
}