import { HeygenAssetType } from '@prisma/client';

export interface IAsset {
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
}

export interface IAssetCreate {
  assetId: string;
  assetType: HeygenAssetType;
  name: string;
  url: string;
  fileSize?: number;
  duration?: number;
  uploadedBy?: number;
}

export interface IAssetUpdate {
  assetId?: string;
  assetType?: HeygenAssetType;
  name?: string;
  url?: string;
  fileSize?: number;
  duration?: number;
  uploadedBy?: number;
}