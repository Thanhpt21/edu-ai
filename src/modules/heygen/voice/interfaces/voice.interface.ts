export interface IVoice {
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
}

export interface IVoiceCreate {
  voiceId: string;
  name: string;
  displayName?: string;
  gender?: string;
  language?: string;
  language_code?: string;
  preview_audio?: string;
  is_customized?: boolean;
   is_premium?: boolean;
  is_free?: boolean;
  tier?: string;
}

export interface IVoiceUpdate {
  voiceId?: string;
  name?: string;
  displayName?: string;
  gender?: string;
  language?: string;
  language_code?: string;
  preview_audio?: string;
  is_customized?: boolean;
  is_premium?: boolean;
  is_free?: boolean;
  tier?: string;
}