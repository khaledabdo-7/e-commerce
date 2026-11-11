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
import { CreateBrandDto } from './dto/create-brand.dto.js';
import { UpdateBrandDto } from './dto/update-brand.dto.js';
import { Category } from '../../database/Model/category.model.js';
import { User } from '../../database/Model/user.model.js';
import { uploadDir } from '../../common/utils/multer/multer.js';
import { Brand } from '../../database/Model/brand.model.js';

const removeFile = (path?: string) =>
  path ? unlink(path).catch(() => {}) : Promise.resolve();

@Injectable()
export class BrandService {
  constructor(
    @InjectModel('Category')
    private readonly CategoryModel: Model<Category>,

    @InjectModel('User')
    private readonly userModel: Model<User>,

    @InjectModel('Brand')
    private readonly BrandModel: Model<Brand>,
  ) {}

  async create(
    dto: CreateBrandDto,
    userId: Types.ObjectId,
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('image is required');
    }

    const { name, category } = dto;

    try {
      const exists = await this.BrandModel.exists({
        name,
        deletedAt: null,
      });

      if (exists) {
        throw new ConflictException('Brand name is already taken');
      }

      const categoryExists = await this.CategoryModel.exists({
        _id: category,
        deletedAt: null,
      });

      if (!categoryExists) {
        throw new NotFoundException('Category not found');
      }

      return await this.BrandModel.create({
        name,
        image: file.filename,
        createdBy: userId,
        category: [new Types.ObjectId(category)],
      });
    } catch (error: any) {
      await removeFile(file.path);

      if (error?.code === 11000) {
        throw new ConflictException('Brand name is already taken');
      }

      throw error;
    }
  }

  async update(id: string, dto: UpdateBrandDto, file?: Express.Multer.File) {
    if (!isValidObjectId(id)) {
      await removeFile(file?.path);
      throw new BadRequestException('Invalid brand id');
    }

    const { name } = dto;

    const update: Partial<Pick<Brand, 'name' | 'image'>> = {};

    if (name !== undefined) {
      update.name = name;
    }

    if (file) {
      update.image = file.filename;
    }

    if (Object.keys(update).length === 0) {
      throw new BadRequestException('Nothing to update');
    }

    try {
      if (name !== undefined) {
        const exists = await this.BrandModel.exists({
          _id: { $ne: id },
          name,
          deletedAt: null,
        });

        if (exists) {
          throw new ConflictException('Brand name is already taken');
        }
      }

      const old = await this.BrandModel.findOne({
        _id: id,
        deletedAt: null,
      });

      if (!old) {
        throw new NotFoundException('Brand not found');
      }

      const brand = await this.BrandModel.findOneAndUpdate(
        {
          _id: id,
          deletedAt: null,
        },
        {
          $set: update,
        },
        {
          new: true,
          runValidators: true,
        },
      );

      if (!brand) {
        throw new NotFoundException('Brand not found');
      }

      if (file && old.image) {
        await removeFile(join(uploadDir, old.image));
      }

      return brand;
    } catch (error: any) {
      await removeFile(file?.path);

      if (error?.code === 11000) {
        throw new ConflictException('Brand name is already taken');
      }

      throw error;
    }
  }

  async remove(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid brand id');
    }

    const brand = await this.BrandModel.findOneAndUpdate(
      {
        _id: id,
        deletedAt: null,
      },
      {
        $set: {
          deletedAt: new Date(),
        },
      },
      {
        new: true,
      },
    );

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    return {
      message: 'Done',
      brand,
    };
  }

  async findAll() {
    const brands = await this.BrandModel.find({
      deletedAt: null,
    });

    if (brands.length === 0) {
      throw new NotFoundException('Brand not found');
    }

    return {
      message: 'Done',
      brands,
    };
  }

  async findById(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid brand id');
    }

    const brand = await this.BrandModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    return {
      message: 'Done',
      brand,
    };
  }
}
