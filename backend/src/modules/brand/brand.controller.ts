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
import { BrandService } from './brand.service.js';
import { CreateBrandDto } from './dto/create-brand.dto.js';
import { UpdateBrandDto } from './dto/update-brand.dto.js';
import { imageUploadOptions } from '../../common/utils/multer/multer.js';
import { CategoryGuard } from '../../common/guards/Category.guard.js';
import { BrandGuard } from '../../common/guards/Brand.guard.js';

@Controller('Brand')
export class BrandController {
  constructor(private readonly BrandSerive: BrandService) {}

  @Post('/create-Brand')
  @UseGuards(BrandGuard)
  @UseInterceptors(FileInterceptor('image', imageUploadOptions))
  create(
    @Body() CreateBrandDto: CreateBrandDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request & { user: { _id: Types.ObjectId } },
  ) {
    return this.BrandSerive.create(CreateBrandDto, req.user._id, file);
  }

  @Patch('/update-Brand/:id')
  @UseGuards(BrandGuard)
  @UseInterceptors(FileInterceptor('image', imageUploadOptions))
  update(
    @Param('id') id: string,
    @Body() UpdateBrandDto: UpdateBrandDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.BrandSerive.update(id, UpdateBrandDto, file);
  }

  @Delete('/delete-Brand/:id')
  @UseGuards(BrandGuard)
  remove(@Param('id') id: string) {
    return this.BrandSerive.remove(id);
  }

  @Get('/get-all')
  findAll() {
    return this.BrandSerive.findAll();
  }

  @Get('/get-Brand/:id')
  findById(@Param('id') id: string) {
    return this.BrandSerive.findById(id);
  }
}
