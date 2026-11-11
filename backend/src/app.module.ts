import path from 'node:path';

import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createObserveModule } from '@nestjs/observe';
import { MongooseModule } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import { MongoConnectionModule } from './database/Monogo.connection.js';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { RedisConnectionModule } from './database/connectionRedis.js';
import { EmailModule } from './common/email/email.module.js';
import {MiddleWare} from './common/middleware/logger.middleware.js'
import { CategoryModule } from './modules/category/category.module.js';
import { BrandModule } from './modules/brand/brand.module.js';
import { ProductModule } from './modules/product/product.module.js';
import { CartModule } from './modules/cart/cart.module.js';
import { ReviewModule } from './modules/review/review.module.js';
import { CouponModule } from './modules/coupon/coupon.module.js';
import { OrderModule } from './modules/order/order.module.js';
import { WishlistModule } from './modules/wishlist/wishlist.module.js';
import { AddressModule } from './modules/address/address.module.js';
import { PaymentModule } from './modules/payment/payment.module.js';
import { NotificationModule } from './modules/notification/notification.module.js';
import { AdminDashboardModule } from './modules/admin-dashboard/admin-dashboard.module.js';
import { MediaModule } from './modules/media/media.module.js';

const envFilePath = path.resolve(
  process.cwd(),
  'src',
  'config',
  `${process.env.NODE_ENV ?? 'dev'}.env`,
);

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath,
    }),
    MongoConnectionModule,
  RedisConnectionModule,
    AuthModule,
    EmailModule,
    CategoryModule,
    BrandModule,
    ProductModule,
    CartModule,
    ReviewModule,
    CouponModule,
    OrderModule,
    WishlistModule,
    AddressModule,
    PaymentModule,
    NotificationModule,
    AdminDashboardModule,
    MediaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
      consumer.apply(MiddleWare).forRoutes(AppController)
  }
}
