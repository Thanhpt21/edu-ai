import { HeygenVideo, HeygenVideoStatus, BackgroundPlayStyle } from '@prisma/client';

export class VideoResponseDto {
  id: number;
  videoId: string;
  userId?: number;
  lessonId?: number;
  avatarId: number;
  voiceId: number;
  title?: string;
  inputText: string;
  status: HeygenVideoStatus;
  
  // Background settings
  backgroundType?: string;
  backgroundColor?: string;
  backgroundImageUrl?: string;
  backgroundVideoUrl?: string;
  backgroundPlayStyle?: BackgroundPlayStyle;
  
  // Video settings
  dimensionWidth: number;
  dimensionHeight: number;
  isWebM: boolean;
  
  // Result
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  errorMessage?: string;
  
  // Metadata
  metadata?: any;
  
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  retryCount: number;
  maxRetries: number;
  lastError?: string;

  constructor(video: HeygenVideo) {
    this.id = video.id;
    this.videoId = video.videoId;
    this.userId = video.userId ?? undefined;
    this.lessonId = video.lessonId ?? undefined;
    this.avatarId = video.avatarId;
    this.voiceId = video.voiceId;
    this.title = video.title ?? undefined;
    this.inputText = video.inputText;
    this.status = video.status;
    this.backgroundType = video.backgroundType ?? undefined;
    this.backgroundColor = video.backgroundColor ?? undefined;
    this.backgroundImageUrl = video.backgroundImageUrl ?? undefined;
    this.backgroundVideoUrl = video.backgroundVideoUrl ?? undefined;
    this.backgroundPlayStyle = video.backgroundPlayStyle ?? undefined;
    this.dimensionWidth = video.dimensionWidth;
    this.dimensionHeight = video.dimensionHeight;
    this.isWebM = video.isWebM;
    this.videoUrl = video.videoUrl ?? undefined;
    this.thumbnailUrl = video.thumbnailUrl ?? undefined;
    this.duration = video.duration ?? undefined;
    this.errorMessage = video.errorMessage ?? undefined;
    this.metadata = video.metadata ? JSON.parse(JSON.stringify(video.metadata)) : undefined;
    this.createdAt = video.createdAt;
    this.updatedAt = video.updatedAt;
    this.completedAt = video.completedAt ?? undefined;
    this.retryCount = video.retryCount;
    this.maxRetries = video.maxRetries;
    this.lastError = video.lastError ?? undefined;
  }
}