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
  HttpCode,
} from '@nestjs/common';

import { CreateAvatarDto } from './dto/create-avatar.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AvatarsService } from './avatar.service';

@Controller('heygen/avatars')
export class AvatarsController {
  constructor(private readonly avatarsService: AvatarsService) {}


    // Sync avatars từ HeyGen API
  @Post('sync')
  async syncAvatars() {
    return this.avatarsService.syncAvatarsFromHeyGen();
  }

  // Debug HeyGen API response
  @Get('debug')
  async debugHeyGenAvatars() {
    return this.avatarsService.debugHeyGenAvatars();
  }
  
  // Tạo avatar mới
  @Post()
  @UseGuards(JwtAuthGuard)
  async createAvatar(@Body() dto: CreateAvatarDto) {
    return this.avatarsService.createAvatar(dto);
  }

  // Lấy danh sách avatar
  @Get()
  async getAvatars(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search: string = '',
  ) {
    return this.avatarsService.getAvatars(+page, +limit, search);
  }

  // Lấy tất cả avatar (không phân trang)
  @Get('all/list')
  async getAllAvatars(@Query('search') search: string = '') {
    return this.avatarsService.getAllAvatars(search);
  }

  // Lấy avatar theo id
  @Get(':id')
  async getAvatarById(@Param('id', ParseIntPipe) id: number) {
    return this.avatarsService.getAvatarById(id);
  }

  // Cập nhật avatar
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateAvatar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAvatarDto,
  ) {
    return this.avatarsService.updateAvatar(id, dto);
  }

  // Xóa avatar
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteAvatar(@Param('id', ParseIntPipe) id: number) {
    return this.avatarsService.deleteAvatar(id);
  }
}