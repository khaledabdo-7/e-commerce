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
import { Types } from 'mongoose';
import { CartService } from './cart.service.js';
import { AddToCartDto } from './dto/create-cart.dto.js';
import { UpdateCartItemDto } from './dto/update-cart.dto.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';

type AuthRequest = Request & { user: { _id: Types.ObjectId } };

@Controller('cart')
@UseGuards(AuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Req() req: AuthRequest) {
    return this.cartService.getCart(req.user._id);
  }

  @Post('/add')
  addItem(@Body() dto: AddToCartDto, @Req() req: AuthRequest) {
    return this.cartService.addItem(req.user._id, dto);
  }

  @Patch('/update/:productId')
  updateItem(
    @Param('productId') productId: string,
    @Body() dto: UpdateCartItemDto,
    @Req() req: AuthRequest,
  ) {
    return this.cartService.updateItem(req.user._id, productId, dto.quantity);
  }

  @Delete('/remove/:productId')
  removeItem(@Param('productId') productId: string, @Req() req: AuthRequest) {
    return this.cartService.removeItem(req.user._id, productId);
  }

  @Delete('/clear')
  clear(@Req() req: AuthRequest) {
    return this.cartService.clear(req.user._id);
  }
}
