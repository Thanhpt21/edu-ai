import { HeygenAvatarIVVideo } from '@prisma/client';

export class AvatarIVVideoResponseDto {
  id: number;
  videoId?: string;
  title: string;
  imageKey: string;
  script: string;
  voiceId: string;
  language: string;
  customMotion?: string;
  enhanceMotion: boolean;
  status: string;
  videoUrl?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(video: HeygenAvatarIVVideo) {
    this.id = video.id;
    this.videoId = video.videoId ?? undefined;
    this.title = video.title;
    this.imageKey = video.imageKey;
    this.script = video.script;
    this.voiceId = video.voiceId;
    this.language = video.language;
    this.customMotion = video.customMotion ?? undefined;
    this.enhanceMotion = video.enhanceMotion;
    this.status = video.status;
    this.videoUrl = video.videoUrl ?? undefined;
    this.errorMessage = video.errorMessage ?? undefined;
    this.createdAt = video.createdAt;
    this.updatedAt = video.updatedAt;
  }
}