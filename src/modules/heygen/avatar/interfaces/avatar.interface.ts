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
}