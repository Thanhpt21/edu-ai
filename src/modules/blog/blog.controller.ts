import { 
  Controller, Get, Post, Put, Delete, Body, Param, 
  ParseIntPipe, UseGuards, Query, UseInterceptors, 
  UploadedFile 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BlogService } from './blog.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@Controller('blogs')

export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('create_blogs')
  @UseInterceptors(FileInterceptor('thumb'))
  async create(
    @Body() dto: CreateBlogDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.blogService.create(dto, file);
  }

  @Get()
  @Permissions('read_blogs')
  async getBlogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search: string = '',
  ) {
    return this.blogService.getBlogs(page, limit, search);
  }

  @Get('slug/:slug') 
  @Permissions('get_blog_by_slug')  
  async getBlogBySlug(@Param('slug') slug: string) {
    return this.blogService.getBlogBySlug(slug);
  }

  @Get('all/list')
  @Permissions('read_all_blogs')
  async getAll(@Query('search') search: string = '') {
    return this.blogService.getAll(search);
  }

  @Get(':id')
  @Permissions('get_a_blog')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.blogService.getById(id);
  }



  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('update_blogs')
  @UseInterceptors(FileInterceptor('thumb'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBlogDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.blogService.update(id, dto, file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('delete_blogs')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.blogService.delete(id);
  }
}
