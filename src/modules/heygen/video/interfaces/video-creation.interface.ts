export interface IVideoCreationData {
  avatarId: number;
  voiceId: number;
  inputText: string;
  title?: string;
  lessonId?: number;
  userId?: number;
  
  backgroundType?: string;
  backgroundColor?: string;
  backgroundImageUrl?: string;
  backgroundVideoUrl?: string;
  backgroundPlayStyle?: string;
  
  dimensionWidth?: number;
  dimensionHeight?: number;
  isWebM?: boolean;
}

export interface IHeyGenVideoRequest {
  avatarId: string;
  voiceId: string;
  inputText: string;
  background?: {
    type: 'color' | 'image' | 'video';
    value?: string;
    background_play_style?: string;
  };
  dimension?: {
    width: number;
    height: number;
  };
}