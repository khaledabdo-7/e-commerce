import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { Types } from 'mongoose';
import { ProductService } from './product.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ProductGuard } from '../../common/guards/Product.guard.js';
import { imageUploadOptions } from '../../common/utils/multer/multer.js';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(ProductGuard)
  @UseInterceptors(FilesInterceptor('images', 10, imageUploadOptions))
  create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request & { user: { _id: Types.ObjectId } },
  ) {
    return this.productService.create(createProductDto, req.user._id, files);
  }

  @Get()
  findAll() {
    return this.productService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(ProductGuard)
  @UseInterceptors(FilesInterceptor('images', 10, imageUploadOptions))
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.productService.update(id, updateProductDto, files);
  }

  @Delete(':id')
  @UseGuards(ProductGuard)
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
