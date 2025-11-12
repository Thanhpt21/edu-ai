// payouts.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  BadRequestException,
  ValidationPipe,
  Request,
} from '@nestjs/common';
import { PayoutsService } from './payouts.service';
import { CreatePayoutDto } from './dto/create-payout.dto';
import { UpdatePayoutDto } from './dto/update-payout.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';

@Controller('payouts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Post()
  @Permissions('create_payouts')
  async create(@Body(new ValidationPipe()) dto: CreatePayoutDto, @Request() req) {
    const userId = req.user.id;
    return this.payoutsService.create(dto, userId);
  }

  @Get()
  @Permissions('read_payouts')
  async getAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('search') search: string = '',
  ) {
    return this.payoutsService.getPayouts(
      +page,
      +limit,
      status,
      search,
    );
  }

  @Get(':id')
  @Permissions('get_a_payouts')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.payoutsService.getPayoutById(id);
  }

  @Put(':id')
  @Permissions('update_payouts')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe()) dto: UpdatePayoutDto,
  ) {
    return this.payoutsService.updatePayout(id, dto);
  }

  @Delete(':id')
  @Permissions('delete_payouts')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.payoutsService.deletePayout(id);
  }
}
