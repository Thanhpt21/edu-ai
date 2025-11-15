import { HeygenAvatar } from '@prisma/client';

export class AvatarResponseDto {
  id: number;
  avatarId: string;
  name: string;
  displayName?: string;
  gender?: string;
  preview_image?: string;
  preview_video?: string;
  avatar_style: string;
  is_customized: boolean;
  is_instant: boolean;
  is_premium: boolean;
  is_free: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(avatar: HeygenAvatar) {
    this.id = avatar.id;
    this.avatarId = avatar.avatarId;
    this.name = avatar.name;
    this.displayName = avatar.displayName ?? undefined;
    this.gender = avatar.gender ?? undefined;
    this.preview_image = avatar.preview_image ?? undefined;
    this.preview_video = avatar.preview_video ?? undefined;
    this.avatar_style = avatar.avatar_style;
    this.is_customized = avatar.is_customized;
    this.is_instant = avatar.is_instant;
    this.is_premium = avatar.is_premium;
    this.is_free = avatar.is_free;
    this.createdAt = avatar.createdAt;
    this.updatedAt = avatar.updatedAt;
  }
}