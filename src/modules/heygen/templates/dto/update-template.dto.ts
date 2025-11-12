import { IsString, IsOptional, IsInt, IsBoolean, IsEnum } from 'class-validator';
import { BackgroundPlayStyle } from '@prisma/client';

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  avatarId?: number;

  @IsOptional()
  @IsInt()
  voiceId?: number;

  @IsOptional()
  @IsString()
  backgroundType?: string;

  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @IsOptional()
  @IsString()
  backgroundUrl?: string;

  @IsOptional()
  @IsEnum(BackgroundPlayStyle)
  backgroundPlayStyle?: BackgroundPlayStyle;

  @IsOptional()
  @IsString()
  inputText?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsInt()
  usageCount?: number;
}