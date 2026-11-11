import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoryService } from './category.service.js';
import { CategoryController } from './category.controller.js';
import {
  Category,
  CategoryModel,
} from '../../database/Model/category.model.js';
import { User, UserModel } from '../../database/Model/user.model.js';
import { TokenModule } from '../../common/services/token.module.js';

@Module({
  imports: [
    TokenModule,
    MongooseModule.forFeature([
      { name: Category.name, schema: CategoryModel },
      { name: User.name, schema: UserModel },
    ]),
  ],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}
