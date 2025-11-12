import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateVoiceDto {
  @IsOptional()
  @IsString()
  voiceId?: string;

  @IsOptional()
  @IsString()
  name?: string;

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
}