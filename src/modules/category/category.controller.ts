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
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryQueryDto } from './dto/category-query.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CategoriesService } from './category.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // Tạo category mới (admin)
  @Post()
  @UseGuards(JwtAuthGuard)
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.createCategory(dto);
  }

  // Lấy danh sách categories (có phân trang)
  @Get()
  async getCategories(@Query() query: CategoryQueryDto) {
    return this.categoriesService.getCategories(query);
  }

  // Lấy tất cả categories (không phân trang)
  @Get('all/list')
  async getAllCategories(@Query('search') search: string = '') {
    return this.categoriesService.getAllCategories(search);
  }

  // Lấy category theo id
  @Get(':id')
  async getCategoryById(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.getCategoryById(id);
  }

  // Cập nhật category (admin)
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateCategory(
    @Param('id', ParseIntPipe) id: number, 
    @Body() dto: UpdateCategoryDto
  ) {
    return this.categoriesService.updateCategory(id, dto);
  }

  // Xóa category (admin)
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteCategory(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.deleteCategory(id);
  }
}