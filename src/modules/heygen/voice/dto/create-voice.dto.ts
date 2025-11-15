import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateVoiceDto {
  @IsString()
  voiceId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  language_code?: string;

  @IsOptional()
  @IsString()
  preview_audio?: string;

  @IsOptional()
  @IsBoolean()
  is_customized?: boolean;

  @IsOptional()
  @IsBoolean()
  is_premium?: boolean;

  @IsOptional()
  @IsBoolean()
  is_free?: boolean;

  @IsOptional()
  @IsString()
  tier?: string;
}