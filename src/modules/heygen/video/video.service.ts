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
import { UploadService } from 'src/modules/upload/upload.service';

@Injectable()
export class VideosService {
  constructor(
    private uploadService: UploadService,
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
          caption: {
            enabled: true,
            style: {
              font_family: 'Arial',
              font_size: 24,
              color: '#FFFFFF',
              background_color: '#00000080',
              position: 'bottom', // 'top' | 'middle' | 'bottom'
              alignment: 'center' // 'left' | 'center' | 'right'
            }
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
      userId ? { userId: Number(userId) } : {}, // CHUYỂN SANG NUMBER
      lessonId ? { lessonId: Number(lessonId) } : {}, // CHUYỂN SANG NUMBER
      avatarId ? { avatarId: Number(avatarId) } : {}, // CHUYỂN SANG NUMBER
      voiceId ? { voiceId: Number(voiceId) } : {}, // CHUYỂN SANG NUMBER
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

// Đồng bộ nhiều videos
// Trong videos.service.ts
async syncPendingVideos() {
  console.log(`🔍 [SYNC] Bắt đầu đồng bộ video đang chờ...`);
  
  // ĐỒNG BỘ CẢ PENDING VÀ PROCESSING
  const videosToSync = await this.prisma.heygenVideo.findMany({
    where: {
      status: {
        in: [HeygenVideoStatus.PENDING, HeygenVideoStatus.PROCESSING] // THÊM PROCESSING
      },
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
    take: 50,
  });

  console.log(`🔍 [SYNC] Tìm thấy ${videosToSync.length} video cần đồng bộ:`, 
    videosToSync.map(v => ({ id: v.id, videoId: v.videoId, status: v.status }))
  );

  const results: Array<{
    videoId: string;
    success: boolean;
    data?: any;
    error?: string;
  }> = [];

  for (const video of videosToSync) {
    try {
      console.log(`🔄 [SYNC] Đang đồng bộ video ${video.videoId} (${video.status})...`);
      const result = await this.syncVideoStatus(video.id);
      results.push({ 
        videoId: video.videoId, 
        success: true, 
        data: result 
      });
      console.log(`✅ [SYNC] Đồng bộ video ${video.videoId} thành công`);
    } catch (error) {
      console.error(`❌ [SYNC] Lỗi đồng bộ video ${video.videoId}:`, error);
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

async downloadAndSaveVideoToSupabase(videoId: string, videoUrl?: string): Promise<{ success: boolean; supabaseUrl?: string; error?: string }> {
  console.log(`🚀 [downloadAndSaveVideoToSupabase] BẮT ĐẦU với videoId: ${videoId}`);
  
  try {
    console.log(`🔍 [1/6] Tìm video trong database...`);
    const video = await this.prisma.heygenVideo.findUnique({
      where: { videoId },
    });

    if (!video) {
      throw new Error('Video not found in database');
    }

    // 🎯 ƯU TIÊN URL TRUYỀN VÀO, NẾU KHÔNG CÓ THÌ LẤY TỪ DATABASE
    const downloadUrl = videoUrl || video.videoUrl;
    console.log(`📥 [2/6] URL để download: ${downloadUrl}`);

    if (!downloadUrl) {
      throw new Error('No video URL provided');
    }

    if (!this.isValidDownloadableUrl(downloadUrl)) {
      throw new Error('Invalid downloadable URL');
    }

    console.log(`✅ [2/6] Downloadable URL hợp lệ`);

    // DOWNLOAD VÀ UPLOAD LÊN SUPABASE
    console.log(`🚀 [3/6] Download và upload lên Supabase...`);
    const supabaseVideoUrl = await this.uploadService.autoUploadHeygenVideo(
      downloadUrl,
      videoId,
      video.lessonId
    );

    console.log(`✅ [4/6] Upload thành công: ${supabaseVideoUrl}`);

    // KIỂM TRA SUPABASE URL
    if (!supabaseVideoUrl || !supabaseVideoUrl.includes('supabase')) {
      throw new Error('Invalid Supabase URL returned');
    }

    console.log(`🎉 [5/6] Download và upload hoàn tất!`);
    return {
      success: true,
      supabaseUrl: supabaseVideoUrl,
    };

  } catch (error) {
    console.error(`💥 [downloadAndSaveVideoToSupabase] LỖI:`, error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// CẬP NHẬT METHOD syncVideoStatus để tự động download khi video hoàn thành
async syncVideoStatus(id: number) {
  const video = await this.prisma.heygenVideo.findUnique({ 
    where: { id } 
  });
  if (!video) throw new NotFoundException('Video không tồn tại');
  
  console.log(`🔍 [SYNC STATUS] Bắt đầu sync video:`, {
    id: video.id,
    videoId: video.videoId,
    currentStatus: video.status,
    currentVideoUrl: video.videoUrl
  });

  try {
    const heygenStatus = await this.heygenApiService.getVideoStatus(video.videoId);

    console.log(`🔍 [SYNC STATUS] Heygen trả về:`, {
      videoId: video.videoId,
      status: heygenStatus.status,
      video_url: heygenStatus.video_url ? 'CÓ' : 'KHÔNG',
      duration: heygenStatus.duration
    });

    // 🎯 KHỞI TẠO UPDATE DATA CƠ BẢN
    let updateData: any = {
      status: heygenStatus.status.toUpperCase() as HeygenVideoStatus,
    };

    if (heygenStatus.status === 'completed') {
      console.log(`🎉 [SYNC STATUS] Video ${video.videoId} đã hoàn thành!`);
      
      // 🎯 LẤY DOWNLOADABLE URL TỪ HEYGEN
      const videoUrl = heygenStatus.video_url;
      
      console.log(`🔗 [SYNC STATUS] Downloadable URL từ HeyGen: ${videoUrl}`);

      // 🚨 QUAN TRỌNG: CẬP NHẬT DATABASE VỚI URL MỚI TRƯỚC KHI DOWNLOAD
      console.log(`💾 [SYNC STATUS] Cập nhật database với URL mới...`);
      await this.prisma.heygenVideo.update({
        where: { id },
        data: {
          videoUrl: videoUrl,
          status: HeygenVideoStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      console.log(`✅ [SYNC STATUS] Đã cập nhật database với URL mới`);

      // 🎯 DOWNLOAD NẾU CÓ DOWNLOADABLE URL
      if (videoUrl && this.isValidDownloadableUrl(videoUrl)) {
        console.log(`🚀 [SYNC STATUS] Có downloadable URL, bắt đầu download...`);
        try {
          // 🎯 TRUYỀN URL MỚI TRỰC TIẾP VÀO downloadAndSaveVideoToSupabase
          const downloadResult = await this.downloadAndSaveVideoToSupabase(video.videoId, videoUrl);
          
          if (downloadResult.success) {
            console.log(`✅ [SYNC STATUS] Đã lưu video lên Supabase: ${downloadResult.supabaseUrl}`);
            
            // 🎯 CẬP NHẬT SUPABASE URL VÀ TRẠNG THÁI DOWNLOAD
            await this.prisma.heygenVideo.update({
              where: { id },
              data: {
                supabaseVideoUrl: downloadResult.supabaseUrl,
                isDownloaded: true,
                downloadedAt: new Date(),
                lastError: null, // 🎯 XÓA LỖI CŨ
              },
            });
            
            console.log(`🎉 [SYNC STATUS] Download và upload hoàn tất!`);
          } else {
            console.log(`❌ [SYNC STATUS] Lỗi download: ${downloadResult.error}`);
            await this.prisma.heygenVideo.update({
              where: { id },
              data: {
                lastError: downloadResult.error,
              },
            });
          }
        } catch (downloadError) {
          console.error('⚠️ [SYNC STATUS] Không thể download video:', downloadError);
          await this.prisma.heygenVideo.update({
            where: { id },
            data: {
              lastError: downloadError.error,
            },
          });
        }
      } else {
        console.log(`❌ [SYNC STATUS] Không có downloadable URL từ HeyGen`);
        await this.prisma.heygenVideo.update({
          where: { id },
          data: {
            lastError: 'No downloadable URL from HeyGen',
          },
        });
      }

    } else if (heygenStatus.status === 'failed') {
      console.log(`💥 [SYNC STATUS] Video failed: ${heygenStatus.error_message}`);
      updateData = {
        ...updateData,
        status: HeygenVideoStatus.FAILED,
        errorMessage: heygenStatus.error_message || 'Video generation failed',
        lastError: heygenStatus.error_message || 'Video generation failed',
      };

      // 🎯 CẬP NHẬT DATABASE CHO TRƯỜNG HỢP FAILED
      await this.prisma.heygenVideo.update({
        where: { id },
        data: updateData,
      });
    } else {
      // 🎯 CẬP NHẬT CHO CÁC TRẠNG THÁI KHÁC (pending, processing, etc.)
      await this.prisma.heygenVideo.update({
        where: { id },
        data: updateData,
      });
    }

    // 🎯 LẤY LẠI VIDEO ĐÃ CẬP NHẬT ĐỂ TRẢ VỀ
    const updatedVideo = await this.prisma.heygenVideo.findUnique({
      where: { id },
    });

    // 🎯 KIỂM TRA updatedVideo CÓ TỒN TẠI KHÔNG
    if (!updatedVideo) {
      throw new NotFoundException('Video không tồn tại sau khi cập nhật');
    }

    console.log(`✅ [SYNC STATUS] Sync hoàn thành!`);
    return {
      success: true,
      message: 'Đồng bộ trạng thái thành công',
      data: new VideoResponseDto(updatedVideo),
    };
  } catch (error) {
    console.error(`❌ [SYNC STATUS] Lỗi đồng bộ trạng thái:`, error);
    
    // 🎯 CẬP NHẬT LỖI VÀO DATABASE
    try {
      await this.prisma.heygenVideo.update({
        where: { id },
        data: {
          lastError: error.message,
          retryCount: { increment: 1 }
        }
      });
    } catch (dbError) {
      console.error(`❌ Không thể cập nhật lỗi:`, dbError.message);
    }
    
    throw new InternalServerErrorException(`Lỗi đồng bộ trạng thái: ${error.message}`);
  }
}

private isValidDownloadableUrl(url: string): boolean {
  if (!url) {
    console.log(`❌ [isValidDownloadableUrl] URL rỗng`);
    return false;
  }
  
  // 🎯 KIỂM TRA URL CÓ PHẢI LÀ DOWNLOADABLE URL THẬT
  const isValid = url.includes('.mp4') && 
                 url.includes('heygen.ai') && // 🎯 Domain thật từ HeyGen
                 url.includes('Expires=') &&   // 🎯 Có expiration
                 url.includes('Signature=');   // 🎯 Có signature
  
  console.log(`🔍 [isValidDownloadableUrl] "${url.substring(0, 100)}..." -> ${isValid}`);
  return isValid;
}
  // THÊM METHOD: Manual download video (cho trường hợp muốn download lại)
  async manualDownloadVideo(id: number) {
    const video = await this.prisma.heygenVideo.findUnique({
      where: { id },
    });

    if (!video) throw new NotFoundException('Video không tồn tại');

    if (video.status !== HeygenVideoStatus.COMPLETED) {
      throw new BadRequestException('Chỉ có thể download video đã hoàn thành');
    }

    if (video.isDownloaded && video.supabaseVideoUrl) {
      return {
        success: true,
        message: 'Video đã được download trước đó',
        data: {
          supabaseUrl: video.supabaseVideoUrl,
        },
      };
    }

    const result = await this.downloadAndSaveVideoToSupabase(video.videoId);

    if (result.success) {
      return {
        success: true,
        message: 'Download video thành công',
        data: {
          supabaseUrl: result.supabaseUrl,
        },
      };
    } else {
      throw new InternalServerErrorException(`Lỗi download video: ${result.error}`);
    }
  }

  // THÊM METHOD: Lấy video đã download từ Supabase
  async getDownloadedVideos(query: VideoQueryDto) {
    const { page = 1, limit = 10, search, status, userId, lessonId, avatarId, voiceId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.HeygenVideoWhereInput = {
      AND: [
        { isDownloaded: true }, // CHỈ LẤY VIDEO ĐÃ DOWNLOAD
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
        orderBy: { downloadedAt: 'desc' }, // SẮP XẾP THEO THỜI GIAN DOWNLOAD
      }),
      this.prisma.heygenVideo.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách video đã download thành công',
      data: {
        data: videos.map((video) => new VideoResponseDto(video)),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  // THÊM METHOD: Đồng bộ và download tất cả video completed chưa download
  async syncAndDownloadAllCompleted() {
    const completedVideos = await this.prisma.heygenVideo.findMany({
      where: {
        status: HeygenVideoStatus.COMPLETED,
        isDownloaded: false,
        videoUrl: { not: null },
      },
      take: 20, // Giới hạn số lượng để tránh quá tải
    });

    const results: Array<{
      videoId: string;
      success: boolean;
      supabaseUrl?: string;
      error?: string;
    }> = [];

    for (const video of completedVideos) {
      try {
        const result = await this.downloadAndSaveVideoToSupabase(video.videoId);
        results.push({
          videoId: video.videoId,
          success: result.success,
          supabaseUrl: result.supabaseUrl,
          error: result.error,
        });
      } catch (error) {
        results.push({
          videoId: video.videoId,
          success: false,
          error: error.message,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    return {
      success: true,
      message: `Đã xử lý ${results.length} video: ${successCount} thành công, ${failedCount} thất bại`,
      data: results,
    };
  }
}