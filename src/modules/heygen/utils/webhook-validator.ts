import * as crypto from 'crypto';
import { Logger } from '@nestjs/common';

export class WebhookValidator {
  private static readonly logger = new Logger(WebhookValidator.name);

  static verifySignature(
    signature: string,
    secret: string,
    payload: any,
    algorithm: string = 'sha256',
  ): boolean {
    if (!signature || !secret) {
      this.logger.warn('Missing signature or secret for webhook verification');
      return false;
    }

    try {
      const hmac = crypto.createHmac(algorithm, secret);
      const expectedSignature = hmac
        .update(JSON.stringify(payload))
        .digest('hex');

      // Use timing-safe comparison to prevent timing attacks
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
    } catch (error) {
      this.logger.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  static validateWebhookPayload(payload: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!payload) {
      return { isValid: false, errors: ['Payload is empty'] };
    }

    if (!payload.event) {
      errors.push('Missing event type');
    }

    if (!payload.data) {
      errors.push('Missing data object');
    } else {
      if (!payload.data.video_id) {
        errors.push('Missing video_id in data');
      }
      if (!payload.data.status) {
        errors.push('Missing status in data');
      }
    }

    if (!payload.timestamp) {
      errors.push('Missing timestamp');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static isEventTypeSupported(eventType: string): boolean {
    const supportedEvents = [
      'video.completed',
      'video.failed',
      'video.processing',
      'video.pending',
    ];
    return supportedEvents.includes(eventType);
  }

  static generateWebhookSecret(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}