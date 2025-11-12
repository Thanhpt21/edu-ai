import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { GenerateVideoDto } from './dto/generate-video.dto';
import { VideoQueryDto } from './dto/video-query.dto';
import { VideoResponseDto } from './dto/video-response.dto';
import { Prisma, HeygenVideoStatus } from '@prisma/client';
import { HeyGenApiService } from '../shared/heygen-api.service';
import { IVideoGenerationRequest } from '../shared/interfaces/heygen-api.interface';

@Injectable()
export class VideosService {
  constructor(
    private prisma: PrismaService,
    private heygenApiService: HeyGenApiService,
  ) {}

  // Tạo video record
  async createVideo(dto: CreateVideoDto, userId: number) {
    const existing = await this.prisma.heygenVideo.findUnique({ 
      where: { videoId: dto.videoId } 
    });
    if (existing) throw new BadRequestException('Video ID đã tồn tại');

    // Verify avatar and voice exist
    await this.verifyAvatarAndVoice(dto.avatarId, dto.voiceId);

    const video = await this.prisma.heygenVideo.create({ 
      data: {
        ...dto,
        userId: userId,
        lessonId: dto.lessonId || null,
        dimensionWidth: dto.dimensionWidth || 1280,
        dimensionHeight: dto.dimensionHeight || 720,
        isWebM: dto.isWebM || false,
        status: dto.status || HeygenVideoStatus.PENDING,
        retryCount: 0,
        maxRetries: 3,
      }
    });
    
    return {
      success: true,
      message: 'Tạo video thành công',
      data: new VideoResponseDto(video),
    };
  }

  // Generate video với HeyGen API V2 - ĐÃ SỬA
async generateVideo(dto: GenerateVideoDto, userId: number) {
  const { avatar, voice } = await this.verifyAvatarAndVoice(dto.avatarId, dto.voiceId);
  try {
    const requestPayload: IVideoGenerationRequest = {
      video_inputs: [
        {
          character: {
            type: 'avatar' as const,
            avatar_id: avatar.avatarId,
            avatar_style: 'normal'
          },
          voice: {
            type: 'text' as const,
            input_text: dto.inputText,
            voice_id: voice.voiceId
          },
          ...(dto.backgroundType && {
            background: {
              type: dto.backgroundType as 'color' | 'image' | 'video',
              ...(dto.backgroundColor && { value: dto.backgroundColor }),
              ...(dto.backgroundImageUrl && { value: dto.backgroundImageUrl }),
              ...(dto.backgroundVideoUrl && { value: dto.backgroundVideoUrl }),
              ...(dto.backgroundPlayStyle && { 
                play_style: dto.backgroundPlayStyle as 'fit_to_scene' | 'freeze' | 'loop' | 'full_video'
              })
            }
          })
        }
      ],
      ...(dto.dimensionWidth && dto.dimensionHeight && {
        dimension: {
          width: dto.dimensionWidth,
          height: dto.dimensionHeight,
        }
      }),
      test: false,
    };



    // Gọi HeyGen API V2
    const heygenResponse = await this.heygenApiService.generateVideo(requestPayload);
    
    
    // XỬ LÝ RESPONSE LINH HOẠT - ĐÃ SỬA
    let videoId: string;
    
    // V2 API có thể trả về direct fields hoặc data wrapper
    if (heygenResponse.video_id) {
      // Trường hợp 1: Direct fields (V2 API)
      videoId = heygenResponse.video_id;
    } else if (heygenResponse.data?.video_id) {
      // Trường hợp 2: Có data wrapper (V1 API hoặc response khác)
      videoId = heygenResponse.data.video_id;
    } else {
      // Fallback: tạo videoId tạm thời
      videoId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }


    // VALIDATE VIDEO ID
    if (!videoId || videoId.startsWith('temp_')) {
      throw new Error(`Invalid video ID received from HeyGen: ${videoId}`);
    }

    // Tạo video record trong database
    const video = await this.prisma.heygenVideo.create({
      data: {
        videoId: videoId,
        userId: userId,
        lessonId: dto.lessonId || null,
        avatarId: dto.avatarId,
        voiceId: dto.voiceId,
        title: dto.title,
        inputText: dto.inputText,
        status: HeygenVideoStatus.PENDING,
        backgroundType: dto.backgroundType || null,
        backgroundColor: dto.backgroundColor || null,
        backgroundImageUrl: dto.backgroundImageUrl || null,
        backgroundVideoUrl: dto.backgroundVideoUrl || null,
        backgroundPlayStyle: dto.backgroundPlayStyle || null,
        dimensionWidth: dto.dimensionWidth || 640,
        dimensionHeight: dto.dimensionHeight || 360,
        isWebM: dto.isWebM || false,
        retryCount: 0,
        maxRetries: 3,
        webhookSecret: this.generateWebhookSecret(),
      },
    });

    return {
      success: true,
      message: 'Video đang được tạo, vui lòng chờ trong giây lát',
      data: new VideoResponseDto(video),
    };
  } catch (error) {
    throw new InternalServerErrorException(`Lỗi khi tạo video: ${error.message}`);
  }
}

  // Lấy danh sách video
  async getVideos(query: VideoQueryDto) {
    const { page = 1, limit = 10, search, status, userId, lessonId, avatarId, voiceId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.HeygenVideoWhereInput = {
      AND: [
        search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
                { inputText: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
                { videoId: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
              ],
            }
          : {},
        status ? { status } : {},
        userId ? { userId } : {},
        lessonId ? { lessonId } : {},
        avatarId ? { avatarId } : {},
        voiceId ? { voiceId } : {},
      ],
    };

    const [videos, total] = await this.prisma.$transaction([
      this.prisma.heygenVideo.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          avatar: {
            select: {
              id: true,
              avatarId: true,
              name: true,
              displayName: true,
              gender: true,
              preview_image: true,
              preview_video: true,
              avatar_style: true,
            }
          },
          voice: {
            select: {
              id: true,
              voiceId: true,
              name: true,
              displayName: true,
              gender: true,
              language: true,
              language_code: true,
              preview_audio: true,
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          lesson: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.heygenVideo.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách video thành công',
      data: {
        data: videos.map((video) => new VideoResponseDto(video)),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  // Lấy video theo id
  async getVideoById(id: number) {
    const video = await this.prisma.heygenVideo.findUnique({ 
      where: { id },
      include: {
        avatar: {
          select: {
            id: true,
            avatarId: true,
            name: true,
            displayName: true,
            gender: true,
            preview_image: true,
            preview_video: true,
            avatar_style: true,
          }
        },
        voice: {
          select: {
            id: true,
            voiceId: true,
            name: true,
            displayName: true,
            gender: true,
            language: true,
            language_code: true,
            preview_audio: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
    if (!video) throw new NotFoundException('Video không tồn tại');
    
    return {
      success: true,
      message: 'Lấy video thành công',
      data: new VideoResponseDto(video),
    };
  }

  // Lấy video theo HeyGen ID
  async getVideoByHeyGenId(videoId: string) {
    const video = await this.prisma.heygenVideo.findUnique({ 
      where: { videoId },
      include: {
        avatar: {
          select: {
            id: true,
            avatarId: true,
            name: true,
            displayName: true,
            gender: true,
            preview_image: true,
            preview_video: true,
            avatar_style: true,
          }
        },
        voice: {
          select: {
            id: true,
            voiceId: true,
            name: true,
            displayName: true,
            gender: true,
            language: true,
            language_code: true,
            preview_audio: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
    if (!video) throw new NotFoundException('Video không tồn tại');
    
    return {
      success: true,
      message: 'Lấy video thành công',
      data: new VideoResponseDto(video),
    };
  }

  // Cập nhật video
  async updateVideo(id: number, dto: UpdateVideoDto) {
    const video = await this.prisma.heygenVideo.findUnique({ 
      where: { id } 
    });
    if (!video) throw new NotFoundException('Video không tồn tại');

    // Check duplicate videoId nếu có update
    if (dto.videoId && dto.videoId !== video.videoId) {
      const existing = await this.prisma.heygenVideo.findUnique({
        where: { videoId: dto.videoId },
      });
      if (existing) throw new BadRequestException('Video ID đã tồn tại');
    }

    // Verify avatar and voice nếu có update
    if (dto.avatarId || dto.voiceId) {
      await this.verifyAvatarAndVoice(
        dto.avatarId || video.avatarId,
        dto.voiceId || video.voiceId
      );
    }

    const updated = await this.prisma.heygenVideo.update({ 
      where: { id }, 
      data: dto 
    });
    
    return {
      success: true,
      message: 'Cập nhật video thành công',
      data: new VideoResponseDto(updated),
    };
  }

  // Xóa video
  async deleteVideo(id: number) {
    const video = await this.prisma.heygenVideo.findUnique({ 
      where: { id } 
    });
    if (!video) throw new NotFoundException('Video không tồn tại');

    await this.prisma.heygenVideo.delete({ where: { id } });
    
    return {
      success: true,
      message: 'Xóa video thành công',
      data: null,
    };
  }

  // Retry video generation với API V2 - ĐÃ SỬA
  async retryVideo(id: number) {
    const video = await this.prisma.heygenVideo.findUnique({ 
      where: { id },
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
      }
    });
    if (!video) throw new NotFoundException('Video không tồn tại');

    if (video.retryCount >= video.maxRetries) {
      throw new BadRequestException('Đã vượt quá số lần thử lại tối đa');
    }

    try {
      // Tạo request payload đúng với V2 API - ĐÃ SỬA
      const requestPayload: IVideoGenerationRequest = {
        video_inputs: [
          {
            character: {
              type: 'avatar' as const,
              avatar_id: video.avatar.avatarId,
              avatar_style: 'normal' // THÊM avatar_style
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
                  play_style: video.backgroundPlayStyle as 'fit_to_scene' | 'freeze' | 'loop' | 'full_video' // ĐỔI TÊN
                })
              }
            })
          }
        ],
        dimension: {
          width: video.dimensionWidth,
          height: video.dimensionHeight,
        },
        test: false,
        // KHÔNG CÓ version field
      };

      // Gọi HeyGen API để retry
      const heygenResponse = await this.heygenApiService.generateVideo(requestPayload);

      // Update video record - SỬA response handling
      const updated = await this.prisma.heygenVideo.update({
        where: { id },
        data: {
          videoId: heygenResponse.video_id, // Dùng trực tiếp
          status: HeygenVideoStatus.PENDING,
          retryCount: video.retryCount + 1,
          lastError: null,
          webhookSecret: this.generateWebhookSecret(),
        },
      });

      return {
        success: true,
        message: 'Đang thử lại tạo video',
        data: new VideoResponseDto(updated),
      };
    } catch (error) {
      throw new InternalServerErrorException(`Lỗi khi thử lại: ${error.message}`);
    }
  }

  // Get video status
  async getVideoStatus(id: number) {
    const video = await this.prisma.heygenVideo.findUnique({ 
      where: { id } 
    });
    if (!video) throw new NotFoundException('Video không tồn tại');

    return {
      success: true,
      message: 'Lấy trạng thái video thành công',
      data: {
        id: video.id,
        videoId: video.videoId,
        status: video.status,
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        errorMessage: video.errorMessage,
        retryCount: video.retryCount,
        maxRetries: video.maxRetries,
        lastError: video.lastError,
        createdAt: video.createdAt,
        updatedAt: video.updatedAt,
        completedAt: video.completedAt,
      },
    };
  }

  // Helper methods
  private async verifyAvatarAndVoice(avatarId: number, voiceId: number): Promise<{
    avatar: { id: number; avatarId: string; name: string };
    voice: { id: number; voiceId: string; name: string };
  }> {
    const [avatar, voice] = await Promise.all([
      this.prisma.heygenAvatar.findUnique({ 
        where: { id: avatarId },
        select: {
          id: true,
          avatarId: true,
          name: true,
        }
      }),
      this.prisma.heygenVoice.findUnique({ 
        where: { id: voiceId },
        select: {
          id: true,
          voiceId: true,
          name: true,
        }
      }),
    ]);

    if (!avatar) throw new BadRequestException('Avatar không tồn tại');
    if (!voice) throw new BadRequestException('Voice không tồn tại');

    return { avatar, voice };
  }

  private generateWebhookSecret(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Đồng bộ status với HeyGen
async syncVideoStatus(id: number) {
  const video = await this.prisma.heygenVideo.findUnique({ 
    where: { id } 
  });
  if (!video) throw new NotFoundException('Video không tồn tại');

  try {
    // Lấy status mới nhất từ HeyGen
    const heygenStatus = await this.heygenApiService.getVideoStatus(video.videoId);
    
    let updateData: any = {
      status: heygenStatus.status.toUpperCase() as HeygenVideoStatus,
    };

    // Nếu video completed, cập nhật thêm thông tin
    if (heygenStatus.status === 'completed') {
      // Lấy shareable URL từ HeyGen
      const shareResponse = await this.heygenApiService.getShareableUrl(video.videoId);
      
      updateData = {
        ...updateData,
        videoUrl: shareResponse.data, // URL từ endpoint share
        status: HeygenVideoStatus.COMPLETED,
        completedAt: new Date(),
      };
    } else if (heygenStatus.status === 'failed') {
      updateData = {
        ...updateData,
        status: HeygenVideoStatus.FAILED,
        errorMessage: heygenStatus.error_message || 'Video generation failed',
      };
    }

    // Cập nhật database
    const updatedVideo = await this.prisma.heygenVideo.update({
      where: { id },
      data: updateData,
    });

    return {
      success: true,
      message: 'Đồng bộ trạng thái thành công',
      data: new VideoResponseDto(updatedVideo),
    };
  } catch (error) {
    throw new InternalServerErrorException(`Lỗi đồng bộ trạng thái: ${error.message}`);
  }
}

// Đồng bộ nhiều videos
async syncPendingVideos() {
  const pendingVideos = await this.prisma.heygenVideo.findMany({
    where: {
      status: HeygenVideoStatus.PENDING,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Trong 24h qua
      },
    },
    take: 50, // Giới hạn số lượng
  });

  // Khai báo type cho results
  const results: Array<{
    videoId: string;
    success: boolean;
    data?: any;
    error?: string;
  }> = [];

  for (const video of pendingVideos) {
    try {
      const result = await this.syncVideoStatus(video.id);
      results.push({ 
        videoId: video.videoId, 
        success: true, 
        data: result 
      });
    } catch (error) {
      results.push({ 
        videoId: video.videoId, 
        success: false, 
        error: error.message 
      });
    }
  }

  return {
    success: true,
    message: `Đã đồng bộ ${results.length} videos`,
    data: results,
  };
}
}