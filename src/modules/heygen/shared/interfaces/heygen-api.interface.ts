import { 
  IHeyGenApiConfig,
  IApiResponse 
} from './heygen-api-config.interface';

// ==================== AVATAR RELATED ====================
export interface IHeyGenAvatar {
  id: string;
  name: string;
  gender?: 'male' | 'female';
  preview_image?: string;
  preview_video?: string;
  avatar_style?: 'normal' | 'professional' | 'casual';
  is_customized?: boolean;
  is_instant?: boolean;
}

export interface IHeyGenAvatarListResponse extends IApiResponse<IHeyGenAvatar[]> {
  total: number;
}

// ==================== VOICE RELATED ====================
export interface IHeyGenVoice {
  id: string;  
  name: string;
  gender?: 'male' | 'female';
  language?: string;
  language_code?: string;
  preview_audio?: string;
  is_customized?: boolean;
}

export interface IHeyGenVoiceListResponse extends IApiResponse<IHeyGenVoice[]> {
  total: number;
}

// ==================== VIDEO GENERATION ====================
export interface IVideoGenerationRequest {
  video_inputs: Array<{
    character: {
      type: 'avatar';
      avatar_id: string;
      avatar_style?: 'normal' | 'professional' | 'casual';
    };
    voice: {
      type: 'text';
      input_text: string;
      voice_id: string;
      speed?: number;
      pitch?: number;
    };
    background?: {
      type: 'color' | 'image' | 'video';
      value?: string; // For color
      image_asset_id?: string; // For image
      video_asset_id?: string; // For video
      play_style?: 'fit_to_scene' | 'freeze' | 'loop' | 'full_video';
    };
  }>;
  dimension?: {
    width: number;
    height: number;
  };
  test?: boolean;
  // KHÔNG CÓ version field trong V2
}


export interface IVideoGenerationResponse {
  video_id: string;
  status?: 'pending' | 'waiting' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  error_message?: string;
  // Thêm data wrapper optional để linh hoạt
  data?: {
    video_id: string;
    status?: 'pending' | 'waiting' | 'processing' | 'completed' | 'failed';
    video_url?: string;
    thumbnail_url?: string;
    duration?: number;
    error_message?: string;
  };
}
// ==================== VIDEO STATUS ====================
export interface IVideoStatusResponse {
  data: {
    video_id: string;
    status: 'pending' | 'waiting' | 'processing' | 'completed' | 'failed';
    video_url?: string;
    thumbnail_url?: string;
    duration?: number;
    error_message?: string;
    created_at: string;
    completed_at?: string;
  };
}

// ==================== ASSET UPLOAD ====================
export interface IAssetUploadResponse extends IApiResponse {
  data: {
    asset_id: string;
    asset_type: 'image' | 'video' | 'audio';
    url: string;
    file_size?: number;
    duration?: number;
  };
}

// ==================== WEBHOOK EVENT ====================
export interface IHeyGenWebhookEvent {
  event: 'video.completed' | 'video.failed' | 'video.processing';
  data: {
    video_id: string;
    status: 'completed' | 'failed' | 'processing';
    video_url?: string;
    thumbnail_url?: string;
    duration?: number;
    error_message?: string;
    metadata?: Record<string, any>;
  };
  timestamp: number;
  signature?: string;
}

// ==================== ERROR RESPONSE ====================
export interface IHeyGenErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// ==================== PAGINATION ====================
export interface IHeyGenPagination {
  page?: number;
  limit?: number;
  total: number;
}

// ==================== TEMPLATE RELATED ====================
export interface IHeyGenTemplate {
  template_id?: string;
  name: string;
  avatar_id: string;
  voice_id: string;
  background_type?: 'color' | 'image' | 'video';
  background_value?: string;
  background_play_style?: 'fit_to_scene' | 'freeze' | 'loop' | 'full_video';
  input_text?: string;
  dimension?: {
    width: number;
    height: number;
  };
}

// ==================== BATCH OPERATIONS ====================
export interface IBatchVideoGenerationRequest {
  videos: Array<{
    video_inputs: Array<{
      character: {
        type: 'avatar';
        avatar_id: string;
      };
      voice: {
        type: 'text';
        input_text: string;
        voice_id: string;
      };
    }>;
  }>;
}

export interface IBatchVideoGenerationResponse extends IApiResponse {
  data: Array<{
    video_id: string;
    status: string;
  }>;
}

// Re-export các interfaces từ config file với 'export type'
export type { 
  IHeyGenApiConfig,
  IApiResponse,
  IApiRequestConfig,
  IPaginationParams,
  IPaginationResponse 
} from './heygen-api-config.interface';