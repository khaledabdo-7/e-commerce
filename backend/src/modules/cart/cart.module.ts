import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CartController } from './cart.controller.js';
import { CartService } from './cart.service.js';
import { CartModel } from '../../database/Model/cart.model.js';
import { ProductModel } from '../../database/Model/product.model.js';
import { TokenModule } from '../../common/services/token.module.js';
import { CategoryModel } from '../../database/Model/category.model.js';
import { BrandModel } from '../../database/Model/brand.model.js';
import { UserModel } from '../../database/Model/user.model.js';

@Module({
  imports: [
    TokenModule,
    MongooseModule.forFeature([
      { name: 'Cart', schema: CartModel },
      { name: 'Product', schema: ProductModel },
      { name: 'Category', schema: CategoryModel },
      { name: 'Brand', schema: BrandModel },
      { name: 'User', schema: UserModel },
    ]),
  ],
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}
