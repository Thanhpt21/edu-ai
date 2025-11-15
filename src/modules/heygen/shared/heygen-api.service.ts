import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { 
  IHeyGenApiConfig,
  IVideoGenerationRequest,
  IVideoGenerationResponse,
  IVideoStatusResponse,
  IHeyGenAvatarListResponse,
  IHeyGenVoiceListResponse
} from './interfaces/heygen-api.interface';
import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';

@Injectable()
export class HeyGenApiService {
  private readonly logger = new Logger(HeyGenApiService.name);
  private readonly config: IHeyGenApiConfig;
  private readonly apiClient: AxiosInstance;
  private readonly uploadClient: AxiosInstance;
  private readonly v2ApiClient: AxiosInstance;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.config = {
      baseUrl: this.configService.get<string>('HEYGEN_API_URL') || 'https://api.heygen.com/v2',
      apiKey: this.configService.get<string>('HEYGEN_API_KEY') || '',
      webhookSecret: this.configService.get<string>('HEYGEN_WEBHOOK_SECRET') || '',
      timeout: 30000,
      maxRetries: 3,
    };

    // Khởi tạo axios instance cho API V1
    this.apiClient = axios.create({
      baseURL: 'https://api.heygen.com/v1',
      headers: {
        'X-Api-Key': this.config.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: this.config.timeout,
    });

    // Client cho upload (domain khác)
    this.uploadClient = axios.create({
      baseURL: 'https://upload.heygen.com/v1',
      headers: {
        'X-Api-Key': this.config.apiKey,
      },
      timeout: this.config.timeout,
    });

    // Client cho API V2 (Avatar IV)
    this.v2ApiClient = axios.create({
      baseURL: 'https://api.heygen.com/v2',
      headers: {
        'X-Api-Key': this.config.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: this.config.timeout,
    });
  }

  private getHeaders() {
    return {
      'X-Api-Key': this.config.apiKey,
      'Content-Type': 'application/json',
    };
  }

  // Upload asset (image) lên HeyGen - DÙNG UPLOAD CLIENT
  async uploadAsset(file: Express.Multer.File): Promise<any> {
    try {
      this.logger.log('Uploading asset to HeyGen...', {
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      });

      // DÙNG UPLOAD CLIENT VỚI ENDPOINT CHÍNH XÁC
      const response = await this.uploadClient.post('/asset', file.buffer, {
        headers: {
          'Content-Type': file.mimetype,
        },
        timeout: 60000,
      });

      this.logger.log('Upload asset successful:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      this.logger.error('Lỗi upload asset lên HeyGen:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new Error(`HeyGen upload failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Tạo Avatar IV video - DÙNG V2 CLIENT
  async createAvatarIVVideo(payload: {
    image_key: string;
    video_title: string;
    script: string;
    voice_id: string;
    language?: string;
    custom_motion_prompt?: string;
    enhance_custom_motion_prompt?: boolean;
    video_orientation?: string;
    fit?: string;
  }): Promise<any> {
    try {
      const requestPayload = {
        image_key: payload.image_key,
        video_title: payload.video_title,
        script: payload.script,
        voice_id: payload.voice_id,
        video_orientation: payload.video_orientation || 'portrait',
        fit: payload.fit || 'cover',
        ...(payload.language && { language: payload.language }),
        ...(payload.custom_motion_prompt && { custom_motion_prompt: payload.custom_motion_prompt }),
        ...(payload.enhance_custom_motion_prompt !== undefined && { 
          enhance_custom_motion_prompt: payload.enhance_custom_motion_prompt 
        }),
      };

      this.logger.log('Gọi HeyGen Avatar IV API V2 với payload:', JSON.stringify(requestPayload, null, 2));

      // DÙNG V2 CLIENT VỚI ENDPOINT CHÍNH XÁC
      const response = await this.v2ApiClient.post('/video/av4/generate', requestPayload, {
        timeout: 120000,
      });

      this.logger.log('Avatar IV V2 response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      this.logger.error('Lỗi tạo Avatar IV video V2:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        endpoint: '/v2/video/av4/generate'
      });
      throw new Error(`HeyGen Avatar IV V2 failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Generate video với HeyGen API V2 - DÙNG V2 CLIENT
  async generateVideo(request: IVideoGenerationRequest): Promise<IVideoGenerationResponse> {
    try {
      const response = await this.v2ApiClient.post('/video/generate', request);
      
      const videoId = response.data.video_id;
      this.logger.log(`Video generation started: ${videoId}`);
      return response.data;
    } catch (error) {
      this.logger.error('Error generating video:', error.response?.data || error.message);
      throw new InternalServerErrorException(
        `HeyGen API error: ${error.response?.data?.error?.message || error.message}`
      );
    }
  }

  // Get video status
async getVideoStatus(videoId: string): Promise<any> {
  try {
    console.log(`🔍 [getVideoStatus] Lấy status cho: ${videoId}`);
    
    // 🎯 ENDPOINT ĐÚNG: /v1/video_status.get với video_id là query parameter
    const response = await this.apiClient.get('/video_status.get', {
      params: {
        video_id: videoId  // 🎯 QUAN TRỌNG: video_id là query param, không phải body
      }
    });

    console.log(`✅ [getVideoStatus] Response:`, response.data);

    if (response.data.code === 100 && response.data.data) {
      const videoData = response.data.data;
      
      console.log(`🎯 [getVideoStatus] Video details:`, {
        status: videoData.status,
        video_url: videoData.video_url, // 🎯 DOWNLOADABLE URL
        thumbnail_url: videoData.thumbnail_url,
        duration: videoData.duration,
        created_at: videoData.created_at
      });

      return {
        status: videoData.status,
        video_url: videoData.video_url,
        thumbnail_url: videoData.thumbnail_url,
        duration: videoData.duration,
        error_message: videoData.error
      };
    } else {
      console.log(`❌ [getVideoStatus] API error:`, response.data);
      throw new Error(`HeyGen API error: ${response.data.message}`);
    }

  } catch (error) {
    console.error(`💥 [getVideoStatus] Lỗi:`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      config: {
        url: error.config?.url,
        params: error.config?.params
      }
    });
    throw error;
  }
}


  // Get available avatars - DÙNG V2 CLIENT
  async getAvatars(): Promise<IHeyGenAvatarListResponse> {
    try {
      const response = await this.v2ApiClient.get('/avatars');
      return response.data;
    } catch (error) {
      this.logger.error('Error getting avatars:', error.response?.data || error.message);
      throw new InternalServerErrorException(
        `HeyGen API error: ${error.response?.data?.error?.message || error.message}`
      );
    }
  }

  // Get available voices - DÙNG V2 CLIENT
  async getVoices(): Promise<IHeyGenVoiceListResponse> {
    try {
      const response = await this.v2ApiClient.get('/voices');
      return response.data;
    } catch (error) {
      this.logger.error('Error getting voices:', error.response?.data || error.message);
      throw new InternalServerErrorException(
        `HeyGen API error: ${error.response?.data?.error?.message || error.message}`
      );
    }
  }

  // Xóa video - DÙNG API CLIENT V1
  async deleteVideo(videoId: string): Promise<any> {
    try {
      const response = await this.apiClient.delete(`/videos/${videoId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Lỗi xóa video ${videoId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  // Thêm method để check Avatar IV video status
  async getAvatarIVVideoStatus(videoId: string): Promise<any> {
    try {
      return await this.getVideoStatus(videoId);
    } catch (error) {
      this.logger.error(`Lỗi lấy status Avatar IV video ${videoId}:`, error);
      throw error;
    }
  }

  // Helper method để lấy MIME type
  private getMimeType(assetType: 'image' | 'video' | 'audio'): string {
    const mimeTypes = {
      image: 'image/jpeg',
      video: 'video/mp4',
      audio: 'audio/mpeg',
    };
    return mimeTypes[assetType];
  }

  // Helper method để retry requests
  private async retryRequest<T>(
    operation: () => Promise<T>, 
    retries: number = this.config.maxRetries
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retries > 0) {
        this.logger.warn(`Retrying request, ${retries} attempts left`);
        await this.delay(1000 * (this.config.maxRetries - retries + 1));
        return this.retryRequest(operation, retries - 1);
      }
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}