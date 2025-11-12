import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUserRoleDto } from './dto/create-user-role.dto';

@Injectable()
export class UserRoleService {
  constructor(private prisma: PrismaService) {}

  // Thêm vai trò cho người dùng
  async addRole(dto: CreateUserRoleDto) {
    // Kiểm tra người dùng có tồn tại
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    // Kiểm tra vai trò có tồn tại
    const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
    if (!role) throw new NotFoundException('Vai trò không tồn tại');

    // Kiểm tra đã có chưa
    const existing = await this.prisma.userRole.findUnique({
      where: { userId_roleId: { userId: dto.userId, roleId: dto.roleId } },
    });
    if (existing) throw new BadRequestException('Vai trò đã được gán cho người dùng');

    // Thêm vai trò vào người dùng
    const userRole = await this.prisma.userRole.create({ data: dto });

    return {
      success: true,
      message: 'Thêm vai trò cho người dùng thành công',
      data: userRole,
    };
  }

  // Xóa vai trò của người dùng
  async removeRole(userId: number, roleId: number) {
    const existing = await this.prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId } },
    });
    if (!existing) throw new NotFoundException('Vai trò chưa được gán cho người dùng');

    await this.prisma.userRole.delete({
      where: { userId_roleId: { userId, roleId } },
    });

    return {
      success: true,
      message: 'Xóa vai trò khỏi người dùng thành công',
      data: null,
    };
  }

  // Lấy danh sách vai trò của người dùng
  async getRolesOfUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    return {
      success: true,
      message: 'Lấy danh sách vai trò của người dùng thành công',
      data: user.roles.map((ur) => ur.role),
    };
  }
}
