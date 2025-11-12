import { HeygenVideoStatus, BackgroundPlayStyle } from '@prisma/client';

const VIDEO_STATUS = {
  PENDING: 'pending',
  WAITING: 'waiting', 
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export class VideoHelpers {
  static isValidVideoStatus(status: string): status is HeygenVideoStatus {
    return Object.values(HeygenVideoStatus).includes(status as HeygenVideoStatus);
  }

  static isValidBackgroundPlayStyle(style: string): style is BackgroundPlayStyle {
    return Object.values(BackgroundPlayStyle).includes(style as BackgroundPlayStyle);
  }

  static calculateVideoCost(duration: number, quality: string = 'standard'): number {
    const costPerSecond = {
      standard: 0.1,
      hd: 0.15,
      '4k': 0.25,
    };

    const rate = costPerSecond[quality] || costPerSecond.standard;
    return Math.round(duration * rate * 100) / 100;
  }

  static estimateProcessingTime(duration: number, complexity: number = 1): number {
    const baseTime = 30;
    const factor = 2;
    return baseTime + (duration * factor * complexity);
  }

  static generateVideoFileName(
    userId: number,
    lessonId?: number,
    timestamp: number = Date.now(),
  ): string {
    const prefix = lessonId ? `lesson-${lessonId}` : `user-${userId}`;
    return `heygen-${prefix}-${timestamp}.mp4`;
  }

  static validateInputText(text: string): { isValid: boolean; error?: string } {
    if (!text || text.trim().length === 0) {
      return { isValid: false, error: 'Input text cannot be empty' };
    }

    if (text.length > 5000) {
      return { isValid: false, error: 'Input text too long (max 5000 characters)' };
    }

    const invalidChars = /[<>"\u0000-\u001F\u007F-\u009F]/;
    if (invalidChars.test(text)) {
      return { isValid: false, error: 'Input text contains invalid characters' };
    }

    return { isValid: true };
  }

  static mapHeyGenToInternalStatus(heygenStatus: string): HeygenVideoStatus {
    const statusMap: Record<string, HeygenVideoStatus> = {
      [VIDEO_STATUS.PENDING]: HeygenVideoStatus.PENDING,
      [VIDEO_STATUS.WAITING]: HeygenVideoStatus.WAITING,
      [VIDEO_STATUS.PROCESSING]: HeygenVideoStatus.PROCESSING,
      [VIDEO_STATUS.COMPLETED]: HeygenVideoStatus.COMPLETED,
      [VIDEO_STATUS.FAILED]: HeygenVideoStatus.FAILED,
    };

    return statusMap[heygenStatus] || HeygenVideoStatus.FAILED;
  }

  static canRetryVideo(status: HeygenVideoStatus, retryCount: number, maxRetries: number): boolean {
    // Sửa: So sánh trực tiếp với enum values
    const retryableStatuses: HeygenVideoStatus[] = [
      HeygenVideoStatus.FAILED, 
      HeygenVideoStatus.PENDING
    ];
    return retryableStatuses.includes(status) && retryCount < maxRetries;
  }
}