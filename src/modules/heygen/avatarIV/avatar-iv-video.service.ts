import { Injectable, Logger, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { HeyGenApiService } from '../shared/heygen-api.service';
import { CreateAvatarIVVideoDto } from './dto/create-avatar-iv-video.dto';
import { AvatarIVVideoResponseDto } from './dto/avatar-iv-video-response.dto';
import { IHeyGenAvatarIVResponse, IHeyGenUploadAssetResponse } from './interfaces/avatar-iv-video.interface';

@Injectable()
export class AvatarIVVideoService {
  private readonly logger = new Logger(AvatarIVVideoService.name);

  constructor(
    private prisma: PrismaService,
    private heygenApiService: HeyGenApiService,
  ) {}

  // Upload image asset lên HeyGen
  async uploadImageAsset(file: Express.Multer.File) {
  try {
    this.logger.log('Bắt đầu upload image asset lên HeyGen...');

    const uploadResponse = await this.heygenApiService.uploadAsset(file);
    
    this.logger.log('HeyGen upload response:', JSON.stringify(uploadResponse, null, 2));

    const responseData = uploadResponse as IHeyGenUploadAssetResponse;

    if (responseData.error) {
      throw new Error(`HeyGen upload failed: ${responseData.error.message}`);
    }

    // SỬA: Dùng image_key thay vì asset.image_key
    if (!responseData.data?.image_key) {
      throw new Error('Không nhận được image_key từ HeyGen');
    }

    return {
      success: true,
      message: 'Upload image thành công',
      data: {
        assetId: responseData.data.id,
        imageKey: responseData.data.image_key,
        url: responseData.data.url,
        fileType: responseData.data.file_type,
      },
    };
  } catch (error) {
    this.logger.error('Lỗi upload image asset:', error);
    throw new InternalServerErrorException(`Lỗi upload image: ${error.message}`);
  }
}

  // Tạo Avatar IV video
  async createAvatarIVVideo(dto: CreateAvatarIVVideoDto, userId?: number) {
    try {
      this.logger.log('Bắt đầu tạo Avatar IV video...', dto);

      // Validate voice exists trong database
      const voice = await this.prisma.heygenVoice.findFirst({
        where: { voiceId: dto.voiceId },
      });

      if (!voice) {
        throw new BadRequestException(`Voice ID ${dto.voiceId} không tồn tại`);
      }

      // Tạo record trong database
      const videoRecord = await this.prisma.heygenAvatarIVVideo.create({
        data: {
          title: dto.title,
          imageKey: dto.imageKey,
          script: dto.script,
          voiceId: dto.voiceId,
          language: dto.language || 'vi',
          customMotion: dto.customMotion,
          enhanceMotion: dto.enhanceMotion || false,
          status: 'processing',
          userId: userId,
        },
      });

      // Gọi HeyGen API để tạo video (async)
      this.generateVideoWithHeyGen(videoRecord.id, dto);

      return {
        success: true,
        message: 'Đã bắt đầu tạo video. Vui lòng check status sau.',
        data: new AvatarIVVideoResponseDto(videoRecord),
      };
    } catch (error) {
      this.logger.error('Lỗi tạo Avatar IV video:', error);
      throw new InternalServerErrorException(`Lỗi tạo video: ${error.message}`);
    }
  }

  // Private method để gọi HeyGen API (async)
  private async generateVideoWithHeyGen(videoId: number, dto: CreateAvatarIVVideoDto) {
    try {
      this.logger.log(`Gọi HeyGen API cho video ID: ${videoId}`);

      const response = await this.heygenApiService.createAvatarIVVideo({
        image_key: dto.imageKey,
        video_title: dto.title,
        script: dto.script,
        voice_id: dto.voiceId,
        language: dto.language || 'vi',
        custom_motion_prompt: dto.customMotion,
        enhance_custom_motion_prompt: dto.enhanceMotion || false,
      });

      const responseData = response as IHeyGenAvatarIVResponse;

      if (responseData.error) {
        // Update status failed
        await this.prisma.heygenAvatarIVVideo.update({
          where: { id: videoId },
          data: {
            status: 'failed',
            errorMessage: responseData.error.message,
          },
        });
        this.logger.error(`HeyGen API failed for video ${videoId}:`, responseData.error.message);
        return;
      }

      if (responseData.data?.video_id) {
        // Update với video_id từ HeyGen
        await this.prisma.heygenAvatarIVVideo.update({
          where: { id: videoId },
          data: {
            videoId: responseData.data.video_id,
            status: responseData.data.status,
            videoUrl: responseData.data.video_url,
          },
        });
        this.logger.log(`Video ${videoId} được tạo thành công với videoId: ${responseData.data.video_id}`);
      }
    } catch (error) {
      this.logger.error(`Lỗi khi gọi HeyGen API cho video ${videoId}:`, error);
      
      // Update status failed
      await this.prisma.heygenAvatarIVVideo.update({
        where: { id: videoId },
        data: {
          status: 'failed',
          errorMessage: error.message,
        },
      });
    }
  }

  // Lấy danh sách Avatar IV videos
  async getAvatarIVVideos(page = 1, limit = 10, userId?: number) {
    const skip = (page - 1) * limit;

    const where = userId ? { userId } : {};

    const [videos, total] = await this.prisma.$transaction([
      this.prisma.heygenAvatarIVVideo.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.heygenAvatarIVVideo.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách Avatar IV videos thành công',
      data: {
        data: videos.map((video) => new AvatarIVVideoResponseDto(video)),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  // Lấy video theo ID
  async getAvatarIVVideoById(id: number) {
    const video = await this.prisma.heygenAvatarIVVideo.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!video) {
      throw new NotFoundException('Avatar IV video không tồn tại');
    }

    return {
      success: true,
      message: 'Lấy video thành công',
      data: new AvatarIVVideoResponseDto(video),
    };
  }

  // Check video status từ HeyGen
  async checkVideoStatus(videoId: string) {
    try {
      this.logger.log(`Check status cho video: ${videoId}`);

      const response = await this.heygenApiService.getVideoStatus(videoId);
      
      // Update status trong database nếu cần
      const video = await this.prisma.heygenAvatarIVVideo.findFirst({
        where: { videoId },
      });

      if (video && response.data) {
        await this.prisma.heygenAvatarIVVideo.update({
          where: { id: video.id },
          data: {
            status: response.data.status,
            videoUrl: response.data.video_url || video.videoUrl,
          },
        });
      }

      return {
        success: true,
        message: 'Check status thành công',
        data: response.data,
      };
    } catch (error) {
      this.logger.error(`Lỗi check status video ${videoId}:`, error);
      throw new InternalServerErrorException(`Lỗi check status: ${error.message}`);
    }
  }

  // Xóa video
  async deleteAvatarIVVideo(id: number) {
    const video = await this.prisma.heygenAvatarIVVideo.findUnique({
      where: { id },
    });

    if (!video) {
      throw new NotFoundException('Avatar IV video không tồn tại');
    }

    // Nếu có videoId, có thể gọi HeyGen API để xóa video trên cloud
    if (video.videoId) {
      try {
        await this.heygenApiService.deleteVideo(video.videoId);
      } catch (error) {
        this.logger.warn(`Không thể xóa video trên HeyGen: ${error.message}`);
      }
    }

    await this.prisma.heygenAvatarIVVideo.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Xóa video thành công',
      data: null,
    };
  }
}