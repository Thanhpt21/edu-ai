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
}