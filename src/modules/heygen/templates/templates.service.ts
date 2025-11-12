import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { TemplateResponseDto } from './dto/template-response.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  // Tạo template
  async createTemplate(dto: CreateTemplateDto, userId: number) {
    // Verify avatar and voice exist
    await this.verifyAvatarAndVoice(dto.avatarId, dto.voiceId);

    const template = await this.prisma.heygenTemplate.create({ 
      data: {
        ...dto,
        createdBy: userId,
        isPublic: dto.isPublic || false,
        usageCount: 0,
      }
    });
    
    return {
      success: true,
      message: 'Tạo template thành công',
      data: new TemplateResponseDto(template),
    };
  }

  // Lấy danh sách template (có phân trang + search + filter)
  async getTemplates(page = 1, limit = 10, search = '', isPublic = '') {
    const skip = (page - 1) * limit;

    const where: Prisma.HeygenTemplateWhereInput = {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
                { description: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
              ],
            }
          : {},
        isPublic !== '' ? { isPublic: isPublic === 'true' } : {},
      ],
    };

    const [templates, total] = await this.prisma.$transaction([
      this.prisma.heygenTemplate.findMany({
        where,
        skip,
        take: limit,
        include: {
          avatar: {
            select: {
              id: true,
              avatarId: true,
              name: true,
              displayName: true,
            }
          },
          voice: {
            select: {
              id: true,
              voiceId: true,
              name: true,
              displayName: true,
            }
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.heygenTemplate.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách template thành công',
      data: {
        data: templates.map((template) => new TemplateResponseDto(template)),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  // Lấy template public (không cần auth)
  async getPublicTemplates(page = 1, limit = 10, search = '') {
    const skip = (page - 1) * limit;

    const where: Prisma.HeygenTemplateWhereInput = {
      isPublic: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
          { description: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
        ],
      }),
    };

    const [templates, total] = await this.prisma.$transaction([
      this.prisma.heygenTemplate.findMany({
        where,
        skip,
        take: limit,
        include: {
          avatar: {
            select: {
              id: true,
              avatarId: true,
              name: true,
              displayName: true,
            }
          },
          voice: {
            select: {
              id: true,
              voiceId: true,
              name: true,
              displayName: true,
            }
          },
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { usageCount: 'desc' },
      }),
      this.prisma.heygenTemplate.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách template public thành công',
      data: {
        data: templates.map((template) => new TemplateResponseDto(template)),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  // Lấy template theo id
  async getTemplateById(id: number) {
    const template = await this.prisma.heygenTemplate.findUnique({ 
      where: { id },
      include: {
        avatar: {
          select: {
            id: true,
            avatarId: true,
            name: true,
            displayName: true,
            preview_image: true,
          }
        },
        voice: {
          select: {
            id: true,
            voiceId: true,
            name: true,
            displayName: true,
            preview_audio: true,
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    if (!template) throw new NotFoundException('Template không tồn tại');
    
    return {
      success: true,
      message: 'Lấy template thành công',
      data: new TemplateResponseDto(template),
    };
  }

  // Cập nhật template
  async updateTemplate(id: number, dto: UpdateTemplateDto) {
    const template = await this.prisma.heygenTemplate.findUnique({ 
      where: { id } 
    });
    if (!template) throw new NotFoundException('Template không tồn tại');

    // Verify avatar and voice nếu có update
    if (dto.avatarId || dto.voiceId) {
      await this.verifyAvatarAndVoice(
        dto.avatarId || template.avatarId,
        dto.voiceId || template.voiceId
      );
    }

    const updated = await this.prisma.heygenTemplate.update({ 
      where: { id }, 
      data: dto 
    });
    
    return {
      success: true,
      message: 'Cập nhật template thành công',
      data: new TemplateResponseDto(updated),
    };
  }

  // Xóa template
  async deleteTemplate(id: number) {
    const template = await this.prisma.heygenTemplate.findUnique({ 
      where: { id } 
    });
    if (!template) throw new NotFoundException('Template không tồn tại');

    await this.prisma.heygenTemplate.delete({ where: { id } });
    
    return {
      success: true,
      message: 'Xóa template thành công',
      data: null,
    };
  }

  // Tăng usage count
  async incrementUsageCount(id: number) {
    const template = await this.prisma.heygenTemplate.findUnique({ 
      where: { id } 
    });
    if (!template) throw new NotFoundException('Template không tồn tại');

    const updated = await this.prisma.heygenTemplate.update({
      where: { id },
      data: {
        usageCount: template.usageCount + 1,
      },
    });

    return {
      success: true,
      message: 'Template usage count updated',
      data: new TemplateResponseDto(updated),
    };
  }

  // Clone template
  async cloneTemplate(id: number, userId: number) {
    const template = await this.prisma.heygenTemplate.findUnique({ 
      where: { id } 
    });
    if (!template) throw new NotFoundException('Template không tồn tại');

    // Tạo template mới từ template gốc
    const clonedTemplate = await this.prisma.heygenTemplate.create({
      data: {
        name: `${template.name} (Copy)`,
        description: template.description,
        avatarId: template.avatarId,
        voiceId: template.voiceId,
        backgroundType: template.backgroundType,
        backgroundColor: template.backgroundColor,
        backgroundUrl: template.backgroundUrl,
        backgroundPlayStyle: template.backgroundPlayStyle,
        inputText: template.inputText,
        isPublic: false, // Clone template luôn là private
        createdBy: userId,
        usageCount: 0,
      },
    });

    return {
      success: true,
      message: 'Clone template thành công',
      data: new TemplateResponseDto(clonedTemplate),
    };
  }

  // Helper methods
  private async verifyAvatarAndVoice(avatarId: number, voiceId: number) {
    const [avatar, voice] = await Promise.all([
      this.prisma.heygenAvatar.findUnique({ 
        where: { id: avatarId },
        select: { id: true }
      }),
      this.prisma.heygenVoice.findUnique({ 
        where: { id: voiceId },
        select: { id: true }
      }),
    ]);

    if (!avatar) throw new BadRequestException('Avatar không tồn tại');
    if (!voice) throw new BadRequestException('Voice không tồn tại');

    return [avatar, voice];
  }
}