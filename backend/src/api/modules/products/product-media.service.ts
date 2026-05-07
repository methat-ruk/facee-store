import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { HttpStatus, Injectable } from '@nestjs/common';
import { appEnv } from '../../../config/env';
import { AppException } from '../../../common/errors/app-exception';
import { API_ERROR_CODES } from '../../../common/errors/error-codes';

type UploadedAsset = {
  key: string;
  url: string;
  fileName: string;
  contentType: string;
  size: number;
};

function sanitizeFileStem(fileName: string) {
  return fileName
    .replace(/\.[^/.]+$/, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function ensureImageFile(contentType: string | undefined) {
  if (!contentType?.startsWith('image/')) {
    throw new AppException(
      HttpStatus.BAD_REQUEST,
      API_ERROR_CODES.productUploadInvalidType,
      'Only image uploads are supported for product media.',
    );
  }
}

@Injectable()
export class ProductMediaService {
  async uploadMany(files: Express.Multer.File[]) {
    return Promise.all(files.map((file) => this.uploadOne(file)));
  }

  private async uploadOne(file: Express.Multer.File): Promise<UploadedAsset> {
    ensureImageFile(file.mimetype);

    return this.uploadToLocal(file);
  }

  private async uploadToLocal(
    file: Express.Multer.File,
  ): Promise<UploadedAsset> {
    const extension = extname(file.originalname) || '.png';
    const fileStem = sanitizeFileStem(file.originalname) || 'product-image';
    const key = `${fileStem}-${randomUUID()}${extension}`;
    const uploadDirectory = resolve(process.cwd(), appEnv.mediaLocalDir);
    const absolutePath = join(uploadDirectory, key);

    try {
      await fs.mkdir(uploadDirectory, { recursive: true });
      await fs.writeFile(absolutePath, file.buffer);
    } catch {
      throw new AppException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        API_ERROR_CODES.productMediaUploadFailed,
        'Product image upload failed.',
      );
    }

    return {
      key,
      url: `${appEnv.backendPublicUrl}${appEnv.mediaLocalBasePath}/${key}`,
      fileName: file.originalname,
      contentType: file.mimetype,
      size: file.size,
    };
  }
}
