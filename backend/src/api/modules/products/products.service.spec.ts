jest.mock('../../../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

jest.mock(
  '../../../generated/prisma/client.cjs',
  () => ({
    Prisma: {
      join: (values: unknown[]) => values,
      sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
        strings,
        values,
      }),
    },
  }),
  { virtual: true },
);

import type { PrismaService } from '../../../prisma/prisma.service';
import { getProductsQuerySchema } from './dto/get-products-query.dto';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  const buildService = () => {
    const count = jest.fn();
    const findFirst = jest.fn();
    const findMany = jest.fn();
    const $queryRaw = jest.fn().mockResolvedValue([]);

    const prisma = {
      product: {
        count,
        findFirst,
        findMany,
      },
      $queryRaw,
    } satisfies {
      product: Pick<
        PrismaService['product'],
        'count' | 'findFirst' | 'findMany'
      >;
      $queryRaw: PrismaService['$queryRaw'];
    };

    const service = new ProductsService(prisma);

    return {
      service,
      count,
      findFirst,
      findMany,
      $queryRaw,
    };
  };

  it('parses storefront query defaults and coercion', () => {
    expect(getProductsQuerySchema.parse({})).toEqual({
      sort: 'newest',
      page: 1,
      limit: 24,
    });

    expect(
      getProductsQuerySchema.parse({
        page: '2',
        limit: '12',
        query: 'serum',
        sort: 'price-desc',
      }),
    ).toEqual({
      page: 2,
      limit: 12,
      query: 'serum',
      sort: 'price-desc',
    });
  });

  it('rejects unsupported sort values', () => {
    expect(() =>
      getProductsQuerySchema.parse({
        sort: 'popular',
      }),
    ).toThrow();
  });

  it('returns paginated published products by default', async () => {
    const { service, count, findMany, $queryRaw } = buildService();

    count.mockResolvedValue(1);
    findMany.mockResolvedValue([
      {
        id: 'cm8product00000123456789012',
        name: 'Cloud Calm Gel Cleanser',
        slug: 'cloud-calm-gel-cleanser',
        createdAt: new Date('2026-05-01T10:00:00.000Z'),
        sizeLabel: '150 ml',
        description: 'Gentle cleanser.',
        imageUrl: null,
        isFlashSale: false,
        price: { toString: () => '490' },
        compareAtPrice: null,
        stock: 28,
        category: {
          id: 'cm8category000001234567890',
          name: 'Cleansers',
          slug: 'cleansers',
        },
      },
    ]);
    $queryRaw.mockResolvedValue([
      {
        productId: 'cm8product00000123456789012',
        soldCount: 26,
      },
    ]);

    await expect(
      service.findAll({
        sort: 'newest',
        page: 1,
        limit: 9,
      }),
    ).resolves.toEqual({
      items: [
        {
          id: 'cm8product00000123456789012',
          name: 'Cloud Calm Gel Cleanser',
          slug: 'cloud-calm-gel-cleanser',
          createdAt: '2026-05-01T10:00:00.000Z',
          sizeLabel: '150 ml',
          description: 'Gentle cleanser.',
          imageUrl: null,
          isFlashSale: false,
          price: 490,
          compareAtPrice: null,
          stock: 28,
          soldCount: 26,
          category: {
            id: 'cm8category000001234567890',
            name: 'Cleansers',
            slug: 'cleansers',
          },
        },
      ],
      meta: {
        page: 1,
        limit: 9,
        totalItems: 1,
        totalPages: 1,
      },
    });

    expect(count).toHaveBeenCalledWith({
      where: {
        isPublished: true,
      },
    });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isPublished: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: 0,
        take: 9,
      }),
    );
  });

  it('applies category filtering and sort ordering', async () => {
    const { service, count, findMany, $queryRaw } = buildService();

    count.mockResolvedValue(0);
    findMany.mockResolvedValue([]);
    $queryRaw.mockResolvedValue([]);

    await service.findAll({
      category: 'serums',
      sort: 'price-asc',
      page: 1,
      limit: 9,
    });

    expect(count).toHaveBeenCalledWith({
      where: {
        isPublished: true,
        category: {
          slug: 'serums',
        },
      },
    });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: {
          price: 'asc',
        },
      }),
    );
  });

  it('applies text search across published products', async () => {
    const { service, count, findMany, $queryRaw } = buildService();

    count.mockResolvedValue(0);
    findMany.mockResolvedValue([]);
    $queryRaw.mockResolvedValue([]);

    await service.findAll({
      query: 'cleanser',
      sort: 'newest',
      page: 1,
      limit: 9,
    });

    expect(count).toHaveBeenCalledWith({
      where: {
        isPublished: true,
        OR: [
          {
            name: {
              contains: 'cleanser',
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: 'cleanser',
              mode: 'insensitive',
            },
          },
          {
            subtitle: {
              contains: 'cleanser',
              mode: 'insensitive',
            },
          },
        ],
      },
    });
  });

  it('clamps requested page to the last available page', async () => {
    const { service, count, findMany, $queryRaw } = buildService();

    count.mockResolvedValue(10);
    findMany.mockResolvedValue([]);
    $queryRaw.mockResolvedValue([]);

    const response = await service.findAll({
      sort: 'name-asc',
      page: 99,
      limit: 9,
    });

    expect(response.meta).toEqual({
      page: 2,
      limit: 9,
      totalItems: 10,
      totalPages: 2,
    });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: {
          name: 'asc',
        },
        skip: 9,
        take: 9,
      }),
    );
  });

  it('returns a rich published product detail payload by slug', async () => {
    const { service, findFirst, findMany, $queryRaw } = buildService();

    findFirst.mockResolvedValue({
      id: 'cm8product00000123456789012',
      name: 'Cloud Calm Gel Cleanser',
      slug: 'cloud-calm-gel-cleanser',
      createdAt: new Date('2026-05-01T10:00:00.000Z'),
      sizeLabel: '150 ml',
      subtitle: 'A comfort-first gel cleanser for calm everyday cleansing.',
      description: 'Gentle cleanser.',
      howToUse: 'Massage onto damp skin and rinse with lukewarm water.',
      benefits: ['Comfortable cleanse', 'Soft skin feel'],
      ingredients: ['Glycerin', 'Panthenol'],
      galleryImages: [
        '/images/products/cloud-calm-gel-cleanser.png',
        '/images/products/soft-reset-cream-cleanser.png',
      ],
      imageUrl: '/images/products/cloud-calm-gel-cleanser.png',
      isFlashSale: false,
      price: { toString: () => '490' },
      compareAtPrice: null,
      stock: 28,
      category: {
        id: 'cm8category000001234567890',
        name: 'Cleansers',
        slug: 'cleansers',
      },
    });
    findMany.mockResolvedValue([
      {
        id: 'cm8product00000123456789013',
        name: 'Soft Reset Cream Cleanser',
        slug: 'soft-reset-cream-cleanser',
        createdAt: new Date('2026-05-02T10:00:00.000Z'),
        sizeLabel: '120 ml',
        description: 'Cream cleanser.',
        imageUrl: '/images/products/soft-reset-cream-cleanser.png',
        isFlashSale: false,
        price: { toString: () => '520' },
        compareAtPrice: null,
        stock: 14,
        category: {
          id: 'cm8category000001234567890',
          name: 'Cleansers',
          slug: 'cleansers',
        },
      },
    ]);
    $queryRaw.mockResolvedValue([
      {
        productId: 'cm8product00000123456789012',
        soldCount: 26,
      },
      {
        productId: 'cm8product00000123456789013',
        soldCount: 11,
      },
    ]);

    await expect(
      service.findBySlug('cloud-calm-gel-cleanser'),
    ).resolves.toEqual({
      product: {
        id: 'cm8product00000123456789012',
        name: 'Cloud Calm Gel Cleanser',
        slug: 'cloud-calm-gel-cleanser',
        createdAt: '2026-05-01T10:00:00.000Z',
        sizeLabel: '150 ml',
        subtitle: 'A comfort-first gel cleanser for calm everyday cleansing.',
        description: 'Gentle cleanser.',
        howToUse: 'Massage onto damp skin and rinse with lukewarm water.',
        benefits: ['Comfortable cleanse', 'Soft skin feel'],
        ingredients: ['Glycerin', 'Panthenol'],
        galleryImages: [
          '/images/products/cloud-calm-gel-cleanser.png',
          '/images/products/soft-reset-cream-cleanser.png',
        ],
        imageUrl: '/images/products/cloud-calm-gel-cleanser.png',
        isFlashSale: false,
        price: 490,
        compareAtPrice: null,
        stock: 28,
        soldCount: 26,
        category: {
          id: 'cm8category000001234567890',
          name: 'Cleansers',
          slug: 'cleansers',
        },
      },
      relatedProducts: [
        {
          id: 'cm8product00000123456789013',
          name: 'Soft Reset Cream Cleanser',
          slug: 'soft-reset-cream-cleanser',
          createdAt: '2026-05-02T10:00:00.000Z',
          sizeLabel: '120 ml',
          description: 'Cream cleanser.',
          imageUrl: '/images/products/soft-reset-cream-cleanser.png',
          isFlashSale: false,
          price: 520,
          compareAtPrice: null,
          stock: 14,
          soldCount: 11,
          category: {
            id: 'cm8category000001234567890',
            name: 'Cleansers',
            slug: 'cleansers',
          },
        },
      ],
    });
  });

  it('throws when the requested product slug is missing or unpublished', async () => {
    const { service, findFirst } = buildService();

    findFirst.mockResolvedValue(null);

    await expect(service.findBySlug('missing-product')).rejects.toThrow(
      'Published product "missing-product" was not found.',
    );
  });
});
