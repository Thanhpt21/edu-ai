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
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagQueryDto } from './dto/tag-query.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  // Tạo tag mới (admin)
  @Post()
  @UseGuards(JwtAuthGuard)
  async createTag(@Body() dto: CreateTagDto) {
    return this.tagsService.createTag(dto);
  }

  // Lấy danh sách tags (có phân trang)
  @Get()
  async getTags(@Query() query: TagQueryDto) {
    return this.tagsService.getTags(query);
  }

  // Lấy tất cả tags (không phân trang)
  @Get('all/list')
  async getAllTags(@Query('search') search: string = '') {
    return this.tagsService.getAllTags(search);
  }

  // Lấy tag theo id
  @Get(':id')
  async getTagById(@Param('id', ParseIntPipe) id: number) {
    return this.tagsService.getTagById(id);
  }

  // Cập nhật tag (admin)
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateTag(
    @Param('id', ParseIntPipe) id: number, 
    @Body() dto: UpdateTagDto
  ) {
    return this.tagsService.updateTag(id, dto);
  }

  // Xóa tag (admin)
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteTag(@Param('id', ParseIntPipe) id: number) {
    return this.tagsService.deleteTag(id);
  }
}