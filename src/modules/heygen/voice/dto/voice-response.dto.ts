import { HeygenVoice } from '@prisma/client';

export class VoiceResponseDto {
  id: number;
  voiceId: string;
  name: string;
  displayName?: string;
  gender?: string;
  language?: string;
  language_code?: string;
  preview_audio?: string;
  is_customized: boolean;
  is_premium: boolean;
  is_free: boolean;
  tier?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(voice: HeygenVoice) {
    this.id = voice.id;
    this.voiceId = voice.voiceId;
    this.name = voice.name;
    this.displayName = voice.displayName ?? undefined;
    this.gender = voice.gender ?? undefined;
    this.language = voice.language ?? undefined;
    this.language_code = voice.language_code ?? undefined;
    this.preview_audio = voice.preview_audio ?? undefined;
    this.is_customized = voice.is_customized;
    this.is_premium = voice.is_premium;
    this.is_free = voice.is_free;
    this.tier = voice.tier ?? undefined;
    this.createdAt = voice.createdAt;
    this.updatedAt = voice.updatedAt;
  }
}