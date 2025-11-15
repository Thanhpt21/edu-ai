export interface IAvatar {
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
}

export interface IAvatarCreate {
  avatarId: string;
  name: string;
  displayName?: string;
  gender?: string;
  preview_image?: string;
  preview_video?: string;
  avatar_style?: string;
  is_customized?: boolean;
  is_instant?: boolean;
   is_premium: boolean;
  is_free: boolean;
}

export interface IAvatarUpdate {
  avatarId?: string;
  name?: string;
  displayName?: string;
  gender?: string;
  preview_image?: string;
  preview_video?: string;
  avatar_style?: string;
  is_customized?: boolean;
  is_instant?: boolean;
   is_premium: boolean;
  is_free: boolean;
}