import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { AssetResponseDto } from './dto/asset-response.dto';
import { Prisma, HeygenAssetType } from '@prisma/client';

@Injectable()
export class AssetsService {
  constructor(private prisma: PrismaService) {}

  // Tạo asset
  async createAsset(dto: CreateAssetDto, userId: number) {
    const existing = await this.prisma.heygenAsset.findUnique({ 
      where: { assetId: dto.assetId } 
    });
    if (existing) throw new BadRequestException('Asset ID đã tồn tại');

    const asset = await this.prisma.heygenAsset.create({ 
      data: {
        ...dto,
        uploadedBy: userId,
      }
    });
    
    return {
      success: true,
      message: 'Tạo asset thành công',
      data: new AssetResponseDto(asset),
    };
  }

  // Lấy danh sách asset (có phân trang + search + filter by assetType)
  async getAssets(page = 1, limit = 10, search = '', assetType = '') {
    const skip = (page - 1) * limit;

    const where: Prisma.HeygenAssetWhereInput = {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
                { assetId: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
              ],
            }
          : {},
        assetType ? { assetType: assetType as HeygenAssetType } : {},
      ],
    };

    const [assets, total] = await this.prisma.$transaction([
      this.prisma.heygenAsset.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.heygenAsset.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách asset thành công',
      data: {
        data: assets.map((asset) => new AssetResponseDto(asset)),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  // Lấy tất cả asset (không phân trang)
  async getAllAssets(search = '', assetType = '') {
    const where: Prisma.HeygenAssetWhereInput = {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
                { assetId: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
              ],
            }
          : {},
        assetType ? { assetType: assetType as HeygenAssetType } : {},
      ],
    };

    const assets = await this.prisma.heygenAsset.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return {
      success: true,
      message: 'Lấy tất cả asset thành công',
      data: assets.map((asset) => new AssetResponseDto(asset)),
    };
  }

  // Lấy asset theo id
  async getAssetById(id: number) {
    const asset = await this.prisma.heygenAsset.findUnique({ 
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
    if (!asset) throw new NotFoundException('Asset không tồn tại');
    
    return {
      success: true,
      message: 'Lấy asset thành công',
      data: new AssetResponseDto(asset),
    };
  }

  // Lấy asset theo HeyGen ID
  async getAssetByHeyGenId(assetId: string) {
    const asset = await this.prisma.heygenAsset.findUnique({ 
      where: { assetId },
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
    if (!asset) throw new NotFoundException('Asset không tồn tại');
    
    return {
      success: true,
      message: 'Lấy asset thành công',
      data: new AssetResponseDto(asset),
    };
  }

  // Cập nhật asset
  async updateAsset(id: number, dto: UpdateAssetDto) {
    const asset = await this.prisma.heygenAsset.findUnique({ 
      where: { id } 
    });
    if (!asset) throw new NotFoundException('Asset không tồn tại');

    // Check duplicate assetId nếu có update
    if (dto.assetId && dto.assetId !== asset.assetId) {
      const existing = await this.prisma.heygenAsset.findUnique({
        where: { assetId: dto.assetId },
      });
      if (existing) throw new BadRequestException('Asset ID đã tồn tại');
    }

    const updated = await this.prisma.heygenAsset.update({ 
      where: { id }, 
      data: dto 
    });
    
    return {
      success: true,
      message: 'Cập nhật asset thành công',
      data: new AssetResponseDto(updated),
    };
  }

  // Xóa asset
  async deleteAsset(id: number) {
    const asset = await this.prisma.heygenAsset.findUnique({ 
      where: { id } 
    });
    if (!asset) throw new NotFoundException('Asset không tồn tại');

    await this.prisma.heygenAsset.delete({ where: { id } });
    
    return {
      success: true,
      message: 'Xóa asset thành công',
      data: null,
    };
  }

  // Lấy danh sách asset types có sẵn
  async getAvailableAssetTypes() {
    const assetTypes = await this.prisma.heygenAsset.findMany({
      distinct: ['assetType'],
      select: {
        assetType: true,
      },
      orderBy: {
        assetType: 'asc',
      },
    });

    const typeList = assetTypes.map((item) => item.assetType);

    return {
      success: true,
      message: 'Lấy danh sách asset types thành công',
      data: typeList,
    };
  }
}