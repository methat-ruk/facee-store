jest.mock('../../../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import type { PrismaService } from '../../../prisma/prisma.service';
import { getProductsQuerySchema } from './dto/get-products-query.dto';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  const buildService = () => {
    const count = jest.fn();
    const findMany = jest.fn();

    const prisma = {
      product: {
        count,
        findMany,
      },
    } satisfies {
      product: Pick<PrismaService['product'], 'count' | 'findMany'>;
    };

    const service = new ProductsService(prisma);

    return {
      service,
      count,
      findMany,
    };
  };

  it('parses storefront query defaults and coercion', () => {
    expect(getProductsQuerySchema.parse({})).toEqual({
      sort: 'newest',
      page: 1,
      limit: 9,
    });

    expect(
      getProductsQuerySchema.parse({
        page: '2',
        limit: '12',
        sort: 'price-desc',
      }),
    ).toEqual({
      page: 2,
      limit: 12,
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
    const { service, count, findMany } = buildService();

    count.mockResolvedValue(1);
    findMany.mockResolvedValue([
      {
        id: 'cm8product00000123456789012',
        name: 'Cloud Calm Gel Cleanser',
        slug: 'cloud-calm-gel-cleanser',
        description: 'Gentle cleanser.',
        imageUrl: null,
        price: { toString: () => '490' },
        stock: 28,
        category: {
          id: 'cm8category000001234567890',
          name: 'Cleansers',
          slug: 'cleansers',
        },
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
          description: 'Gentle cleanser.',
          imageUrl: null,
          price: 490,
          stock: 28,
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
    const { service, count, findMany } = buildService();

    count.mockResolvedValue(0);
    findMany.mockResolvedValue([]);

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

  it('clamps requested page to the last available page', async () => {
    const { service, count, findMany } = buildService();

    count.mockResolvedValue(10);
    findMany.mockResolvedValue([]);

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
});
