import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BrandService } from './brand.service.js';
import { BrandController } from './brand.controller.js';
import {
  Category,
  CategoryModel,
} from '../../database/Model/category.model.js';
import { User, UserModel } from '../../database/Model/user.model.js';
import { TokenModule } from '../../common/services/token.module.js';
import { Brand, BrandModel } from '../../database/Model/brand.model.js';

@Module({
  imports: [
    TokenModule,
    MongooseModule.forFeature([
      { name: Category.name, schema: CategoryModel },
      { name: User.name, schema: UserModel },
      { name: Brand.name, schema: BrandModel },
    ]),
  ],
  controllers: [BrandController],
  providers: [BrandService],
})
export class BrandModule {}
