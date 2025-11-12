import { IsString, IsEnum, IsOptional, IsNumber, IsObject } from 'class-validator';

// Định nghĩa enum
export enum WebhookVideoStatus {
  PENDING = 'pending',
  WAITING = 'waiting', 
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export class WebhookEventDataDto {
  @IsString()
  video_id: string;

  @IsEnum(WebhookVideoStatus)
  status: WebhookVideoStatus;

  @IsOptional()
  @IsString()
  video_url?: string;

  @IsOptional()
  @IsString()
  thumbnail_url?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsString()
  error_message?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class WebhookEventDto {
  @IsString()
  event: string;

  @IsObject()
  data: WebhookEventDataDto;

  @IsNumber()
  timestamp: number;

  @IsOptional()
  @IsString()
  signature?: string;
}