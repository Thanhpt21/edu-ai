import { Logger } from '@nestjs/common';

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  timeoutMs?: number;
}

export class RetryHelper {
  private static readonly logger = new Logger(RetryHelper.name);

  static async retry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {},
  ): Promise<T> {
    const {
      maxAttempts = 3,
      delayMs = 1000,
      backoffMultiplier = 2,
      timeoutMs = 30000,
    } = options;

    let lastError: Error;
    let currentDelay = delayMs;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        this.logger.debug(`Attempt ${attempt} of ${maxAttempts}`);

        // Add timeout to the operation
        const result = await Promise.race([
          operation(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Operation timeout')), timeoutMs),
          ),
        ]);

        return result;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`Attempt ${attempt} failed: ${error.message}`);

        if (attempt === maxAttempts) {
          this.logger.error(`All ${maxAttempts} attempts failed`);
          break;
        }

        // Wait before retrying with exponential backoff
        await this.delay(currentDelay);
        currentDelay *= backoffMultiplier;
      }
    }

    throw lastError!;
  }

  static async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static shouldRetry(error: Error): boolean {
    const retryableErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ECONNREFUSED',
      'ENOTFOUND',
      'TIMEOUT',
      'NETWORK_ERROR',
    ];

    const errorMessage = error.message.toLowerCase();
    return retryableErrors.some(retryableError =>
      errorMessage.includes(retryableError.toLowerCase()),
    );
  }

  static withRetry<T>(
    operation: () => Promise<T>,
    options?: RetryOptions,
  ): () => Promise<T> {
    return () => this.retry(operation, options);
  }
}