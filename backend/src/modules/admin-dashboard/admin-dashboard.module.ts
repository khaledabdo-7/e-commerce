import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { OrderGuard } from '../../common/guards/order-admin.guard.js';
import { TokenModule } from '../../common/services/token.module.js';
import { OrderModel, OrderSchema } from '../../database/Model/order.model.js';
import { Product, ProductModel } from '../../database/Model/product.model.js';
import { User, UserModel } from '../../database/Model/user.model.js';
import { AdminDashboardController } from './admin-dashboard.controller.js';
import { AdminDashboardService } from './admin-dashboard.service.js';

@Module({
  imports: [
    TokenModule,
    MongooseModule.forFeature([
      { name: OrderModel.name, schema: OrderSchema },
      { name: Product.name, schema: ProductModel },
      { name: User.name, schema: UserModel },
    ]),
  ],
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService, AuthGuard, OrderGuard],
})
export class AdminDashboardModule {}
