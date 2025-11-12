import { IsString, IsOptional, IsInt, IsEnum, IsNumber } from 'class-validator';
import { HeygenAssetType } from '@prisma/client';

export class CreateAssetDto {
  @IsString()
  assetId: string;

  @IsEnum(HeygenAssetType)
  assetType: HeygenAssetType;

  @IsString()
  name: string;

  @IsString()
  url: string;

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