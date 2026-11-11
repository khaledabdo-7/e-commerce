import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { OrderUserGuard } from '../../common/guards/order-user.guard.js';
import { TokenModule } from '../../common/services/token.module.js';
import { ProductModel } from '../../database/Model/product.model.js';
import { UserModel } from '../../database/Model/user.model.js';
import { WishlistSchema } from '../../database/Model/wishlist.model.js';
import { WishlistController } from './wishlist.controller.js';
import { WishlistService } from './wishlist.service.js';

@Module({
  imports: [
    TokenModule,
    MongooseModule.forFeature([
      { name: 'WishlistModel', schema: WishlistSchema },
      { name: 'Product', schema: ProductModel },
      { name: 'User', schema: UserModel },
    ]),
  ],
  controllers: [WishlistController],
  providers: [WishlistService, AuthGuard, OrderUserGuard],
})
export class WishlistModule {}
