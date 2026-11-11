import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { OrderUserGuard } from '../../common/guards/order-user.guard.js';
import { TokenModule } from '../../common/services/token.module.js';
import { AddressSchema } from '../../database/Model/address.model.js';
import { OrderModel, OrderSchema } from '../../database/Model/order.model.js';
import { PaymentSchema } from '../../database/Model/payment.model.js';
import { UserModel } from '../../database/Model/user.model.js';
import { CouponModule } from '../coupon/coupon.module.js';
import { NotificationModule } from '../notification/notification.module.js';
import { PaymentController } from './payment.controller.js';
import { PaymentService } from './payment.service.js';

@Module({
  imports: [
    TokenModule,
    CouponModule,
    NotificationModule,
    MongooseModule.forFeature([
      { name: 'PaymentModel', schema: PaymentSchema },
      { name: OrderModel.name, schema: OrderSchema },
      { name: 'AddressModel', schema: AddressSchema },
      { name: 'User', schema: UserModel },
    ]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, AuthGuard, OrderUserGuard],
})
export class PaymentModule {}
