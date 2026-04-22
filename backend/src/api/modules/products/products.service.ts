import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.cjs';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetProductsQuery } from './dto/get-products-query.dto';
import { ProductListResponseDto } from './dto/product-list-response.dto';

type ProductsStorefrontPrisma = {
  product: Pick<PrismaService['product'], 'count' | 'findMany'>;
};

@Injectable()
export class ProductsService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: ProductsStorefrontPrisma,
  ) {}

  async findAll(query: GetProductsQuery): Promise<ProductListResponseDto> {
    const where: Prisma.ProductWhereInput = {
      isPublished: true,
      ...(query.category
        ? {
            category: {
              slug: query.category,
            },
          }
        : {}),
    };

    const totalItems = await this.prisma.product.count({ where });
    const totalPages = Math.max(1, Math.ceil(totalItems / query.limit));
    const page = totalItems === 0 ? 1 : Math.min(query.page, totalPages);
    const skip = (page - 1) * query.limit;

    const items = await this.prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        price: true,
        stock: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: this.getOrderBy(query.sort),
      skip,
      take: query.limit,
    });

    return {
      items: items.map((item: (typeof items)[number]) => ({
        ...item,
        price: Number(item.price),
      })),
      meta: {
        page,
        limit: query.limit,
        totalItems,
        totalPages,
      },
    };
  }

  private getOrderBy(
    sort: GetProductsQuery['sort'],
  ): Prisma.ProductOrderByWithRelationInput {
    switch (sort) {
      case 'price-asc':
        return { price: 'asc' };
      case 'price-desc':
        return { price: 'desc' };
      case 'name-asc':
        return { name: 'asc' };
      case 'newest':
      default:
        return { createdAt: 'desc' };
    }
  }
}
