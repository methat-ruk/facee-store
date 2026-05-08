import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.cjs';
import { PrismaService } from '../../../prisma/prisma.service';
import { ProductDetailResponseDto } from './dto/product-detail-response.dto';
import { GetProductsQuery } from './dto/get-products-query.dto';
import { ProductListResponseDto } from './dto/product-list-response.dto';

type ProductsStorefrontPrisma = {
  product: Pick<PrismaService['product'], 'count' | 'findFirst' | 'findMany'>;
  $queryRaw: PrismaService['$queryRaw'];
};

type ProductSoldCountRow = {
  productId: string;
  soldCount: bigint | number;
};

export const productCardSelect = {
  id: true,
  name: true,
  slug: true,
  createdAt: true,
  sizeLabel: true,
  description: true,
  imageUrl: true,
  isFlashSale: true,
  price: true,
  compareAtPrice: true,
  stock: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
} satisfies Prisma.ProductSelect;

export const productDetailSelect = {
  ...productCardSelect,
  subtitle: true,
  howToUse: true,
  benefits: true,
  ingredients: true,
  galleryImages: true,
} satisfies Prisma.ProductSelect;

export function toNumber(
  value: Prisma.Decimal | { toString(): string } | null,
): number | null {
  if (!value) {
    return null;
  }

  return Number(value.toString());
}

@Injectable()
export class ProductsService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: ProductsStorefrontPrisma,
  ) {}

  async findAll(query: GetProductsQuery): Promise<ProductListResponseDto> {
    const where: Prisma.ProductWhereInput = {
      isPublished: true,
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
                description: {
                  contains: query.query,
                  mode: 'insensitive',
                },
              },
              {
                subtitle: {
                  contains: query.query,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
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
      select: productCardSelect,
      orderBy: this.getOrderBy(query.sort),
      skip,
      take: query.limit,
    });
    const soldCountMap = await this.getSoldCountMap(
      items.map((item) => item.id),
    );

    return {
      items: items.map((item: (typeof items)[number]) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        price: Number(item.price),
        compareAtPrice: toNumber(item.compareAtPrice),
        soldCount: soldCountMap.get(item.id) ?? 0,
      })),
      meta: {
        page,
        limit: query.limit,
        totalItems,
        totalPages,
      },
    };
  }

  async findBySlug(slug: string): Promise<ProductDetailResponseDto> {
    const product = await this.prisma.product.findFirst({
      where: {
        slug,
        isPublished: true,
      },
      select: productDetailSelect,
    });

    if (!product) {
      throw new NotFoundException(`Published product "${slug}" was not found.`);
    }

    const relatedProducts = await this.prisma.product.findMany({
      where: {
        isPublished: true,
        categoryId: product.category.id,
        slug: {
          not: slug,
        },
      },
      select: productCardSelect,
      orderBy: {
        createdAt: 'desc',
      },
      take: 3,
    });
    const soldCountMap = await this.getSoldCountMap([
      product.id,
      ...relatedProducts.map((item) => item.id),
    ]);

    return {
      product: {
        ...product,
        createdAt: product.createdAt.toISOString(),
        price: Number(product.price),
        compareAtPrice: toNumber(product.compareAtPrice),
        soldCount: soldCountMap.get(product.id) ?? 0,
      },
      relatedProducts: relatedProducts.map(
        (item: (typeof relatedProducts)[number]) => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
          price: Number(item.price),
          compareAtPrice: toNumber(item.compareAtPrice),
          soldCount: soldCountMap.get(item.id) ?? 0,
        }),
      ),
    };
  }

  private async getSoldCountMap(productIds: string[]) {
    const distinctProductIds = [...new Set(productIds)];

    if (distinctProductIds.length === 0) {
      return new Map<string, number>();
    }

    const rows = await this.prisma.$queryRaw<ProductSoldCountRow[]>(Prisma.sql`
      SELECT
        oi."productId" AS "productId",
        COALESCE(SUM(oi."quantity"), 0) AS "soldCount"
      FROM "OrderItem" oi
      INNER JOIN "Order" o ON o."id" = oi."orderId"
      WHERE oi."productId" IN (${Prisma.join(distinctProductIds)})
        AND o."status" <> 'CANCELED'
      GROUP BY oi."productId"
    `);

    return new Map(rows.map((row) => [row.productId, Number(row.soldCount)]));
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
