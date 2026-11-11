import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { OrderGuard } from '../../common/guards/order-admin.guard.js';
import { imageUploadOptions } from '../../common/utils/multer/multer.js';
import { UploadMediaDto } from './dto/upload-media.dto.js';
import { MediaService } from './media.service.js';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('images')
  @UseGuards(AuthGuard, OrderGuard)
  @UseInterceptors(FileInterceptor('image', imageUploadOptions))
  uploadImage(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadMediaDto,
  ) {
    return this.mediaService.acceptImage(file, dto);
  }
}
