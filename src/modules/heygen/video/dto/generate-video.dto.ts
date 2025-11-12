import { IsString, IsOptional, IsInt, IsBoolean, IsEnum, IsNotEmpty } from 'class-validator';
import { BackgroundPlayStyle } from '@prisma/client';

export class GenerateVideoDto {
  @IsOptional()
  @IsInt()
  lessonId?: number;

  @IsInt()
  @IsNotEmpty()
  avatarId: number;

  @IsInt()
  @IsNotEmpty()
  voiceId: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  @IsNotEmpty()
  inputText: string;

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
}