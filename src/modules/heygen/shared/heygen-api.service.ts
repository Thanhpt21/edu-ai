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

@Injectable()
export class HeyGenApiService {
  private readonly logger = new Logger(HeyGenApiService.name);
  private readonly config: IHeyGenApiConfig;

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
  }

  private getHeaders() {
    return {
      'X-Api-Key': this.config.apiKey,
      'Content-Type': 'application/json',
    };
  }

  // Generate video với HeyGen API V2 - ĐÃ SỬA
  async generateVideo(request: IVideoGenerationRequest): Promise<IVideoGenerationResponse> {
    try {

      const response = await lastValueFrom(
        this.httpService.post(
          `${this.config.baseUrl}/video/generate`,
          request,
          {
            headers: {
              'X-Api-Key': this.config.apiKey,
              'Content-Type': 'application/json',
            },
            timeout: this.config.timeout,
          }
        )
      );



      // V2 API trả về direct fields, không có data wrapper
      const videoId = response.data.video_id;
      
      this.logger.log(`Video generation started: ${videoId}`);
      return response.data; // Trả về trực tiếp response.data
    } catch (error) {

      
      this.logger.error('Error generating video:', error.response?.data || error.message);
      throw new InternalServerErrorException(
        `HeyGen API error: ${error.response?.data?.error?.message || error.message}`
      );
    }
  }

async getVideoStatus(videoId: string) {
  try {
    // V2 endpoint - cần kiểm tra documentation
    const response = await lastValueFrom(
      this.httpService.get(
        `${this.config.baseUrl}/video/${videoId}`,
        { 
          headers: this.getHeaders()
        }
      )
    );
    return response.data;
  } catch (error) {
    // Fallback to v1 nếu v2 không work
    return this.getVideoStatusV1(videoId);
  }
}

// Fallback method cho v1
private async getVideoStatusV1(videoId: string) {
  const response = await lastValueFrom(
    this.httpService.get(
      'https://api.heygen.com/v1/video.list',
      { 
        headers: this.getHeaders(),
        params: { page_size: 100 }
      }
    )
  );
  
  const video = response.data.data.videos.find(
    (v: any) => v.video_id === videoId
  );
  
  if (!video) {
    throw new Error(`Video ${videoId} not found in HeyGen`);
  }
  
  return video;
}

  async getShareableUrl(videoId: string): Promise<any> {
    try {
      const response = await lastValueFrom(
        this.httpService.post(
          'https://api.heygen.com/v1/video/share',
          { video_id: videoId },
          { headers: this.getHeaders() }
        )
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Error getting shareable URL for ${videoId}:`, error.response?.data || error.message);
      throw new Error(`HeyGen API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Get available avatars
  async getAvatars(): Promise<IHeyGenAvatarListResponse> {
    try {
      const response = await lastValueFrom(
        this.httpService.get(
          `${this.config.baseUrl}/avatars`,
          {
            headers: {
              'X-Api-Key': this.config.apiKey,
            },
            timeout: this.config.timeout,
          }
        )
      );

      return response.data;
    } catch (error) {
      this.logger.error('Error getting avatars:', error.response?.data || error.message);
      throw new InternalServerErrorException(
        `HeyGen API error: ${error.response?.data?.error?.message || error.message}`
      );
    }
  }

  // Get available voices
  async getVoices(): Promise<IHeyGenVoiceListResponse> {
    try {
      const response = await lastValueFrom(
        this.httpService.get(
          `${this.config.baseUrl}/voices`,
          {
            headers: {
              'X-Api-Key': this.config.apiKey,
            },
            timeout: this.config.timeout,
          }
        )
      );

      return response.data;
    } catch (error) {
      this.logger.error('Error getting voices:', error.response?.data || error.message);
      throw new InternalServerErrorException(
        `HeyGen API error: ${error.response?.data?.error?.message || error.message}`
      );
    }
  }

  // Upload asset (image/video/audio)
  async uploadAsset(file: Buffer, fileName: string, assetType: 'image' | 'video' | 'audio'): Promise<any> {
    try {
      const formData = new FormData();
      
      const uint8Array = new Uint8Array(file);
      const blob = new Blob([uint8Array], { type: this.getMimeType(assetType) });
      
      formData.append('file', blob, fileName);

      const response = await lastValueFrom(
        this.httpService.post(
          `${this.config.baseUrl}/assets/upload`,
          formData,
          {
            headers: {
              'X-Api-Key': this.config.apiKey,
            },
            timeout: this.config.timeout,
          }
        )
      );

      return response.data;
    } catch (error) {
      this.logger.error('Error uploading asset:', error.response?.data || error.message);
      throw new InternalServerErrorException(
        `HeyGen API error: ${error.response?.data?.error?.message || error.message}`
      );
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