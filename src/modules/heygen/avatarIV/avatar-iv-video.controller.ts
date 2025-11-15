import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateAvatarIVVideoDto } from './dto/create-avatar-iv-video.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AvatarIVVideoService } from './avatar-iv-video.service';

@Controller('heygen/avatar-iv')
export class AvatarIVVideoController {
  constructor(private readonly avatarIVVideoService: AvatarIVVideoService) {}

  // Upload image asset
  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImageAsset(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File không được tìm thấy');
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Chỉ chấp nhận file ảnh JPEG, PNG, JPG');
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('File không được vượt quá 10MB');
    }

    return this.avatarIVVideoService.uploadImageAsset(file);
  }

  // Tạo Avatar IV video
  @Post('generate')
  @UseGuards(JwtAuthGuard)
  async createAvatarIVVideo(@Body() dto: CreateAvatarIVVideoDto) {
    // TODO: Lấy userId từ token nếu có hệ thống user
    const userId = undefined; // Tạm thời để undefined
    return this.avatarIVVideoService.createAvatarIVVideo(dto, userId);
  }

  // Lấy danh sách Avatar IV videos
  @Get()
  @UseGuards(JwtAuthGuard)
  async getAvatarIVVideos(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    // TODO: Lấy userId từ token nếu có hệ thống user
    const userId = undefined; // Tạm thời để undefined
    return this.avatarIVVideoService.getAvatarIVVideos(+page, +limit, userId);
  }

  // Lấy video theo ID
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getAvatarIVVideoById(@Param('id', ParseIntPipe) id: number) {
    return this.avatarIVVideoService.getAvatarIVVideoById(id);
  }

  // Check video status
  @Get('status/:videoId')
  @UseGuards(JwtAuthGuard)
  async checkVideoStatus(@Param('videoId') videoId: string) {
    return this.avatarIVVideoService.checkVideoStatus(videoId);
  }

  // Xóa video
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteAvatarIVVideo(@Param('id', ParseIntPipe) id: number) {
    return this.avatarIVVideoService.deleteAvatarIVVideo(id);
  }
}