import { HeygenTemplate, BackgroundPlayStyle } from '@prisma/client';

export class TemplateResponseDto {
  id: number;
  name: string;
  description?: string;
  avatarId: number;
  voiceId: number;
  backgroundType?: string;
  backgroundColor?: string;
  backgroundUrl?: string;
  backgroundPlayStyle?: BackgroundPlayStyle;
  inputText?: string;
  isPublic: boolean;
  createdBy?: number;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(template: HeygenTemplate) {
    this.id = template.id;
    this.name = template.name;
    this.description = template.description ?? undefined;
    this.avatarId = template.avatarId;
    this.voiceId = template.voiceId;
    this.backgroundType = template.backgroundType ?? undefined;
    this.backgroundColor = template.backgroundColor ?? undefined;
    this.backgroundUrl = template.backgroundUrl ?? undefined;
    this.backgroundPlayStyle = template.backgroundPlayStyle ?? undefined;
    this.inputText = template.inputText ?? undefined;
    this.isPublic = template.isPublic;
    this.createdBy = template.createdBy ?? undefined;
    this.usageCount = template.usageCount;
    this.createdAt = template.createdAt;
    this.updatedAt = template.updatedAt;
  }
}