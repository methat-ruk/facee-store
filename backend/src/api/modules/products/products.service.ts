import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.cjs';
import { PrismaService } from '../../../prisma/prisma.service';
import { ProductDetailResponseDto } from './dto/product-detail-response.dto';
import { GetProductsQuery } from './dto/get-products-query.dto';
import { ProductListResponseDto } from './dto/product-list-response.dto';

type ProductsStorefrontPrisma = {
  product: Pick<PrismaService['product'], 'count' | 'findFirst' | 'findMany'>;
};

export const productCardSelect = {
  id: true,
  name: true,
  slug: true,
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

    return {
      items: items.map((item: (typeof items)[number]) => ({
        ...item,
        price: Number(item.price),
        compareAtPrice: toNumber(item.compareAtPrice),
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

    return {
      product: {
        ...product,
        price: Number(product.price),
        compareAtPrice: toNumber(product.compareAtPrice),
      },
      relatedProducts: relatedProducts.map(
        (item: (typeof relatedProducts)[number]) => ({
          ...item,
          price: Number(item.price),
          compareAtPrice: toNumber(item.compareAtPrice),
        }),
      ),
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
