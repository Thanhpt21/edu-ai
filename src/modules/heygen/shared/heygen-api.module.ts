import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { HeyGenApiService } from './heygen-api.service';

@Global()
@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  providers: [HeyGenApiService],
  exports: [HeyGenApiService, HttpModule],
})
export class HeyGenApiModule {}