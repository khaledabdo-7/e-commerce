import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { Category } from '../../database/Model/category.model.js';
import { Brand } from '../../database/Model/brand.model.js';
import { Product } from '../../database/Model/product.model.js';
import { publicImageUrl, uploadDir } from '../../common/utils/multer/multer.js';

const removeUploaded = (files: Express.Multer.File[] = []) =>
  Promise.all(files.map((f) => unlink(f.path).catch(() => {})));

const removeByName = (names: string[] = []) =>
  Promise.all(names.map((n) => unlink(join(uploadDir, n)).catch(() => {})));

const toResponse = (product: any) => {
  const obj = product.toJSON();
  return { ...obj, images: obj.images.map(publicImageUrl) };
};

@Injectable()
export class ProductService {
  constructor(
    @InjectModel('Category') private readonly categoryModel: Model<Category>,
    @InjectModel('Brand') private readonly brandModel: Model<Brand>,
    @InjectModel('Product') private readonly productModel: Model<Product>,
  ) {}

  private async checkRefs(category?: string, brand?: string) {
    if (category) {
      const exists = await this.categoryModel.exists({
        _id: category,
        deletedAt: null,
      });
      if (!exists) throw new NotFoundException('Category not found');
    }
    if (brand) {
      const exists = await this.brandModel.exists({
        _id: brand,
        deletedAt: null,
      });
      if (!exists) throw new NotFoundException('Brand not found');
    }
  }

  async create(
    dto: CreateProductDto,
    userId: Types.ObjectId,
    files: Express.Multer.File[],
  ) {
    if (!files?.length) throw new BadRequestException('images are required');

    try {
      const { name, category, brand, ...rest } = dto;

      const categoryExists = await this.categoryModel.exists({
        _id: category,
        deletedAt: null,
      });
      if (!categoryExists) throw new NotFoundException('Category not found');

      const brandExists = await this.brandModel.exists({
        _id: brand,
        deletedAt: null,
      });
      if (!brandExists) throw new NotFoundException('Brand not found');
      const exists = await this.productModel.exists({
        name,
        brand,
        deletedAt: null,
      });
      if (exists) throw new ConflictException('Product name is already taken');

      const product = await this.productModel.create({
        ...rest,
        name,
        category,
        brand,
        images: files.map((f) => f.filename),
        createdBy: userId,
      });
      return { message: 'Done', product: toResponse(product) };
    } catch (error: any) {
      await removeUploaded(files);
      if (error?.code === 11000) {
        throw new ConflictException('Product name is already taken');
      }
      throw error;
    }
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    files?: Express.Multer.File[],
  ) {
    if (!isValidObjectId(id)) {
      await removeUploaded(files);
      throw new BadRequestException('Invalid product id');
    }

    try {
      const update: Record<string, any> = { ...dto };
      if (files?.length) update.images = files.map((f) => f.filename);

      if (Object.keys(update).length === 0) {
        throw new BadRequestException('Nothing to update');
      }

      const old = await this.productModel.findOne({ _id: id, deletedAt: null });
      if (!old) throw new NotFoundException('Product not found');

      await this.checkRefs(dto.category, dto.brand);

      if (dto.name !== undefined || dto.brand !== undefined) {
        const exists = await this.productModel.exists({
          _id: { $ne: id },
          name: dto.name ?? old.name,
          brand: dto.brand ?? old.brand,
          deletedAt: null,
        });
        if (exists) {
          throw new ConflictException('Product name is already taken');
        }
      }

      const product = await this.productModel.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: update },
        { new: true, runValidators: true },
      );
      if (!product) throw new NotFoundException('Product not found');

      if (files?.length) await removeByName(old.images);
      return { message: 'Done', product: toResponse(product) };
    } catch (error: any) {
      await removeUploaded(files);
      if (error?.code === 11000) {
        throw new ConflictException('Product name is already taken');
      }
      throw error;
    }
  }

  async remove(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid product id');
    }

    const product = await this.productModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true },
    );
    if (!product) throw new NotFoundException('Product not found');
    return { message: 'Done', product: toResponse(product) };
  }

  async findAll() {
    const products = await this.productModel
      .find({ deletedAt: null })
      .populate('category', 'name')
      .populate('brand', 'name');
    if (products.length === 0) {
      throw new NotFoundException('Product not found');
    }
    return { message: 'Done', products: products.map(toResponse) };
  }

  async findOne(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid product id');
    }

    const product = await this.productModel
      .findOne({ _id: id, deletedAt: null })
      .populate('category', 'name')
      .populate('brand', 'name');
    if (!product) throw new NotFoundException('Product not found');
    return { message: 'Done', product: toResponse(product) };
  }
}
