import { IsOptional, IsInt, IsString, IsEnum } from 'class-validator';
import { HeygenVideoStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class VideoQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string = '';

  @IsOptional()
  @IsEnum(HeygenVideoStatus)
  status?: HeygenVideoStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  lessonId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  avatarId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  voiceId?: number;
}