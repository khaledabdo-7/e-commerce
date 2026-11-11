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
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { Category } from '../../database/Model/category.model.js';
import { User } from '../../database/Model/user.model.js';
import { uploadDir } from '../../common/utils/multer/multer.js';

const removeFile = (path?: string) =>
  path ? unlink(path).catch(() => {}) : Promise.resolve();

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel('Category') private readonly CategoryModel: Model<Category>,
    @InjectModel('User') private readonly userModel: Model<User>,
  ) {}

  async create(
    dto: CreateCategoryDto,
    userId: Types.ObjectId,
    file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('image is required');

    const { name } = dto;

    try {
      const exists = await this.CategoryModel.exists({ name, deletedAt: null });
      if (exists) throw new ConflictException('Category name is already taken');

      return await this.CategoryModel.create({
        name,
        image: file.filename,
        createdBy: userId,
      });
    } catch (error: any) {
      await removeFile(file.path);
      if (error?.code === 11000) {
        throw new ConflictException('Category name is already taken');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateCategoryDto, file?: Express.Multer.File) {
    if (!isValidObjectId(id)) {
      await removeFile(file?.path);
      throw new BadRequestException('Invalid category id');
    }

    const { name } = dto;
    const update: Partial<Pick<Category, 'name' | 'image'>> = {};
    if (name !== undefined) update.name = name;
    if (file) update.image = file.filename;

    if (Object.keys(update).length === 0) {
      throw new BadRequestException('Nothing to update');
    }

    try {
      if (name !== undefined) {
        const exists = await this.CategoryModel.exists({
          _id: { $ne: id },
          name,
          deletedAt: null,
        });
        if (exists)
          throw new ConflictException('Category name is already taken');
      }

      const old = await this.CategoryModel.findOne({
        _id: id,
        deletedAt: null,
      });
      if (!old) throw new NotFoundException('Category not found');

      const category = await this.CategoryModel.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: update },
        { new: true, runValidators: true },
      );
      if (!category) throw new NotFoundException('Category not found');

      if (file && old.image) await removeFile(join(uploadDir, old.image));
      return category;
    } catch (error: any) {
      await removeFile(file?.path);
      if (error?.code === 11000) {
        throw new ConflictException('Category name is already taken');
      }
      throw error;
    }
  }

  async remove(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid category id');
    }
    const category = await this.CategoryModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true },
    );
    if (!category) throw new NotFoundException('Category not found');
    return { message: 'Done', category };
  }

  async findAll() {
    const findCategory = await this.CategoryModel.find({ deletedAt: null });
    if (findCategory.length === 0) {
      throw new NotFoundException('Category not found');
    }
    return { message: 'Done', findCategory };
  }

  async findById(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid category id');
    }
    const category = await this.CategoryModel.findOne({
      _id: id,
      deletedAt: null,
    });
    if (!category) throw new NotFoundException('Category not found');
    return { message: 'Done', category };
  }
}
