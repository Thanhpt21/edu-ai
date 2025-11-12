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

import { CreateVoiceDto } from './dto/create-voice.dto';
import { UpdateVoiceDto } from './dto/update-voice.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { VoicesService } from './voice.service';

@Controller('heygen/voices')
export class VoicesController {
  constructor(private readonly voicesService: VoicesService) {}

   // Debug HeyGen Voices API - PHẢI ĐẶT TRƯỚC :id routes
  @Get('debug')
  async debugHeyGenVoices() {
    return this.voicesService.debugHeyGenVoices();
  }

  // Sync voices từ HeyGen API
  @Post('sync')
  async syncVoices() {
    return this.voicesService.syncVoicesFromHeyGen();
  }

  // Tạo voice mới
  @Post()
  @UseGuards(JwtAuthGuard)
  async createVoice(@Body() dto: CreateVoiceDto) {
    return this.voicesService.createVoice(dto);
  }

  // Lấy danh sách voice
  @Get()
  async getVoices(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search: string = '',
    @Query('language') language: string = '',
  ) {
    return this.voicesService.getVoices(+page, +limit, search, language);
  }

  // Lấy tất cả voice (không phân trang)
  @Get('all/list')
  async getAllVoices(
    @Query('search') search: string = '',
    @Query('language') language: string = '',
  ) {
    return this.voicesService.getAllVoices(search, language);
  }

  // Lấy voice theo id
  @Get(':id')
  async getVoiceById(@Param('id', ParseIntPipe) id: number) {
    return this.voicesService.getVoiceById(id);
  }

  // Cập nhật voice
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateVoice(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVoiceDto,
  ) {
    return this.voicesService.updateVoice(id, dto);
  }

  // Xóa voice
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteVoice(@Param('id', ParseIntPipe) id: number) {
    return this.voicesService.deleteVoice(id);
  }

  // Lấy danh sách languages có sẵn
  @Get('languages/list')
  async getAvailableLanguages() {
    return this.voicesService.getAvailableLanguages();
  }
}