export const HEYGEN_API_CONSTANTS = {
  BASE_URL: process.env.HEYGEN_API_URL || 'https://api.heygen.com/v2',
  ENDPOINTS: {
    VIDEO_GENERATE: '/video/generate',
    VIDEO_STATUS: '/video/{video_id}/status',
    AVATARS: '/avatars',
    VOICES: '/voices',
    ASSETS_UPLOAD: '/assets/upload',
  },
  VIDEO_DIMENSIONS: {
    WIDTH: 1280,
    HEIGHT: 720,
  },
  DEFAULT_SETTINGS: {
    BACKGROUND_PLAY_STYLE: 'fit_to_scene' as const,
    AVATAR_STYLE: 'normal' as const,
    FPS: 30,
  },
  STATUS_POLLING: {
    INTERVAL: 5000, // 5 seconds
    MAX_ATTEMPTS: 60, // 5 minutes total
  },
  RATE_LIMITS: {
    MAX_REQUESTS_PER_MINUTE: 60,
    MAX_VIDEOS_PER_HOUR: 50,
  },
} as const;