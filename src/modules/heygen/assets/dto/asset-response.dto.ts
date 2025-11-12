import { HeygenAsset, HeygenAssetType } from '@prisma/client';

export class AssetResponseDto {
  id: number;
  assetId: string;
  assetType: HeygenAssetType;
  name: string;
  url: string;
  fileSize?: number;
  duration?: number;
  uploadedBy?: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(asset: HeygenAsset) {
    this.id = asset.id;
    this.assetId = asset.assetId;
    this.assetType = asset.assetType;
    this.name = asset.name;
    this.url = asset.url;
    this.fileSize = asset.fileSize ?? undefined;
    this.duration = asset.duration ?? undefined;
    this.uploadedBy = asset.uploadedBy ?? undefined;
    this.createdAt = asset.createdAt;
    this.updatedAt = asset.updatedAt;
  }
}