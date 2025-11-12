export interface IHeyGenWebhookEvent {
  event: string;
  data: {
    video_id: string;
    status: 'pending' | 'waiting' | 'processing' | 'completed' | 'failed';
    video_url?: string;
    thumbnail_url?: string;
    duration?: number;
    error_message?: string;
    metadata?: Record<string, any>;
  };
  timestamp: number;
  signature?: string;
}

export interface IWebhookVerificationResult {
  isValid: boolean;
  error?: string;
}