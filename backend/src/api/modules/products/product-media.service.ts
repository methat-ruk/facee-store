import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.cjs';
import { appEnv } from '../../../config/env';
import { AppException } from '../../../common/errors/app-exception';
import { API_ERROR_CODES } from '../../../common/errors/error-codes';
import { PrismaService } from '../../../prisma/prisma.service';

type UploadedAsset = {
  originalName: string;
  filename: string;
  url: string;
  contentType: string;
  size: number;
};

type ProductMediaAssetPrisma = Pick<PrismaService, '$executeRaw'>;

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
  constructor(
    @Inject(PrismaService)
    private readonly prisma: ProductMediaAssetPrisma,
  ) {}

  async uploadMany(files: Express.Multer.File[], slug?: string) {
    return Promise.all(files.map((file) => this.uploadOne(file, slug)));
  }

  private async uploadOne(
    file: Express.Multer.File,
    slug?: string,
  ): Promise<UploadedAsset> {
    ensureImageFile(file.mimetype);

    return this.uploadToLocal(file, slug);
  }

  private async uploadToLocal(
    file: Express.Multer.File,
    slug?: string,
  ): Promise<UploadedAsset> {
    const extension = extname(file.originalname) || '.png';
    const fileStem =
      sanitizeFileStem(slug ?? file.originalname) || 'product-image';
    const filename = `${fileStem}-${randomUUID()}${extension}`;
    const uploadDirectory = resolve(process.cwd(), appEnv.mediaLocalDir);
    const absolutePath = join(uploadDirectory, filename);
    const url = `${appEnv.backendPublicUrl}${appEnv.mediaLocalBasePath}/${filename}`;

    try {
      await fs.mkdir(uploadDirectory, { recursive: true });
      await fs.writeFile(absolutePath, file.buffer);
      await this.persistAssetMetadata({
        originalName: file.originalname,
        filename,
        url,
        contentType: file.mimetype,
        size: file.size,
      });
    } catch {
      throw new AppException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        API_ERROR_CODES.productMediaUploadFailed,
        'Product image upload failed.',
      );
    }

    return {
      originalName: file.originalname,
      filename,
      url,
      contentType: file.mimetype,
      size: file.size,
    };
  }

  private async persistAssetMetadata(asset: UploadedAsset) {
    await this.prisma.$executeRaw(Prisma.sql`
      CREATE TABLE IF NOT EXISTS "ProductMediaAsset" (
        "id" TEXT NOT NULL,
        "originalName" TEXT NOT NULL,
        "filename" TEXT NOT NULL,
        "url" TEXT NOT NULL,
        "contentType" TEXT NOT NULL,
        "size" INTEGER NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ProductMediaAsset_pkey" PRIMARY KEY ("id")
      )
    `);

    await this.prisma.$executeRaw(Prisma.sql`
      CREATE UNIQUE INDEX IF NOT EXISTS "ProductMediaAsset_url_key"
      ON "ProductMediaAsset"("url")
    `);

    await this.prisma.$executeRaw(Prisma.sql`
      CREATE UNIQUE INDEX IF NOT EXISTS "ProductMediaAsset_filename_key"
      ON "ProductMediaAsset"("filename")
    `);

    await this.prisma.$executeRaw(Prisma.sql`
      CREATE INDEX IF NOT EXISTS "ProductMediaAsset_createdAt_idx"
      ON "ProductMediaAsset"("createdAt")
    `);

    await this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO "ProductMediaAsset" (
        "id",
        "originalName",
        "filename",
        "url",
        "contentType",
        "size"
      ) VALUES (
        ${randomUUID()},
        ${asset.originalName},
        ${asset.filename},
        ${asset.url},
        ${asset.contentType},
        ${asset.size}
      )
      ON CONFLICT ("url") DO UPDATE SET
        "originalName" = EXCLUDED."originalName",
        "filename" = EXCLUDED."filename",
        "contentType" = EXCLUDED."contentType",
        "size" = EXCLUDED."size"
    `);
  }
}
