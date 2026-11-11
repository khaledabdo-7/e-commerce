import { BadRequestException, Injectable } from '@nestjs/common';
import { readFile, unlink } from 'node:fs/promises';
import { extname } from 'node:path';
import type { IMediaUploadResponse } from '../../common/interfaces/media.interface.js';
import { publicImageUrl } from '../../common/utils/multer/multer.js';
import { UploadMediaDto } from './dto/upload-media.dto.js';

@Injectable()
export class MediaService {
  async acceptImage(
    file: Express.Multer.File | undefined,
    dto: UploadMediaDto,
  ): Promise<IMediaUploadResponse> {
    if (!file) throw new BadRequestException('An image file is required');

    const extension = extname(file.originalname).toLowerCase();
    const allowedTypes: Record<string, string[]> = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
    };
    const extensions = allowedTypes[file.mimetype];
    if (!extensions || !extensions.includes(extension)) {
      await unlink(file.path);
      throw new BadRequestException('Unsupported image type');
    }

    const bytes = await readFile(file.path);
    if (!this.matchesSignature(file.mimetype, bytes)) {
      await unlink(file.path);
      throw new BadRequestException('Uploaded file content is not a valid image');
    }

    const url = publicImageUrl(file.filename);
    if (!url) {
      await unlink(file.path);
      throw new BadRequestException('Could not create a public media URL');
    }
    return {
      filename: file.filename,
      url,
      mimeType: file.mimetype,
      size: file.size,
      ...(dto.altText ? { altText: dto.altText } : {}),
    };
  }

  private matchesSignature(mimeType: string, bytes: Buffer) {
    switch (mimeType) {
      case 'image/jpeg':
        return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
      case 'image/png':
        return (
          bytes.length >= 8 &&
          bytes.subarray(0, 8).equals(
            Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
          )
        );
      case 'image/gif':
        return (
          bytes.length >= 6 &&
          ['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString('ascii'))
        );
      case 'image/webp':
        return (
          bytes.length >= 12 &&
          bytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
          bytes.subarray(8, 12).toString('ascii') === 'WEBP'
        );
      default:
        return false;
    }
  }
}
