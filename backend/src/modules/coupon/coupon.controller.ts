import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { OrderGuard } from '../../common/guards/order-admin.guard.js';
import { OrderUserGuard } from '../../common/guards/order-user.guard.js';
import { CouponService } from './coupon.service.js';
import {
  ApplyCouponDto,
  CreateCouponDto,
  UpdateCouponDto,
} from './dto/create-coupon.dto.js';

type AuthenticatedRequest = Request & {
  user: { _id: { toString(): string } };
};

@Controller('coupon')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Post()
  @UseGuards(AuthGuard, OrderGuard)
  create(
    @Req() request: AuthenticatedRequest,
    @Body() createCouponDto: CreateCouponDto,
  ) {
    return this.couponService.create(
      createCouponDto,
      request.user._id.toString(),
    );
  }

  @Get()
  @UseGuards(AuthGuard, OrderGuard)
  findAll() {
    return this.couponService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard, OrderGuard)
  findOne(@Param('id') id: string) {
    return this.couponService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, OrderGuard)
  update(
    @Param('id') id: string,
    @Body() updateCouponDto: UpdateCouponDto,
  ) {
    return this.couponService.update(id, updateCouponDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, OrderGuard)
  remove(@Param('id') id: string) {
    return this.couponService.remove(id);
  }

  @Post('apply/:orderId')
  @UseGuards(AuthGuard, OrderUserGuard)
  apply(
    @Param('orderId') orderId: string,
    @Req() request: AuthenticatedRequest,
    @Body() applyCouponDto: ApplyCouponDto,
  ) {
    return this.couponService.preview(
      applyCouponDto.code,
      orderId,
      request.user._id.toString(),
    );
  }
}
