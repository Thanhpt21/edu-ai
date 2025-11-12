export const VIDEO_STATUS = {
  PENDING: 'pending',
  WAITING: 'waiting',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export const VIDEO_STATUS_MESSAGES = {
  [VIDEO_STATUS.PENDING]: 'Video is queued for processing',
  [VIDEO_STATUS.WAITING]: 'Video is waiting in queue',
  [VIDEO_STATUS.PROCESSING]: 'Video is being generated',
  [VIDEO_STATUS.COMPLETED]: 'Video generation completed successfully',
  [VIDEO_STATUS.FAILED]: 'Video generation failed',
} as const;

export const VIDEO_ERROR_CODES = {
  INVALID_INPUT: 'invalid_input',
  AVATAR_NOT_FOUND: 'avatar_not_found',
  VOICE_NOT_FOUND: 'voice_not_found',
  RATE_LIMITED: 'rate_limited',
  INTERNAL_ERROR: 'internal_error',
  NETWORK_ERROR: 'network_error',
  TIMEOUT: 'timeout',
} as const;