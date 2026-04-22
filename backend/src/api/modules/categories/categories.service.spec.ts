jest.mock('../../../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import type { PrismaService } from '../../../prisma/prisma.service';
import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  it('returns published storefront categories ordered by name', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 'cm8store00000123456789012',
        name: 'Cleansers',
        slug: 'cleansers',
      },
    ]);

    const prisma = {
      category: {
        findMany,
      },
    } satisfies {
      category: Pick<PrismaService['category'], 'findMany'>;
    };

    const service = new CategoriesService(prisma);

    await expect(service.findAll()).resolves.toEqual([
      {
        id: 'cm8store00000123456789012',
        name: 'Cleansers',
        slug: 'cleansers',
      },
    ]);

    expect(findMany).toHaveBeenCalledWith({
      where: {
        products: {
          some: {
            isPublished: true,
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  });
});
