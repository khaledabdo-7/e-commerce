import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductService } from './product.service.js';
import { ProductController } from './product.controller.js';
import { ProductModel } from '../../database/Model/product.model.js';
import { CategoryModel } from '../../database/Model/category.model.js';
import { BrandModel } from '../../database/Model/brand.model.js';
import { TokenModule } from '../../common/services/token.module.js';
import { UserModel } from '../../database/Model/user.model.js';
import { ReviewModel } from '../../database/Model/review.model.js';

@Module({
  imports: [
    TokenModule,
    MongooseModule.forFeature([
      { name: 'Product', schema: ProductModel },
      { name: 'Category', schema: CategoryModel },
      { name: 'Brand', schema: BrandModel },
      { name: 'User', schema: UserModel },
      { name: 'Review', schema: ReviewModel },
    ]),
  ],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
