import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { OrderService } from './order.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order.dto.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { OrderGuard } from '../../common/guards/order-admin.guard.js';
import { OrderUserGuard } from '../../common/guards/order-user.guard.js';

type AuthenticatedRequest = Request & {
  user: { _id: string };
};

@Controller('order')
@UseGuards(AuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @UseGuards(OrderUserGuard)
  create(
    @Req() req: AuthenticatedRequest,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.orderService.createOrder(
      req.user._id.toString(),
      createOrderDto,
    );
  }

  @Get('my-orders')
  @UseGuards(OrderUserGuard)
  findMyOrders(@Req() req: AuthenticatedRequest) {
    return this.orderService.getMyOrders(
      req.user._id.toString(),
    );
  }

  @Get('all')
  @UseGuards(OrderGuard)
  findAll() {
    return this.orderService.getAllOrders();
  }

  @Get(':id')
  @UseGuards(OrderUserGuard)
  findOne(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.orderService.getOrderById(
      id,
      req.user._id.toString(),
    );
  }

  @Patch(':id/status')
  @UseGuards(OrderGuard)
  updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateOrderStatus(
      id,
      updateOrderStatusDto,
    );
  }

  @Delete(':id')
  @UseGuards(OrderUserGuard)
  cancel(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.orderService.cancelOrder(
      id,
      req.user._id.toString(),
    );
  }
}

