import { IsString, IsOptional, IsInt, IsEnum, IsNumber } from 'class-validator';
import { HeygenAssetType } from '@prisma/client';

export class UpdateAssetDto {
  @IsOptional()
  @IsString()
  assetId?: string;

  @IsOptional()
  @IsEnum(HeygenAssetType)
  assetType?: HeygenAssetType;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsInt()
  fileSize?: number;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsInt()
  uploadedBy?: number;
}