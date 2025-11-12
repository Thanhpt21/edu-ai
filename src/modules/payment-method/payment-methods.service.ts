// payment-methods.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { PaymentMethodResponseDto } from './dto/payment-method-response.dto';

@Injectable()
export class PaymentMethodsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePaymentMethodDto) {
    // Kiểm tra code đã tồn tại chưa (toàn hệ thống)
    const existing = await this.prisma.paymentMethod.findFirst({
      where: { code: dto.code },
    });

    if (existing) {
      throw new BadRequestException(`Payment method với code "${dto.code}" đã tồn tại`);
    }

    const paymentMethod = await this.prisma.paymentMethod.create({
      data: {
        code: dto.code,
        name: dto.name,
      },
    });

    return {
      success: true,
      message: 'Tạo payment method thành công',
      data: new PaymentMethodResponseDto(paymentMethod),
    };
  }

  async getPaymentMethods(page = 1, limit = 10, search = '') {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [paymentMethods, total] = await this.prisma.$transaction([
      this.prisma.paymentMethod.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.paymentMethod.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách payment method thành công',
      data: {
        data: paymentMethods.map((pm) => new PaymentMethodResponseDto(pm)),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  async getPaymentMethodById(id: number) {
    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: { id },
    });

    if (!paymentMethod) {
      throw new BadRequestException('Payment method không tồn tại');
    }

    return {
      success: true,
      message: 'Lấy payment method thành công',
      data: new PaymentMethodResponseDto(paymentMethod),
    };
  }

  async updatePaymentMethod(id: number, dto: UpdatePaymentMethodDto) {
    const existing = await this.prisma.paymentMethod.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new BadRequestException('Payment method không tồn tại');
    }

    // Nếu update code, kiểm tra trùng (trừ chính nó)
    if (dto.code && dto.code !== existing.code) {
      const duplicateCode = await this.prisma.paymentMethod.findFirst({
        where: {
          code: dto.code,
          id: { not: id },
        },
      });

      if (duplicateCode) {
        throw new BadRequestException(`Payment method với code "${dto.code}" đã tồn tại`);
      }
    }

    const updated = await this.prisma.paymentMethod.update({
      where: { id },
      data: dto,
    });

    return {
      success: true,
      message: 'Cập nhật payment method thành công',
      data: new PaymentMethodResponseDto(updated),
    };
  }

  async deletePaymentMethod(id: number) {
    const existing = await this.prisma.paymentMethod.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new BadRequestException('Payment method không tồn tại');
    }

    // Kiểm tra có payment nào đang dùng method này không
    const paymentsUsingMethod = await this.prisma.payment.count({
      where: { methodId: id },
    });

    if (paymentsUsingMethod > 0) {
      throw new BadRequestException(
        `Không thể xóa payment method này vì đang có ${paymentsUsingMethod} payment đang sử dụng`,
      );
    }

    await this.prisma.paymentMethod.delete({ where: { id } });

    return { success: true, message: 'Xóa payment method thành công' };
  }

  // Lấy tất cả payment methods (không phân trang) - dùng cho dropdown
  async getAllPaymentMethods() {
    const paymentMethods = await this.prisma.paymentMethod.findMany({
      orderBy: { name: 'asc' },
    });

    return {
      success: true,
      message: 'Lấy tất cả payment method thành công',
      data: paymentMethods.map((pm) => new PaymentMethodResponseDto(pm)),
    };
  }
}