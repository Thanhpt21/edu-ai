import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateAvatarDto } from './dto/create-avatar.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { AvatarResponseDto } from './dto/avatar-response.dto';
import { Prisma } from '@prisma/client';
import { HeyGenApiService } from '../shared/heygen-api.service';

@Injectable()
export class AvatarsService {
   private readonly logger = new Logger(AvatarsService.name) // Thêm logger
  constructor(
    private prisma: PrismaService,
    private heygenApiService: HeyGenApiService, // Thêm HeygenApiService
   
  ) {}


   // Method để sync avatars từ HeyGen
  async syncAvatarsFromHeyGen() {
    try {
      this.logger.log('Bắt đầu sync avatars từ HeyGen API...');
      
      const response = await this.heygenApiService.getAvatars();
      
      this.logger.log('Nhận được data từ HeyGen:', JSON.stringify(response, null, 2));

      const responseData = response as any;
      
      let avatarsData = responseData.data?.avatars || responseData.data || responseData;

      if (responseData.data && Array.isArray(responseData.data)) {
        avatarsData = responseData.data;
      }

      if (Array.isArray(responseData)) {
        avatarsData = responseData;
      }

      if (!Array.isArray(avatarsData)) {
        this.logger.warn('Cấu trúc response không phải array:', typeof avatarsData);
        if (avatarsData && typeof avatarsData === 'object') {
          const keys = Object.keys(avatarsData);
          this.logger.log('Các keys trong response:', keys);
          
          for (const key of keys) {
            if (Array.isArray(avatarsData[key])) {
              avatarsData = avatarsData[key];
              break;
            }
          }
        }
      }

      if (!Array.isArray(avatarsData)) {
        throw new Error(`Dữ liệu avatars không hợp lệ từ HeyGen API. Type: ${typeof avatarsData}`);
      }

      this.logger.log(`Tìm thấy ${avatarsData.length} avatars từ HeyGen`);

      let createdCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      for (const avatarData of avatarsData) {
        try {
          this.logger.debug(`Processing avatar: ${JSON.stringify(avatarData)}`);

          // XÁC ĐỊNH GIÁ TRỊ PREMIUM TỪ API RESPONSE
          const isPremium = avatarData.premium !== undefined ? avatarData.premium : 
                          avatarData.is_premium !== undefined ? avatarData.is_premium : 
                          avatarData.tier === 'premium' ? true : false;

          const avatarPayload = {
            avatarId: avatarData.avatar_id || avatarData.id || avatarData.avatarId,
            name: avatarData.avatar_name || avatarData.name || avatarData.display_name || avatarData.displayName || `Avatar_${avatarData.avatar_id || avatarData.id}`,
            displayName: avatarData.avatar_name || avatarData.display_name || avatarData.displayName || avatarData.name || `Avatar ${avatarData.avatar_id || avatarData.id}`,
            gender: ((avatarData.gender || 'unknown') as string).toLowerCase(),
            preview_image: avatarData.preview_image_url || avatarData.preview_image || avatarData.avatar_url || avatarData.thumbnail_url || avatarData.image_url || '',
            preview_video: avatarData.preview_video_url || avatarData.preview_video || avatarData.video_url || '',
            avatar_style: avatarData.style || avatarData.avatar_style || 'normal',
            is_customized: avatarData.is_customized || false,
            is_instant: avatarData.is_instant !== undefined ? avatarData.is_instant : true,
            // THÊM 2 FIELD MỚI VÀO PAYLOAD
            is_premium: isPremium,
            is_free: !isPremium, // Ngược lại với premium
          };

          if (!avatarPayload.avatarId) {
            this.logger.warn('Skipped avatar missing avatarId:', avatarData);
            skippedCount++;
            continue;
          }

          const existingAvatar = await this.prisma.heygenAvatar.findUnique({
            where: { avatarId: avatarPayload.avatarId }
          });

          if (existingAvatar) {
            await this.prisma.heygenAvatar.update({
              where: { avatarId: avatarPayload.avatarId },
              data: avatarPayload
            });
            updatedCount++;
            this.logger.log(`Updated avatar: ${avatarPayload.avatarId} (Premium: ${isPremium}, Free: ${!isPremium})`);
          } else {
            await this.prisma.heygenAvatar.create({
              data: avatarPayload
            });
            createdCount++;
            this.logger.log(`Created avatar: ${avatarPayload.avatarId} (Premium: ${isPremium}, Free: ${!isPremium})`);
          }
        } catch (avatarError) {
          this.logger.error(`Lỗi xử lý avatar:`, avatarError);
          skippedCount++;
        }
      }

      // THỐNG KÊ PREMIUM/FREE
      const premiumCount = await this.prisma.heygenAvatar.count({
        where: { is_premium: true }
      });
      
      const freeCount = await this.prisma.heygenAvatar.count({
        where: { is_free: true }
      });

      return {
        success: true,
        message: `Sync avatars thành công! Created: ${createdCount}, Updated: ${updatedCount}, Premium: ${premiumCount}, Free: ${freeCount}`,
        data: {
          created: createdCount,
          updated: updatedCount,
          skipped: skippedCount,
          premium: premiumCount,
          free: freeCount,
          total: avatarsData.length
        }
      };

    } catch (error) {
      this.logger.error('Lỗi sync avatars từ HeyGen:', error);
      throw new InternalServerErrorException(`Lỗi sync avatars: ${error.message}`);
    }
  }

  // Method để debug API response - PHIÊN BẢN NÂNG CAO
  async debugHeyGenAvatars() {
    try {
      this.logger.log('Debug HeyGen API...');
      const response = await this.heygenApiService.getAvatars();
      
      // Phân tích cấu trúc response
      const analysis = {
        type: typeof response,
        isArray: Array.isArray(response),
        keys: response ? Object.keys(response) : [],
        dataType: response.data ? typeof response.data : 'no data',
        dataIsArray: Array.isArray(response.data),
        dataKeys: response.data ? Object.keys(response.data) : [],
        fullResponse: response
      };

      return {
        success: true,
        message: 'Debug HeyGen API response',
        analysis: analysis,
        data: response
      };
    } catch (error) {
      this.logger.error('Debug failed:', error);
      return {
        success: false,
        message: 'Debug failed',
        error: error.message,
        response: error.response?.data
      };
    }
  }

  // Tạo avatar
  async createAvatar(dto: CreateAvatarDto) {
    const existing = await this.prisma.heygenAvatar.findUnique({ 
      where: { avatarId: dto.avatarId } 
    });
    if (existing) throw new BadRequestException('Avatar ID đã tồn tại');

    const avatar = await this.prisma.heygenAvatar.create({ 
      data: {
        ...dto,
        avatar_style: dto.avatar_style || 'normal',
        is_customized: dto.is_customized || false,
        is_instant: dto.is_instant || false,
        is_premium: dto.is_premium,
        is_free: dto.is_free,
      }
    });
    
    return {
      success: true,
      message: 'Tạo avatar thành công',
      data: new AvatarResponseDto(avatar),
    };
  }

  // Lấy danh sách avatar miễn phí
async getFreeAvatars(page = 1, limit = 10, search = '') {
  const skip = (page - 1) * limit;

  const where: Prisma.HeygenAvatarWhereInput = {
    is_free: true,
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
        { displayName: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
      ],
    }),
  };

  const [avatars, total] = await this.prisma.$transaction([
    this.prisma.heygenAvatar.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    this.prisma.heygenAvatar.count({ where }),
  ]);

  return {
    success: true,
    message: 'Lấy danh sách avatar miễn phí thành công',
    data: {
      data: avatars.map((avatar) => new AvatarResponseDto(avatar)),
      total,
      page,
      pageCount: Math.ceil(total / limit),
    },
  };
}

// Lấy danh sách avatar premium
async getPremiumAvatars(page = 1, limit = 10, search = '') {
  const skip = (page - 1) * limit;

  const where: Prisma.HeygenAvatarWhereInput = {
    is_premium: true,
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
        { displayName: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
      ],
    }),
  };

  const [avatars, total] = await this.prisma.$transaction([
    this.prisma.heygenAvatar.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    this.prisma.heygenAvatar.count({ where }),
  ]);

  return {
    success: true,
    message: 'Lấy danh sách avatar premium thành công',
    data: {
      data: avatars.map((avatar) => new AvatarResponseDto(avatar)),
      total,
      page,
      pageCount: Math.ceil(total / limit),
    },
  };
}

// Lấy tất cả avatar miễn phí (không phân trang)
async getAllFreeAvatars(search = '') {
  const where: Prisma.HeygenAvatarWhereInput = {
    is_free: true,
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
        { displayName: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
      ],
    }),
  };

  const avatars = await this.prisma.heygenAvatar.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  return {
    success: true,
    message: 'Lấy tất cả avatar miễn phí thành công',
    data: avatars.map((avatar) => new AvatarResponseDto(avatar)),
  };
}
  // Lấy danh sách avatar (có phân trang + search)
  async getAvatars(page = 1, limit = 10, search = '') {
    const skip = (page - 1) * limit;

    const where: Prisma.HeygenAvatarWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
            { displayName: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
          ],
        }
      : {};

    const [avatars, total] = await this.prisma.$transaction([
      this.prisma.heygenAvatar.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.heygenAvatar.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách avatar thành công',
      data: {
        data: avatars.map((avatar) => new AvatarResponseDto(avatar)),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  // Lấy tất cả avatar (không phân trang)
  async getAllAvatars(search = '') {
    const where: Prisma.HeygenAvatarWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
            { displayName: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
          ],
        }
      : {};

    const avatars = await this.prisma.heygenAvatar.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return {
      success: true,
      message: 'Lấy tất cả avatar thành công',
      data: avatars.map((avatar) => new AvatarResponseDto(avatar)),
    };
  }

  // Lấy avatar theo id
  async getAvatarById(id: number) {
    const avatar = await this.prisma.heygenAvatar.findUnique({ 
      where: { id } 
    });
    if (!avatar) throw new NotFoundException('Avatar không tồn tại');
    
    return {
      success: true,
      message: 'Lấy avatar thành công',
      data: new AvatarResponseDto(avatar),
    };
  }

  // Cập nhật avatar
  async updateAvatar(id: number, dto: UpdateAvatarDto) {
    const avatar = await this.prisma.heygenAvatar.findUnique({ 
      where: { id } 
    });
    if (!avatar) throw new NotFoundException('Avatar không tồn tại');

    // Check duplicate avatarId nếu có update
    if (dto.avatarId && dto.avatarId !== avatar.avatarId) {
      const existing = await this.prisma.heygenAvatar.findUnique({
        where: { avatarId: dto.avatarId },
      });
      if (existing) throw new BadRequestException('Avatar ID đã tồn tại');
    }

    const updated = await this.prisma.heygenAvatar.update({ 
      where: { id }, 
      data: dto 
    });
    
    return {
      success: true,
      message: 'Cập nhật avatar thành công',
      data: new AvatarResponseDto(updated),
    };
  }

  // Xóa avatar
  async deleteAvatar(id: number) {
    const avatar = await this.prisma.heygenAvatar.findUnique({ 
      where: { id } 
    });
    if (!avatar) throw new NotFoundException('Avatar không tồn tại');

    // Check if avatar is being used in videos
    const videoCount = await this.prisma.heygenVideo.count({
      where: { avatarId: id },
    });

    if (videoCount > 0) {
      throw new BadRequestException('Không thể xóa avatar đang được sử dụng trong video');
    }

    await this.prisma.heygenAvatar.delete({ where: { id } });
    
    return {
      success: true,
      message: 'Xóa avatar thành công',
      data: null,
    };
  }
}