import { BackgroundPlayStyle } from '@prisma/client';

export interface ITemplate {
  id: number;
  name: string;
  description?: string;
  avatarId: number;
  voiceId: number;
  backgroundType?: string;
  backgroundColor?: string;
  backgroundUrl?: string;
  backgroundPlayStyle?: BackgroundPlayStyle;
  inputText?: string;
  isPublic: boolean;
  createdBy?: number;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITemplateCreate {
  name: string;
  description?: string;
  avatarId: number;
  voiceId: number;
  backgroundType?: string;
  backgroundColor?: string;
  backgroundUrl?: string;
  backgroundPlayStyle?: BackgroundPlayStyle;
  inputText?: string;
  isPublic?: boolean;
  createdBy?: number;
}

export interface ITemplateUpdate {
  name?: string;
  description?: string;
  avatarId?: number;
  voiceId?: number;
  backgroundType?: string;
  backgroundColor?: string;
  backgroundUrl?: string;
  backgroundPlayStyle?: BackgroundPlayStyle;
  inputText?: string;
  isPublic?: boolean;
  usageCount?: number;
}