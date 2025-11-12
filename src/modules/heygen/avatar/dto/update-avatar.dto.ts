import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateAvatarDto {
  @IsOptional()
  @IsString()
  avatarId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  preview_image?: string;

  @IsOptional()
  @IsString()
  preview_video?: string;

  @IsOptional()
  @IsString()
  avatar_style?: string;

  @IsOptional()
  @IsBoolean()
  is_customized?: boolean;

  @IsOptional()
  @IsBoolean()
  is_instant?: boolean;
}