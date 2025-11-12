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
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('heygen/templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  // Tạo template mới
  @Post()
  @UseGuards(JwtAuthGuard)
  async createTemplate(@Body() dto: CreateTemplateDto, @CurrentUser() user: any) {
    return this.templatesService.createTemplate(dto, user.id);
  }

  // Lấy danh sách template
  @Get()
  async getTemplates(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search: string = '',
    @Query('isPublic') isPublic: string = '',
  ) {
    return this.templatesService.getTemplates(+page, +limit, search, isPublic);
  }

  // Lấy template public (không cần auth)
  @Get('public')
  async getPublicTemplates(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search: string = '',
  ) {
    return this.templatesService.getPublicTemplates(+page, +limit, search);
  }

  // Lấy template theo id
  @Get(':id')
  async getTemplateById(@Param('id', ParseIntPipe) id: number) {
    return this.templatesService.getTemplateById(id);
  }

  // Cập nhật template
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateTemplate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.templatesService.updateTemplate(id, dto);
  }

  // Xóa template
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteTemplate(@Param('id', ParseIntPipe) id: number) {
    return this.templatesService.deleteTemplate(id);
  }

  // Tăng usage count
  @Post(':id/use')
  @UseGuards(JwtAuthGuard)
  async useTemplate(@Param('id', ParseIntPipe) id: number) {
    return this.templatesService.incrementUsageCount(id);
  }

  // Clone template
  @Post(':id/clone')
  @UseGuards(JwtAuthGuard)
  async cloneTemplate(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.templatesService.cloneTemplate(id, user.id);
  }
}