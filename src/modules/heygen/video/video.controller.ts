import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { GenerateVideoDto } from './dto/generate-video.dto';
import { VideoQueryDto } from './dto/video-query.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { VideosService } from './video.service';
import { HeyGenApiService } from '../shared/heygen-api.service';
import { PrismaService } from 'prisma/prisma.service';

@Controller('heygen/videos')
export class VideosController {
  constructor(private readonly videosService: VideosService, private heygenApiService: HeyGenApiService, private prisma: PrismaService) {}

  // Tạo video mới
  @Post()
  @UseGuards(JwtAuthGuard)
  async createVideo(@Body() dto: CreateVideoDto, @CurrentUser() user: any) {
    return this.videosService.createVideo(dto, user.id);
  }

  @Get('debug/heygen-status/:videoId')
  async debugHeyGenStatus(@Param('videoId') videoId: string) {
    try {
      const status = await this.heygenApiService.getVideoStatus(videoId);
      return {
        success: true,
        message: 'Status from HeyGen API',
        data: status
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get status from HeyGen',
        error: error.message,
        response: error.response?.data
      };
    }
  }

  // Generate video với HeyGen API
  @Post('generate')
  @UseGuards(JwtAuthGuard)
  async generateVideo(@Body() dto: GenerateVideoDto, @CurrentUser() user: any) {
    return this.videosService.generateVideo(dto, user.id);
  }

  // Lấy danh sách video
  @Get()
  async getVideos(@Query() query: VideoQueryDto) {
    return this.videosService.getVideos(query);
  }

  // Lấy video theo id
  @Get(':id')
  async getVideoById(@Param('id', ParseIntPipe) id: number) {
    return this.videosService.getVideoById(id);
  }

  // Lấy video theo videoId (HeyGen ID)
  @Get('heygen-id/:videoId')
  async getVideoByHeyGenId(@Param('videoId') videoId: string) {
    return this.videosService.getVideoByHeyGenId(videoId);
  }

@Get('test-download/:id')
async testDownload(@Param('id', ParseIntPipe) id: number) {
  const video = await this.prisma.heygenVideo.findUnique({ 
    where: { id } 
  });
  
  if (!video) {
    return { success: false, error: 'Video not found' };
  }

  // KIỂM TRA VIDEO URL CÓ TỒN TẠI KHÔNG
  if (!video.videoUrl) {
    return { 
      success: false, 
      error: 'Video URL not available',
      videoData: {
        id: video.id,
        videoId: video.videoId,
        status: video.status,
        hasVideoUrl: false
      }
    };
  }

  try {
    // Test download trực tiếp
    const testUrl = video.videoUrl;
    console.log(`🧪 Testing download from: ${testUrl}`);
    
    const response = await fetch(testUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const buffer = await response.arrayBuffer();
    const sizeMB = (buffer.byteLength / 1024 / 1024).toFixed(2);
    
    return {
      success: true,
      data: {
        url: testUrl, 
        size: `${sizeMB} MB`,
        contentLength: response.headers.get('content-length'),
        contentType: response.headers.get('content-type'),
        status: response.status,
        ok: response.ok
      },
      videoData: {
        id: video.id,
        videoId: video.videoId,
        status: video.status,
        hasVideoUrl: true
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      url: video.videoUrl,
      videoData: {
        id: video.id,
        videoId: video.videoId,
        status: video.status,
        hasVideoUrl: true
      }
    };
  }
}

  // Đồng bộ status video
  @Put(':id/sync-status')
  async syncVideoStatus(@Param('id', ParseIntPipe) id: number) {
    return this.videosService.syncVideoStatus(id);
  }

  // Đồng bộ tất cả pending videos (cho admin)
  @Post('sync/pending')
  async syncPendingVideos() {
    return this.videosService.syncPendingVideos();
  }

  // Cập nhật video
  @Put(':id')
  async updateVideo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVideoDto,
  ) {
    return this.videosService.updateVideo(id, dto);
  }

  // Xóa video
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteVideo(@Param('id', ParseIntPipe) id: number) {
    return this.videosService.deleteVideo(id);
  }

  // Retry video generation
  @Post(':id/retry')
  @UseGuards(JwtAuthGuard)
  async retryVideo(@Param('id', ParseIntPipe) id: number) {
    return this.videosService.retryVideo(id);
  }

  // Get video status
  @Get(':id/status')
  async getVideoStatus(@Param('id', ParseIntPipe) id: number) {
    return this.videosService.getVideoStatus(id);
  }
}