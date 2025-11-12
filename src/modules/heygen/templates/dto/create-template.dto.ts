import { IsString, IsOptional, IsInt, IsBoolean, IsEnum } from 'class-validator';
import { BackgroundPlayStyle } from '@prisma/client';

export class CreateTemplateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  avatarId: number;

  @IsInt()
  voiceId: number;

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
  createdBy?: number;
}