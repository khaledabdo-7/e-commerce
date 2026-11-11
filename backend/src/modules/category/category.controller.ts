import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { Types } from 'mongoose';
import { CategoryService } from './category.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { imageUploadOptions } from '../../common/utils/multer/multer.js';
import { CategoryGuard } from '../../common/guards/Category.guard.js';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post('/create-category')
  @UseGuards(CategoryGuard)
  @UseInterceptors(FileInterceptor('image', imageUploadOptions))
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request & { user: { _id: Types.ObjectId } },
  ) {
    return this.categoryService.create(createCategoryDto, req.user._id, file);
  }

  @Patch('/update-category/:id')
  @UseGuards(CategoryGuard)
  @UseInterceptors(FileInterceptor('image', imageUploadOptions))
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.categoryService.update(id, updateCategoryDto, file);
  }

  @Delete('/delete-category/:id')
  @UseGuards(CategoryGuard)
  remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }

  @Get('/get-all')
  findAll() {
    return this.categoryService.findAll();
  }

  @Get('/get-category/:id')
  findById(@Param('id') id: string) {
    return this.categoryService.findById(id);
  }
}
