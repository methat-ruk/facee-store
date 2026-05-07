import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.cjs';
import { AppException } from '../../../common/errors/app-exception';
import { API_ERROR_CODES } from '../../../common/errors/error-codes';
import { PrismaService } from '../../../prisma/prisma.service';
import { type AdminProductListQuery } from './dto/admin-product-list-query.dto';
import {
  type CreateAdminProductInput,
  type UpdateAdminProductInput,
} from './dto/admin-upsert-product.dto';
import { productDetailSelect, toNumber } from './products.service';
import { ProductMediaService } from './product-media.service';

const LOW_STOCK_THRESHOLD = 10;

function normalizeSku(value: string) {
  return value.trim().toUpperCase();
}

type FlashSaleValues = {
  compareAtPrice: number | null | undefined;
  isFlashSale: boolean | undefined;
};

const adminProductListSelect = {
  id: true,
  name: true,
  sku: true,
  slug: true,
  subtitle: true,
  imageUrl: true,
  isPublished: true,
  isFlashSale: true,
  price: true,
  compareAtPrice: true,
  stock: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
} satisfies Prisma.ProductSelect;

const adminProductDetailSelect = {
  ...productDetailSelect,
  sku: true,
  isPublished: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProductSelect;

type AdminProductsPrisma = Pick<PrismaService, 'category' | 'product'>;

@Injectable()
export class AdminProductsService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: AdminProductsPrisma,
    private readonly productMediaService: ProductMediaService,
  ) {}

  async listCategories() {
    return this.prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });
  }

  async listProducts(query: AdminProductListQuery) {
    const where = this.buildWhere(query);
    const totalItems = await this.prisma.product.count({ where });
    const totalPages = Math.max(1, Math.ceil(totalItems / query.limit));
    const page = totalItems === 0 ? 1 : Math.min(query.page, totalPages);

    const [filteredItems, summary] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: adminProductListSelect,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * query.limit,
        take: query.limit,
      }),
      this.getSummary(),
    ]);

    return {
      items: filteredItems.map((item) => ({
        ...item,
        price: Number(item.price),
        compareAtPrice: toNumber(item.compareAtPrice),
        updatedAt: item.updatedAt.toISOString(),
      })),
      meta: {
        page,
        limit: query.limit,
        totalItems,
        totalPages,
      },
      summary,
    };
  }

  async getProductById(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: adminProductDetailSelect,
    });

    if (!product) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        API_ERROR_CODES.productNotFound,
        'Product was not found.',
      );
    }

    return {
      product: {
        ...product,
        price: Number(product.price),
        compareAtPrice: toNumber(product.compareAtPrice),
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      },
    };
  }

  async createProduct(input: CreateAdminProductInput) {
    await this.ensureCategoryExists(input.categoryId);

    try {
      const product = await this.prisma.product.create({
        data: this.toCreateData(input),
        select: adminProductDetailSelect,
      });

      return {
        product: {
          ...product,
          price: Number(product.price),
          compareAtPrice: toNumber(product.compareAtPrice),
          createdAt: product.createdAt.toISOString(),
          updatedAt: product.updatedAt.toISOString(),
        },
      };
    } catch (error: unknown) {
      const handledError = this.handleUniqueConstraint(error);
      throw handledError ?? error;
    }
  }

  async updateProduct(productId: string, input: UpdateAdminProductInput) {
    await this.ensureProductExists(productId);

    if (input.categoryId) {
      await this.ensureCategoryExists(input.categoryId);
    }

    try {
      const product = await this.prisma.product.update({
        where: { id: productId },
        data: this.toUpdateData(input),
        select: adminProductDetailSelect,
      });

      return {
        product: {
          ...product,
          price: Number(product.price),
          compareAtPrice: toNumber(product.compareAtPrice),
          createdAt: product.createdAt.toISOString(),
          updatedAt: product.updatedAt.toISOString(),
        },
      };
    } catch (error: unknown) {
      const handledError = this.handleUniqueConstraint(error);
      throw handledError ?? error;
    }
  }

  uploadImages(files: Express.Multer.File[]) {
    if (files.length === 0) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        API_ERROR_CODES.validationFailed,
        'At least one product image is required.',
      );
    }

    return this.productMediaService
      .uploadMany(files)
      .then((items) => ({ items }));
  }

  private buildWhere(query: AdminProductListQuery): Prisma.ProductWhereInput {
    return {
      ...(query.query
        ? {
            OR: [
              {
                name: {
                  contains: query.query,
                  mode: 'insensitive',
                },
              },
              {
                sku: {
                  contains: query.query,
                  mode: 'insensitive',
                },
              },
              {
                slug: {
                  contains: query.query,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
      ...(query.status === 'PUBLISHED'
        ? { isPublished: true }
        : query.status === 'UNPUBLISHED'
          ? { isPublished: false }
          : {}),
      ...(query.flashSale ? { isFlashSale: true } : {}),
      ...(query.lowStock ? { stock: { lte: LOW_STOCK_THRESHOLD } } : {}),
      ...(query.category
        ? {
            category: {
              slug: query.category,
            },
          }
        : {}),
    };
  }

  private async getSummary() {
    const [
      totalCount,
      publishedCount,
      unpublishedCount,
      flashSaleCount,
      lowStockCount,
    ] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.count({ where: { isPublished: true } }),
      this.prisma.product.count({ where: { isPublished: false } }),
      this.prisma.product.count({ where: { isFlashSale: true } }),
      this.prisma.product.count({
        where: {
          stock: {
            lte: LOW_STOCK_THRESHOLD,
          },
        },
      }),
    ]);

    return {
      totalCount,
      publishedCount,
      unpublishedCount,
      flashSaleCount,
      lowStockCount,
    };
  }

  private async ensureCategoryExists(categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        API_ERROR_CODES.categoryNotFound,
        'Selected category was not found.',
      );
    }
  }

  private async ensureProductExists(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        API_ERROR_CODES.productNotFound,
        'Product was not found.',
      );
    }
  }

  private toCreateData(
    input: CreateAdminProductInput,
  ): Prisma.ProductCreateInput {
    const flashSaleValues = this.normalizeFlashSale({
      price: input.price,
      compareAtPrice: input.compareAtPrice,
      isFlashSale: input.isFlashSale,
    });

    return {
      name: input.name,
      sku: normalizeSku(input.sku),
      slug: input.slug,
      subtitle: input.subtitle,
      description: input.description,
      howToUse: input.howToUse,
      benefits: [...input.benefits],
      ingredients: [...input.ingredients],
      imageUrl: input.imageUrl,
      galleryImages: [...input.galleryImages],
      isPublished: input.isPublished,
      isFlashSale: flashSaleValues.isFlashSale,
      price: input.price,
      compareAtPrice: flashSaleValues.compareAtPrice,
      stock: input.stock,
      category: {
        connect: {
          id: input.categoryId,
        },
      },
    };
  }

  private toUpdateData(
    input: UpdateAdminProductInput,
  ): Prisma.ProductUpdateInput {
    const flashSaleValues = this.normalizeFlashSale({
      price: input.price,
      compareAtPrice: input.compareAtPrice,
      isFlashSale: input.isFlashSale,
    });

    return {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.sku !== undefined ? { sku: normalizeSku(input.sku) } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.subtitle !== undefined ? { subtitle: input.subtitle } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.howToUse !== undefined ? { howToUse: input.howToUse } : {}),
      ...(input.benefits !== undefined
        ? { benefits: [...input.benefits] }
        : {}),
      ...(input.ingredients !== undefined
        ? { ingredients: [...input.ingredients] }
        : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
      ...(input.galleryImages !== undefined
        ? { galleryImages: [...input.galleryImages] }
        : {}),
      ...(input.isPublished !== undefined
        ? { isPublished: input.isPublished }
        : {}),
      ...(flashSaleValues.isFlashSale !== undefined
        ? { isFlashSale: flashSaleValues.isFlashSale }
        : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(flashSaleValues.compareAtPrice !== undefined
        ? { compareAtPrice: flashSaleValues.compareAtPrice }
        : {}),
      ...(input.stock !== undefined ? { stock: input.stock } : {}),
      ...(input.categoryId !== undefined
        ? {
            category: {
              connect: {
                id: input.categoryId,
              },
            },
          }
        : {}),
    };
  }

  private normalizeFlashSale(input: {
    price: number | undefined;
    compareAtPrice: number | null | undefined;
    isFlashSale: boolean | undefined;
  }): FlashSaleValues {
    if (input.compareAtPrice === undefined && input.isFlashSale === undefined) {
      return {
        compareAtPrice: undefined,
        isFlashSale: undefined,
      };
    }

    if (input.isFlashSale === false) {
      return {
        compareAtPrice: null,
        isFlashSale: false,
      };
    }

    if (
      input.compareAtPrice !== undefined &&
      input.compareAtPrice !== null &&
      input.price !== undefined &&
      input.compareAtPrice > input.price
    ) {
      return {
        compareAtPrice: input.compareAtPrice,
        isFlashSale: true,
      };
    }

    if (input.compareAtPrice === null) {
      return {
        compareAtPrice: null,
        isFlashSale: false,
      };
    }

    return {
      compareAtPrice: input.compareAtPrice,
      isFlashSale: input.isFlashSale,
    };
  }

  private handleUniqueConstraint(error: unknown): AppException | null {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const target = Array.isArray(error.meta?.target) ? error.meta.target : [];

      if (target.includes('sku')) {
        return new AppException(
          HttpStatus.CONFLICT,
          API_ERROR_CODES.productSkuExists,
          'This SKU is already in use.',
          {
            sku: [API_ERROR_CODES.productSkuExists],
          },
        );
      }

      if (target.includes('slug')) {
        return new AppException(
          HttpStatus.CONFLICT,
          API_ERROR_CODES.productSlugExists,
          'This slug is already in use.',
          {
            slug: [API_ERROR_CODES.productSlugExists],
          },
        );
      }
    }

    return null;
  }
}
