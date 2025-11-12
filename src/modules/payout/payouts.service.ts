import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { PayoutStatus } from '@prisma/client';
import { CreatePayoutDto } from './dto/create-payout.dto';
import { UpdatePayoutDto } from './dto/update-payout.dto';
import { PayoutResponseDto } from './dto/payout-response.dto';

@Injectable()
export class PayoutsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePayoutDto, userId: number) {
    const payout = await this.prisma.payout.create({
      data: {
        receiverId: dto.receiverId,
        amount: dto.amount,
        currency: dto.currency ?? 'VND',
        status: dto.status ?? PayoutStatus.PENDING,
        receiverType: dto.receiverType,
        createdBy: userId,
      },
    });

    return {
      success: true,
      message: 'Tạo payout thành công',
      data: new PayoutResponseDto(payout),
    };
  }

  async getPayouts(
    page = 1,
    limit = 10,
    status?: string,
    search = '',
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status as PayoutStatus;
    }

    if (search) {
      where.OR = [
        { id: Number.isNaN(+search) ? undefined : +search },
        { method: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
      ].filter(Boolean);
    }

    const [payouts, total] = await this.prisma.$transaction([
      this.prisma.payout.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payout.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách payout thành công',
      data: {
        data: payouts.map((p) => new PayoutResponseDto(p)),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  async getPayoutById(id: number) {
    const payout = await this.prisma.payout.findUnique({
      where: { id },
    });

    if (!payout) {
      throw new BadRequestException('Payout không tồn tại');
    }

    return {
      success: true,
      message: 'Lấy payout thành công',
      data: new PayoutResponseDto(payout),
    };
  }

  async updatePayout(id: number, dto: UpdatePayoutDto) {
    const existing = await this.prisma.payout.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new BadRequestException('Payout không tồn tại');
    }

    const updated = await this.prisma.payout.update({
      where: { id },
      data: dto,
    });

    return {
      success: true,
      message: 'Cập nhật payout thành công',
      data: new PayoutResponseDto(updated),
    };
  }

  async deletePayout(id: number) {
    const existing = await this.prisma.payout.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new BadRequestException('Payout không tồn tại');
    }

    if (
      existing.status !== PayoutStatus.PENDING &&
      existing.status !== PayoutStatus.FAILED
    ) {
      throw new BadRequestException(
        `Không thể xóa payout có status là ${existing.status}. Chỉ có thể xóa payout PENDING hoặc FAILED`,
      );
    }

    await this.prisma.payout.delete({ where: { id } });

    return { success: true, message: 'Xóa payout thành công' };
  }
}