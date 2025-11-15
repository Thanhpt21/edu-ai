export interface IAvatarIVVideo {
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
  userId?: number;
}

export interface IAvatarIVVideoCreate {
  title: string;
  imageKey: string;
  script: string;
  voiceId: string;
  language?: string;
  customMotion?: string;
  enhanceMotion?: boolean;
  userId?: number;
}

export interface IAvatarIVVideoUpdate {
  videoId?: string;
  status?: string;
  videoUrl?: string;
  errorMessage?: string;
}

// Interface cho HeyGen API response
export interface IHeyGenAvatarIVResponse {
  data?: {
    video_id: string;
    status: string;
    video_url?: string;
  };
  error?: {
    message: string;
    code: string;
  };
}

export interface IHeyGenUploadAssetResponse {
  code: number;
  data?: {
    id: string;
    name: string;
    file_type: string;
    folder_id: string;
    meta: any;
    created_ts: number;
    url: string;
    image_key: string;  // ĐÂY MỚI LÀ FIELD CHÍNH
  };
  msg?: string;
  message?: string;
  error?: {
    message: string;
    code: string;
  };
}