import { Injectable, NotFoundException, BadRequestException, Logger, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateVoiceDto } from './dto/create-voice.dto';
import { UpdateVoiceDto } from './dto/update-voice.dto';
import { VoiceResponseDto } from './dto/voice-response.dto';
import { Prisma } from '@prisma/client';
import { HeyGenApiService } from '../shared/heygen-api.service';

@Injectable()
export class VoicesService {
   private readonly logger = new Logger(VoicesService.name);
  constructor(
    private prisma: PrismaService,
    private heygenApiService: HeyGenApiService,
  ) {}


   // Method để sync voices từ HeyGen
  async syncVoicesFromHeyGen() {
  try {
    this.logger.log('Bắt đầu sync voices từ HeyGen API...');
    
    const response = await this.heygenApiService.getVoices();
    
    this.logger.log('Nhận được data từ HeyGen:', JSON.stringify(response, null, 2));

    const responseData = response as any;
    let voicesData = responseData.data?.voices || responseData.data || responseData;

    if (responseData.data && Array.isArray(responseData.data)) {
      voicesData = responseData.data;
    }
    if (Array.isArray(responseData)) {
      voicesData = responseData;
    }
    if (!Array.isArray(voicesData)) {
      for (const key of Object.keys(voicesData)) {
        if (Array.isArray(voicesData[key])) {
          voicesData = voicesData[key];
          break;
        }
      }
    }

    if (!Array.isArray(voicesData)) {
      throw new Error(`Dữ liệu voices không hợp lệ từ HeyGen API. Type: ${typeof voicesData}`);
    }

    this.logger.log(`Tìm thấy ${voicesData.length} voices từ HeyGen`);

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const voiceData of voicesData) {
      try {
        // XÁC ĐỊNH GIÁ TRỊ PREMIUM TỪ API RESPONSE
        const isPremium = voiceData.premium !== undefined ? voiceData.premium : 
                         voiceData.is_premium !== undefined ? voiceData.is_premium :
                         voiceData.tier === 'premium' || voiceData.tier === 'pro' ? true :
                         voiceData.available_for_free === false ? true : false;

        const tier = voiceData.tier || (isPremium ? 'premium' : 'free');

        // Map fields từ HeyGen response sang database schema
        const voicePayload = {
          voiceId: voiceData.voice_id || voiceData.id || voiceData.voiceId,
          name: voiceData.voice_name || voiceData.name || voiceData.display_name || voiceData.displayName || `Voice_${voiceData.voice_id || voiceData.id}`,
          displayName: voiceData.voice_name || voiceData.display_name || voiceData.displayName || voiceData.name || `Voice ${voiceData.voice_id || voiceData.id}`,
          gender: ((voiceData.gender || 'unknown') as string).toLowerCase(),
          language: voiceData.language || 'English',
          language_code: voiceData.language_code || voiceData.languageCode || 'en-US',
          preview_audio: voiceData.preview_audio_url || voiceData.preview_audio || voiceData.audio_url || '',
          is_customized: voiceData.is_customized || false,
          // THÊM FIELD MỚI
          is_premium: isPremium,
          is_free: !isPremium,
          tier: tier,
        };

        // Validate required fields
        if (!voicePayload.voiceId) {
          this.logger.warn('Skipped voice missing voiceId:', voiceData);
          skippedCount++;
          continue;
        }

        // Check if voice already exists
        const existingVoice = await this.prisma.heygenVoice.findUnique({
          where: { voiceId: voicePayload.voiceId }
        });

        if (existingVoice) {
          await this.prisma.heygenVoice.update({
            where: { voiceId: voicePayload.voiceId },
            data: voicePayload
          });
          updatedCount++;
          this.logger.log(`Updated voice: ${voicePayload.voiceId} (Premium: ${isPremium}, Free: ${!isPremium})`);
        } else {
          await this.prisma.heygenVoice.create({
            data: voicePayload
          });
          createdCount++;
          this.logger.log(`Created voice: ${voicePayload.voiceId} (Premium: ${isPremium}, Free: ${!isPremium})`);
        }
      } catch (voiceError) {
        this.logger.error(`Lỗi xử lý voice:`, voiceError);
        skippedCount++;
      }
    }

    // THỐNG KÊ PREMIUM/FREE
    const premiumCount = await this.prisma.heygenVoice.count({
      where: { is_premium: true }
    });
    
    const freeCount = await this.prisma.heygenVoice.count({
      where: { is_free: true }
    });

    return {
      success: true,
      message: `Sync voices thành công! Created: ${createdCount}, Updated: ${updatedCount}, Premium: ${premiumCount}, Free: ${freeCount}`,
      data: {
        created: createdCount,
        updated: updatedCount,
        skipped: skippedCount,
        premium: premiumCount,
        free: freeCount,
        total: voicesData.length
      }
    };

  } catch (error) {
    this.logger.error('Lỗi sync voices từ HeyGen:', error);
    throw new InternalServerErrorException(`Lỗi sync voices: ${error.message}`);
  }
}

  // Method để debug voices API
  async debugHeyGenVoices() {
    try {
      this.logger.log('Debug HeyGen Voices API...');
      const response = await this.heygenApiService.getVoices();
      
      return {
        success: true,
        message: 'Debug HeyGen Voices API response',
        data: {
          responseType: typeof response,
          isArray: Array.isArray(response),
          responseKeys: response ? Object.keys(response) : ['no keys'],
          rawResponse: response
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Debug voices failed',
        error: error.message,
        stack: error.stack
      };
    }
  }

  // Lấy danh sách voice miễn phí
async getFreeVoices(page = 1, limit = 10, search = '', language = '') {
  const skip = (page - 1) * limit;

  const where: Prisma.HeygenVoiceWhereInput = {
    is_free: true,
    AND: [
      search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
              { displayName: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
            ],
          }
        : {},
      language ? { language: { contains: language, mode: 'insensitive' as Prisma.QueryMode } } : {},
    ],
  };

  const [voices, total] = await this.prisma.$transaction([
    this.prisma.heygenVoice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    this.prisma.heygenVoice.count({ where }),
  ]);

  return {
    success: true,
    message: 'Lấy danh sách voice miễn phí thành công',
    data: {
      data: voices.map((voice) => new VoiceResponseDto(voice)),
      total,
      page,
      pageCount: Math.ceil(total / limit),
    },
  };
}

// Lấy danh sách voice premium
async getPremiumVoices(page = 1, limit = 10, search = '', language = '') {
  const skip = (page - 1) * limit;

  const where: Prisma.HeygenVoiceWhereInput = {
    is_premium: true,
    AND: [
      search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
              { displayName: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
            ],
          }
        : {},
      language ? { language: { contains: language, mode: 'insensitive' as Prisma.QueryMode } } : {},
    ],
  };

  const [voices, total] = await this.prisma.$transaction([
    this.prisma.heygenVoice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    this.prisma.heygenVoice.count({ where }),
  ]);

  return {
    success: true,
    message: 'Lấy danh sách voice premium thành công',
    data: {
      data: voices.map((voice) => new VoiceResponseDto(voice)),
      total,
      page,
      pageCount: Math.ceil(total / limit),
    },
  };
}

// Lấy tất cả voice miễn phí (không phân trang)
async getAllFreeVoices(search = '', language = '') {
  const where: Prisma.HeygenVoiceWhereInput = {
    is_free: true,
    AND: [
      search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
              { displayName: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
            ],
          }
        : {},
      language ? { language: { contains: language, mode: 'insensitive' as Prisma.QueryMode } } : {},
    ],
  };

  const voices = await this.prisma.heygenVoice.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  return {
    success: true,
    message: 'Lấy tất cả voice miễn phí thành công',
    data: voices.map((voice) => new VoiceResponseDto(voice)),
  };
}

// Lấy voice theo language và premium status
async getVoicesByLanguageAndTier(language: string, isPremium = false) {
  const where: Prisma.HeygenVoiceWhereInput = {
    language: { contains: language, mode: 'insensitive' as Prisma.QueryMode },
    is_premium: isPremium,
  };

  const voices = await this.prisma.heygenVoice.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  return {
    success: true,
    message: `Lấy ${isPremium ? 'premium' : 'free'} voices cho ngôn ngữ ${language} thành công`,
    data: voices.map((voice) => new VoiceResponseDto(voice)),
  };
}


  // Tạo voice
  async createVoice(dto: CreateVoiceDto) {
    const existing = await this.prisma.heygenVoice.findUnique({ 
      where: { voiceId: dto.voiceId } 
    });
    if (existing) throw new BadRequestException('Voice ID đã tồn tại');

    const voice = await this.prisma.heygenVoice.create({ 
      data: {
        ...dto,
        is_customized: dto.is_customized || false,
        is_premium: dto.is_premium,
        is_free: dto.is_free,
        tier: dto.tier,
      }
    });
    
    return {
      success: true,
      message: 'Tạo voice thành công',
      data: new VoiceResponseDto(voice),
    };
  }

  // Lấy danh sách voice (có phân trang + search + filter by language)
  async getVoices(page = 1, limit = 10, search = '', language = '') {
    const skip = (page - 1) * limit;

    const where: Prisma.HeygenVoiceWhereInput = {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
                { displayName: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
              ],
            }
          : {},
        language ? { language: { contains: language, mode: 'insensitive' as Prisma.QueryMode } } : {},
      ],
    };

    const [voices, total] = await this.prisma.$transaction([
      this.prisma.heygenVoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.heygenVoice.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách voice thành công',
      data: {
        data: voices.map((voice) => new VoiceResponseDto(voice)),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  // Lấy tất cả voice (không phân trang)
  async getAllVoices(search = '', language = '') {
    const where: Prisma.HeygenVoiceWhereInput = {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
                { displayName: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
              ],
            }
          : {},
        language ? { language: { contains: language, mode: 'insensitive' as Prisma.QueryMode } } : {},
      ],
    };

    const voices = await this.prisma.heygenVoice.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return {
      success: true,
      message: 'Lấy tất cả voice thành công',
      data: voices.map((voice) => new VoiceResponseDto(voice)),
    };
  }

  // Lấy voice theo id
  async getVoiceById(id: number) {
    const voice = await this.prisma.heygenVoice.findUnique({ 
      where: { id } 
    });
    if (!voice) throw new NotFoundException('Voice không tồn tại');
    
    return {
      success: true,
      message: 'Lấy voice thành công',
      data: new VoiceResponseDto(voice),
    };
  }

  // Cập nhật voice
  async updateVoice(id: number, dto: UpdateVoiceDto) {
    const voice = await this.prisma.heygenVoice.findUnique({ 
      where: { id } 
    });
    if (!voice) throw new NotFoundException('Voice không tồn tại');

    // Check duplicate voiceId nếu có update
    if (dto.voiceId && dto.voiceId !== voice.voiceId) {
      const existing = await this.prisma.heygenVoice.findUnique({
        where: { voiceId: dto.voiceId },
      });
      if (existing) throw new BadRequestException('Voice ID đã tồn tại');
    }

    const updated = await this.prisma.heygenVoice.update({ 
      where: { id }, 
      data: dto 
    });
    
    return {
      success: true,
      message: 'Cập nhật voice thành công',
      data: new VoiceResponseDto(updated),
    };
  }

  // Xóa voice
  async deleteVoice(id: number) {
    const voice = await this.prisma.heygenVoice.findUnique({ 
      where: { id } 
    });
    if (!voice) throw new NotFoundException('Voice không tồn tại');

    // Check if voice is being used in videos
    const videoCount = await this.prisma.heygenVideo.count({
      where: { voiceId: id },
    });

    if (videoCount > 0) {
      throw new BadRequestException('Không thể xóa voice đang được sử dụng trong video');
    }

    await this.prisma.heygenVoice.delete({ where: { id } });
    
    return {
      success: true,
      message: 'Xóa voice thành công',
      data: null,
    };
  }

  // Lấy danh sách languages có sẵn
  async getAvailableLanguages() {
    const languages = await this.prisma.heygenVoice.findMany({
      distinct: ['language'],
      where: {
        language: { not: null },
      },
      select: {
        language: true,
      },
      orderBy: {
        language: 'asc',
      },
    });

    const languageList = languages
      .map((item) => item.language)
      .filter((lang): lang is string => lang !== null);

    return {
      success: true,
      message: 'Lấy danh sách languages thành công',
      data: languageList,
    };
  }
}