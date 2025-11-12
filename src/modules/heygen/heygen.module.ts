import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios'; // THÊM IMPORT

import { AssetsModule } from './assets/assets.module';
import { TemplatesModule } from './templates/templates.module';
import { HeyGenApiModule } from './shared/heygen-api.module';
import { AvatarsModule } from './avatar/avatar.module';
import { VoicesModule } from './voice/voice.module';
import { VideosModule } from './video/video.module';

@Module({
  imports: [
    HttpModule.register({ // THÊM DÒNG NÀY
      timeout: 30000,
      maxRedirects: 5,
    }),
    HeyGenApiModule,
    AvatarsModule,
    VoicesModule,
    VideosModule,
    AssetsModule,
    TemplatesModule,
  ],
  exports: [
    HeyGenApiModule,
    AvatarsModule,
    VoicesModule,
    VideosModule,
    AssetsModule,
    TemplatesModule,
  ],
})
export class HeyGenModule {}