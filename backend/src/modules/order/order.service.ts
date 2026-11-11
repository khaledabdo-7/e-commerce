
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OrderModel } from '../../database/Model/order.model.js';
import { Product } from '../../database/Model/product.model.js';
import { CouponService } from '../coupon/coupon.service.js';
import { AddressService } from '../address/address.service.js';
import { NotificationService } from '../notification/notification.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order.dto.js';
import { OrderStatus, PaymentStatus } from '../../common/enum/order.enum.js';


@Injectable()
export class OrderService {
  constructor(
    @InjectModel(OrderModel.name)
    private readonly orderModel: Model<OrderModel>,
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
    private readonly couponService: CouponService,
    private readonly addressService: AddressService,
    private readonly notificationService: NotificationService,
  ) {}

  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user id');
    }
    const shippingAddress = await this.addressService.getOwned(
      userId,
      createOrderDto.shippingAddress,
    );

    const productIds = createOrderDto.items.map(
      (item) => new Types.ObjectId(item.product),
    );
    const products = await this.productModel
      .find({ _id: { $in: productIds }, deletedAt: null })
      .exec();
    const productsById = new Map(
      products.map((product) => [product._id.toString(), product]),
    );
    if (productsById.size !== new Set(productIds.map(String)).size) {
      throw new NotFoundException('One or more products are unavailable');
    }

    const items = createOrderDto.items.map((item) => {
      const product = productsById.get(item.product);
      if (!product) throw new NotFoundException('Product not found');
      if (product.stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for ${product.name}`);
      }
      return {
        product: new Types.ObjectId(item.product),
        quantity: item.quantity,
        price:
          Math.round(product.price * (1 - product.discount / 100) * 100) / 100,
      };
    });
    const subtotal =
      Math.round(
        items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100,
      ) / 100;
    let order = await this.orderModel.create({
      user: new Types.ObjectId(userId),
      items,
      shippingAddress: shippingAddress._id,
      paymentMethod: createOrderDto.paymentMethod,
      notes: createOrderDto.notes,
      subtotal,
      shippingFee: 0,
      discount: 0,
      total: subtotal,
      paymentStatus: PaymentStatus.PENDING,
      status: OrderStatus.PENDING,
    });

    if (createOrderDto.couponCode) {
      try {
        const redemption = await this.couponService.redeem(
          createOrderDto.couponCode,
          userId,
          order._id.toString(),
          subtotal,
        );
        order.coupon = redemption.coupon._id;
        order.couponCode = redemption.coupon.code;
        order.couponUsageRecorded = true;
        order.discount = redemption.discount;
        order.total = Math.max(0, subtotal - redemption.discount);
        order = await order.save();
      } catch (error) {
        await this.couponService.release(order._id.toString());
        await this.orderModel.deleteOne({ _id: order._id });
        throw error;
      }
    }

    await this.notificationService.create(userId, {
      type: 'order',
      title: 'Order placed',
      message: `Your order ${order._id.toString()} has been placed.`,
      data: { orderId: order._id.toString() },
    });
    return order;
  }

  async getMyOrders(userId: string) {
    return this.orderModel
      .find({ user: userId })
      .populate('items.product')
      .populate('shippingAddress')
      .sort({ createdAt: -1 });
  }

  async getOrderById(orderId: string, userId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order id');
    }

    const order = await this.orderModel
      .findById(orderId)
      .populate('items.product')
      .populate('shippingAddress');

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.user.toString() !== userId) {
      throw new ForbiddenException('You cannot access this order');
    }

    return order;
  }

  async cancelOrder(orderId: string, userId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order id');
    }

    const order = await this.orderModel.findOne({
      _id: orderId,
      user: userId,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status)) {
      throw new BadRequestException('This order cannot be cancelled');
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();

    await order.save();
    if (order.couponUsageRecorded) {
      await this.couponService.release(order._id.toString());
      order.couponUsageRecorded = false;
      await order.save();
    }
    await this.notificationService.create(userId, {
      type: 'order',
      title: 'Order cancelled',
      message: `Your order ${order._id.toString()} has been cancelled.`,
      data: { orderId: order._id.toString(), status: OrderStatus.CANCELLED },
    });
    return order;
  }

  async updateOrderStatus(
    orderId: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order id');
    }

    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const previousStatus = order.status;
    if (updateOrderStatusDto.status === OrderStatus.CANCELLED) {
      order.cancelledAt = new Date();
    }

    if (updateOrderStatusDto.status === OrderStatus.DELIVERED) {
      order.deliveredAt = new Date();
    }

    order.status = updateOrderStatusDto.status;

    await order.save();
    if (
      updateOrderStatusDto.status === OrderStatus.CANCELLED &&
      order.couponUsageRecorded
    ) {
      await this.couponService.release(order._id.toString());
      order.couponUsageRecorded = false;
      await order.save();
    }
    if (previousStatus !== order.status) {
      await this.notificationService.create(order.user, {
        type: 'order',
        title: 'Order status updated',
        message: `Your order ${order._id.toString()} is now ${order.status}.`,
        data: { orderId: order._id.toString(), status: order.status },
      });
    }
    return order;
  }

  async getAllOrders() {
    return this.orderModel
      .find()
      .populate('user')
      .populate('items.product')
      .populate('shippingAddress')
      .sort({ createdAt: -1 });
  }
}
