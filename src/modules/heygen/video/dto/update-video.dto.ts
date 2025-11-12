import { IsString, IsOptional, IsInt, IsBoolean, IsEnum, IsNumber } from 'class-validator';
import { HeygenVideoStatus, BackgroundPlayStyle } from '@prisma/client';

export class UpdateVideoDto {
  @IsOptional()
  @IsString()
  videoId?: string;

  @IsOptional()
  @IsInt()
  userId?: number;

  @IsOptional()
  @IsInt()
  lessonId?: number;

  @IsOptional()
  @IsInt()
  avatarId?: number;

  @IsOptional()
  @IsInt()
  voiceId?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  inputText?: string;

  @IsOptional()
  @IsEnum(HeygenVideoStatus)
  status?: HeygenVideoStatus;

  // Background settings
  @IsOptional()
  @IsString()
  backgroundType?: string;

  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @IsOptional()
  @IsString()
  backgroundImageUrl?: string;

  @IsOptional()
  @IsString()
  backgroundVideoUrl?: string;

  @IsOptional()
  @IsEnum(BackgroundPlayStyle)
  backgroundPlayStyle?: BackgroundPlayStyle;

  // Video settings
  @IsOptional()
  @IsInt()
  dimensionWidth?: number;

  @IsOptional()
  @IsInt()
  dimensionHeight?: number;

  @IsOptional()
  @IsBoolean()
  isWebM?: boolean;

  // Result fields
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsString()
  errorMessage?: string;

  @IsOptional()
  @IsInt()
  retryCount?: number;

  @IsOptional()
  @IsString()
  lastError?: string;
}