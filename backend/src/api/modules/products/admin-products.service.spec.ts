jest.mock('../../../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

jest.mock(
  '@prisma/client',
  () => ({
    Prisma: {
      PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {},
    },
  }),
  { virtual: true },
);

import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { PrismaService } from '../../../prisma/prisma.service';
import { AppException } from '../../../common/errors/app-exception';
import { API_ERROR_CODES } from '../../../common/errors/error-codes';
import { AdminProductsService } from './admin-products.service';
import { adminProductListQuerySchema } from './dto/admin-product-list-query.dto';
import type { ProductMediaService } from './product-media.service';

describe('AdminProductsService', () => {
  const buildService = () => {
    const product = {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    const category = {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    };
    const productMediaService = {
      uploadMany: jest.fn(),
    };

    const prisma = {
      product,
      category,
      $queryRaw: jest.fn().mockResolvedValue([]),
      $executeRaw: jest.fn().mockResolvedValue(0),
    };

    const service = new AdminProductsService(
      prisma as unknown as PrismaService,
      productMediaService as unknown as ProductMediaService,
    );

    return {
      service,
      product,
      category,
      productMediaService,
    };
  };

  it('parses admin query defaults', () => {
    expect(adminProductListQuerySchema.parse({})).toEqual({
      status: 'ALL',
      page: 1,
      limit: 25,
    });
  });

  it('lists admin products with filter-aware where clauses and summary counts', async () => {
    const { service, product } = buildService();

    product.count
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(12)
      .mockResolvedValueOnce(9)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(4);
    product.findMany.mockResolvedValue([
      {
        id: 'cm9product00000123456789012',
        name: 'Cloud Calm Gel Cleanser',
        sku: 'FCE-CLN-001',
        slug: 'cloud-calm-gel-cleanser',
        subtitle: 'Gentle daily cleanser',
        imageUrl: '/images/products/cloud-calm-gel-cleanser.png',
        isPublished: true,
        isFlashSale: false,
        price: { toString: () => '490' },
        compareAtPrice: null,
        stock: 8,
        updatedAt: new Date('2026-05-04T10:00:00.000Z'),
        category: {
          id: 'cm9category000001234567890',
          name: 'Cleansers',
          slug: 'cleansers',
        },
      },
    ]);

    const response = await service.listProducts({
      query: 'cloud',
      status: 'PUBLISHED',
      lowStock: true,
      category: 'cleansers',
      page: 1,
      limit: 12,
    });

    expect(product.count).toHaveBeenCalledWith({
      where: {
        OR: [
          { name: { contains: 'cloud', mode: 'insensitive' } },
          { sku: { contains: 'cloud', mode: 'insensitive' } },
          { slug: { contains: 'cloud', mode: 'insensitive' } },
        ],
        isPublished: true,
        stock: { lte: 10 },
        category: {
          slug: 'cleansers',
        },
      },
    });
    expect(response.summary.lowStockCount).toBe(4);
    expect(response.items[0]).toMatchObject({
      name: 'Cloud Calm Gel Cleanser',
      sku: 'FCE-CLN-001',
      price: 490,
      stock: 8,
    });
  });

  it('creates a product with category connect data', async () => {
    const { service, product, category } = buildService();

    category.findUnique.mockResolvedValue({ id: 'cm9category000001234567890' });
    product.create.mockResolvedValue({
      id: 'cm9product00000123456789012',
      name: 'New Product',
      sku: 'FCE-NEW-001',
      slug: 'new-product',
      subtitle: null,
      description: 'Description',
      howToUse: 'How to use',
      benefits: ['One'],
      ingredients: ['Two'],
      imageUrl: null,
      galleryImages: [],
      isPublished: false,
      isFlashSale: false,
      price: { toString: () => '500' },
      compareAtPrice: null,
      stock: 5,
      createdAt: new Date('2026-05-04T10:00:00.000Z'),
      updatedAt: new Date('2026-05-04T10:00:00.000Z'),
      category: {
        id: 'cm9category000001234567890',
        name: 'Cleansers',
        slug: 'cleansers',
      },
    });

    await service.createProduct({
      name: 'New Product',
      sku: 'FCE-NEW-001',
      slug: 'new-product',
      subtitle: null,
      description: 'Description',
      howToUse: 'How to use',
      benefits: ['One'],
      ingredients: ['Two'],
      imageUrl: null,
      galleryImages: [],
      isPublished: false,
      isFlashSale: false,
      price: 500,
      compareAtPrice: null,
      stock: 5,
      categoryId: 'cm9category000001234567890',
    });

    const createCalls = product.create.mock.calls as Array<
      [
        {
          data: {
            sku: string;
            category: {
              connect: {
                id: string;
              };
            };
          };
        },
      ]
    >;
    const createCall = createCalls[0]?.[0];

    expect(createCall.data.sku).toBe('FCE-NEW-001');
    expect(createCall.data.category.connect.id).toBe(
      'cm9category000001234567890',
    );
  });

  it('normalizes lowercase sku values before create', async () => {
    const { service, product, category } = buildService();

    category.findUnique.mockResolvedValue({ id: 'cm9category000001234567890' });
    product.create.mockResolvedValue({
      id: 'cm9product00000123456789012',
      name: 'New Product',
      sku: 'FCE-NEW-001',
      slug: 'new-product',
      subtitle: null,
      description: 'Description',
      howToUse: 'How to use',
      benefits: ['One'],
      ingredients: ['Two'],
      imageUrl: null,
      galleryImages: [],
      isPublished: false,
      isFlashSale: false,
      price: { toString: () => '500' },
      compareAtPrice: null,
      stock: 5,
      createdAt: new Date('2026-05-04T10:00:00.000Z'),
      updatedAt: new Date('2026-05-04T10:00:00.000Z'),
      category: {
        id: 'cm9category000001234567890',
        name: 'Cleansers',
        slug: 'cleansers',
      },
    });

    await service.createProduct({
      name: 'New Product',
      sku: 'fce-new-001',
      slug: 'new-product',
      subtitle: null,
      description: 'Description',
      howToUse: 'How to use',
      benefits: ['One'],
      ingredients: ['Two'],
      imageUrl: null,
      galleryImages: [],
      isPublished: false,
      isFlashSale: false,
      price: 500,
      compareAtPrice: null,
      stock: 5,
      categoryId: 'cm9category000001234567890',
    });

    const createCalls = product.create.mock.calls as Array<
      [
        {
          data: {
            sku: string;
          };
        },
      ]
    >;

    expect(createCalls[0]?.[0].data.sku).toBe('FCE-NEW-001');
  });

  it('maps duplicate sku conflicts to an app exception', async () => {
    const { service, product, category } = buildService();

    category.findUnique.mockResolvedValue({ id: 'cm9category000001234567890' });
    const prismaError = Object.assign(new Error('duplicate'), {
      code: 'P2002',
      meta: { target: ['sku'] },
    });
    Object.setPrototypeOf(
      prismaError,
      Prisma.PrismaClientKnownRequestError.prototype,
    );
    product.create.mockRejectedValue(prismaError);

    let thrownError: unknown;

    try {
      await service.createProduct({
        name: 'New Product',
        sku: 'FCE-NEW-001',
        slug: 'new-product',
        subtitle: null,
        description: 'Description',
        howToUse: 'How to use',
        benefits: ['One'],
        ingredients: ['Two'],
        imageUrl: null,
        galleryImages: [],
        isPublished: false,
        isFlashSale: false,
        price: 500,
        compareAtPrice: null,
        stock: 5,
        categoryId: 'cm9category000001234567890',
      });
    } catch (error: unknown) {
      thrownError = error;
    }

    expect(thrownError).toBeInstanceOf(AppException);
    expect(thrownError).toMatchObject({
      status: HttpStatus.CONFLICT,
      response: {
        code: API_ERROR_CODES.productSkuExists,
      },
    });
  });

  it('requires files for upload', () => {
    const { service } = buildService();

    expect(() => service.uploadImages([])).toThrow(AppException);
  });

  it('keeps compare-at price when flash sale stays on', async () => {
    const { service, product, category } = buildService();

    category.findUnique.mockResolvedValue({ id: 'cm9category000001234567890' });
    product.create.mockResolvedValue({
      id: 'cm9product00000123456789012',
      name: 'New Product',
      sku: 'FCE-NEW-001',
      slug: 'new-product',
      subtitle: null,
      description: 'Description',
      howToUse: 'How to use',
      benefits: ['One'],
      ingredients: ['Two'],
      imageUrl: null,
      galleryImages: [],
      isPublished: true,
      isFlashSale: true,
      price: { toString: () => '500' },
      compareAtPrice: { toString: () => '650' },
      stock: 5,
      createdAt: new Date('2026-05-04T10:00:00.000Z'),
      updatedAt: new Date('2026-05-04T10:00:00.000Z'),
      category: {
        id: 'cm9category000001234567890',
        name: 'Cleansers',
        slug: 'cleansers',
      },
    });

    await service.createProduct({
      name: 'New Product',
      sku: 'FCE-NEW-001',
      slug: 'new-product',
      subtitle: null,
      description: 'Description',
      howToUse: 'How to use',
      benefits: ['One'],
      ingredients: ['Two'],
      imageUrl: null,
      galleryImages: [],
      isPublished: true,
      isFlashSale: true,
      price: 500,
      compareAtPrice: 650,
      stock: 5,
      categoryId: 'cm9category000001234567890',
    });

    const createCalls = product.create.mock.calls as Array<
      [
        {
          data: {
            isFlashSale: boolean;
            compareAtPrice: number | null;
          };
        },
      ]
    >;

    expect(createCalls[0]?.[0].data).toMatchObject({
      isFlashSale: true,
      compareAtPrice: 650,
    });
  });

  it('clears compare-at price when flash sale is turned off', async () => {
    const { service, product } = buildService();

    product.findUnique.mockResolvedValue({ id: 'cm9product00000123456789012' });
    product.update.mockResolvedValue({
      id: 'cm9product00000123456789012',
      name: 'Existing Product',
      sku: 'FCE-NEW-001',
      slug: 'existing-product',
      subtitle: null,
      description: 'Description',
      howToUse: 'How to use',
      benefits: ['One'],
      ingredients: ['Two'],
      imageUrl: null,
      galleryImages: [],
      isPublished: true,
      isFlashSale: false,
      price: { toString: () => '500' },
      compareAtPrice: null,
      stock: 5,
      createdAt: new Date('2026-05-04T10:00:00.000Z'),
      updatedAt: new Date('2026-05-04T10:00:00.000Z'),
      category: {
        id: 'cm9category000001234567890',
        name: 'Cleansers',
        slug: 'cleansers',
      },
    });

    await service.updateProduct('cm9product00000123456789012', {
      price: 500,
      compareAtPrice: 650,
      isFlashSale: false,
    });

    const updateCalls = product.update.mock.calls as Array<
      [
        {
          data: {
            isFlashSale: boolean;
            compareAtPrice: number | null;
          };
        },
      ]
    >;

    expect(updateCalls[0]?.[0].data).toMatchObject({
      isFlashSale: false,
      compareAtPrice: null,
    });
  });

  it('passes upload files through the media service', async () => {
    const { service, productMediaService } = buildService();
    productMediaService.uploadMany.mockResolvedValue([
      {
        originalName: 'example.png',
        filename: 'products-example-uuid.png',
        url: 'http://localhost:4000/uploads/products/example.png',
        contentType: 'image/png',
        size: 1234,
      },
    ]);

    const response = await service.uploadImages([
      {
        originalname: 'example.png',
        mimetype: 'image/png',
        size: 1234,
      } as Express.Multer.File,
    ]);

    expect(response.items).toHaveLength(1);
    expect(productMediaService.uploadMany).toHaveBeenCalled();
  });
});
