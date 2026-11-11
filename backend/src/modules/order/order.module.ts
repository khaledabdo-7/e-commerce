
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderService } from './order.service.js';
import { OrderController } from './order.controller.js';
import { TokenModule } from '../../common/services/token.module.js';
import { UserModel } from '../../database/Model/user.model.js';
import { OrderModel, OrderSchema } from '../../database/Model/order.model.js';
import { Product, ProductModel } from '../../database/Model/product.model.js';
import { CouponModule } from '../coupon/coupon.module.js';
import { AddressModule } from '../address/address.module.js';
import { NotificationModule } from '../notification/notification.module.js';

@Module({
  imports: [
    TokenModule,
    CouponModule,
    AddressModule,
    NotificationModule,
    MongooseModule.forFeature([
      { name: 'User', schema: UserModel },
      { name: OrderModel.name, schema: OrderSchema },
      { name: Product.name, schema: ProductModel },
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
