import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { OrderUserGuard } from '../../common/guards/order-user.guard.js';
import { AddWishlistProductDto } from './dto/add-wishlist-product.dto.js';
import { WishlistService } from './wishlist.service.js';

type AuthenticatedRequest = Request & {
  user: { _id: { toString(): string } };
};

@Controller('wishlist')
@UseGuards(AuthGuard, OrderUserGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post('products')
  add(
    @Req() request: AuthenticatedRequest,
    @Body() dto: AddWishlistProductDto,
  ) {
    return this.wishlistService.addProduct(
      request.user._id.toString(),
      dto.productId,
    );
  }

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.wishlistService.list(request.user._id.toString());
  }

  @Delete('products/:productId')
  remove(
    @Req() request: AuthenticatedRequest,
    @Param('productId') productId: string,
  ) {
    return this.wishlistService.removeProduct(
      request.user._id.toString(),
      productId,
    );
  }
}
