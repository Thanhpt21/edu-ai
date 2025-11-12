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
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('heygen/assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  // Tạo asset mới
  @Post()
  @UseGuards(JwtAuthGuard)
  async createAsset(@Body() dto: CreateAssetDto, @CurrentUser() user: any) {
    return this.assetsService.createAsset(dto, user.id);
  }

  // Lấy danh sách asset
  @Get()
  async getAssets(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search: string = '',
    @Query('assetType') assetType: string = '',
  ) {
    return this.assetsService.getAssets(+page, +limit, search, assetType);
  }

  // Lấy tất cả asset (không phân trang)
  @Get('all/list')
  async getAllAssets(
    @Query('search') search: string = '',
    @Query('assetType') assetType: string = '',
  ) {
    return this.assetsService.getAllAssets(search, assetType);
  }

  // Lấy asset theo id
  @Get(':id')
  async getAssetById(@Param('id', ParseIntPipe) id: number) {
    return this.assetsService.getAssetById(id);
  }

  // Lấy asset theo assetId (HeyGen ID)
  @Get('heygen-id/:assetId')
  async getAssetByHeyGenId(@Param('assetId') assetId: string) {
    return this.assetsService.getAssetByHeyGenId(assetId);
  }

  // Cập nhật asset
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateAsset(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAssetDto,
  ) {
    return this.assetsService.updateAsset(id, dto);
  }

  // Xóa asset
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteAsset(@Param('id', ParseIntPipe) id: number) {
    return this.assetsService.deleteAsset(id);
  }

  // Lấy danh sách asset types có sẵn
  @Get('types/list')
  async getAvailableAssetTypes() {
    return this.assetsService.getAvailableAssetTypes();
  }
}