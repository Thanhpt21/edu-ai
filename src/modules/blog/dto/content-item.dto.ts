// dto/content-item.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class ContentItemDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;
}

