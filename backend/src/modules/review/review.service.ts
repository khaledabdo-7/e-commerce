import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { UpdateReviewDto } from './dto/update-review.dto.js';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { Category } from '../../database/Model/category.model.js';
import { Brand } from '../../database/Model/brand.model.js';
import { Product } from '../../database/Model/product.model.js';
import { Review } from '../../database/Model/review.model.js';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel('Category') private readonly categoryModel: Model<Category>,
    @InjectModel('Brand') private readonly brandModel: Model<Brand>,
    @InjectModel('Product') private readonly productModel: Model<Product>,
    @InjectModel('Review') private readonly reviewModel: Model<Review>,
  ) {}

  private async assertExists(
    model: Model<any>,
    id: string | Types.ObjectId | undefined,
    label: string,
  ) {
    if (!id) return;
    if (!isValidObjectId(id))
      throw new BadRequestException(`Invalid ${label} id`);
    const exists = await model.exists({ _id: id, deletedAt: null });
    if (!exists) throw new NotFoundException(`${label} not found`);
  }

  async create(dto: CreateReviewDto, userId: Types.ObjectId) {
    const { rate, Category_id, Brand_id, Product_id } = dto;

    if (!Category_id && !Brand_id && !Product_id) {
      throw new BadRequestException(
        'Review must target a category, brand or product',
      );
    }

    await this.assertExists(this.categoryModel, Category_id, 'Category');
    await this.assertExists(this.brandModel, Brand_id, 'Brand');
    await this.assertExists(this.productModel, Product_id, 'Product');

    try {
      const review = await this.reviewModel.create({
        rate,
        User_id: userId,
        Product_id: Product_id,
        Brand_id,
        Category_id,
      });
      return { message: 'Done', review };
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException('You have already reviewed this item');
      }
      throw error;
    }
  }

  async findAll() {
    const reviews = await this.reviewModel
      .find({ deletedAt: null })
      .populate('Category_id', 'name')
      .populate('Brand_id', 'name')
      .populate('Product_id', 'name');
    return { message: 'Done', reviews };
  }

  async findOne(id: string) {
    if (!isValidObjectId(id))
      throw new BadRequestException('Invalid Review id');

    const review = await this.reviewModel
      .findOne({ _id: id, deletedAt: null })
      .populate('Category_id', 'name')
      .populate('Brand_id', 'name')
      .populate('Product_id', 'name');

    if (!review) throw new NotFoundException('Review not found');
    return { message: 'Done', review };
  }

  async update(id: string, dto: UpdateReviewDto, userId: Types.ObjectId) {
    if (!isValidObjectId(id))
      throw new BadRequestException('Invalid Review id');

    const review = await this.reviewModel.findOneAndUpdate(
      { _id: id, User_id: userId, deletedAt: null },
      { rate: dto.rate },
      { new: true, runValidators: true },
    );
    if (!review) throw new NotFoundException('Review not found');
    return { message: 'Done', review };
  }
}