import { HeygenVideoStatus, BackgroundPlayStyle } from '@prisma/client';

export interface IVideo {
  id: number;
  videoId: string;
  userId?: number;
  lessonId?: number;
  avatarId: number;
  voiceId: number;
  title?: string;
  inputText: string;
  status: HeygenVideoStatus;
  
  backgroundType?: string;
  backgroundColor?: string;
  backgroundImageUrl?: string;
  backgroundVideoUrl?: string;
  backgroundPlayStyle?: BackgroundPlayStyle;
  
  dimensionWidth: number;
  dimensionHeight: number;
  isWebM: boolean;
  
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  errorMessage?: string;
  
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  webhookSecret?: string;
}

export interface IVideoWithRelations extends IVideo {
  avatar?: any;
  voice?: any;
  user?: any;
  lesson?: any;
}