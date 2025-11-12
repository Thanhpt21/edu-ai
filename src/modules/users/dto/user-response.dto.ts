import { User } from '@prisma/client';

export class UserResponseDto {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  gender: string | null;
  avatar: string | null;
  isActive: boolean;
  type_account: string;
  createdAt: Date;
  updatedAt: Date;
  tenantId?: number;
  conversationId: number | null;  // Thêm trường conversationId
  tokenAI?: number;

  constructor(user: User, conversationId: number | null = null) {  // Nhận conversationId từ ngoài
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.phone = user.phone;
    this.gender = user.gender;
    this.avatar = user.avatar;
    this.isActive = user.isActive;
    this.type_account = user.type_account;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
    this.conversationId = conversationId;  // Gán conversationId
  }
}
