import { IsString, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';

export class CreateAvatarIVVideoDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  imageKey: string;

  @IsString()
  @IsNotEmpty()
  script: string;

  @IsString()
  @IsNotEmpty()
  voiceId: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  customMotion?: string;

  @IsOptional()
  @IsBoolean()
  enhanceMotion?: boolean;
}