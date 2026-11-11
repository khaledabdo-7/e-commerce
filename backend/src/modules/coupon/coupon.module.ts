import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TokenModule } from '../../common/services/token.module.js';
import { OrderGuard } from '../../common/guards/order-admin.guard.js';
import { OrderUserGuard } from '../../common/guards/order-user.guard.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { User, UserModel } from '../../database/Model/user.model.js';
import { OrderModel, OrderSchema } from '../../database/Model/order.model.js';
import { CouponSchema } from '../../database/Model/coupon.model.js';
import { CouponRedemptionSchema } from '../../database/Model/coupon-redemption.model.js';
import { CouponService } from './coupon.service.js';
import { CouponController } from './coupon.controller.js';

@Module({
  imports: [
    TokenModule,
    MongooseModule.forFeature([
      { name: 'Coupon', schema: CouponSchema },
      { name: 'CouponRedemptionModel', schema: CouponRedemptionSchema },
      { name: OrderModel.name, schema: OrderSchema },
      { name: User.name, schema: UserModel },
    ]),
  ],
  controllers: [CouponController],
  providers: [CouponService, AuthGuard, OrderGuard, OrderUserGuard],
  exports: [CouponService],
})
export class CouponModule {}
