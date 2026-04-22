import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CategoryResponseDto } from './dto/category-response.dto';

type CategoriesStorefrontPrisma = {
  category: Pick<PrismaService['category'], 'findMany'>;
};

@Injectable()
export class CategoriesService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: CategoriesStorefrontPrisma,
  ) {}

  findAll(): Promise<CategoryResponseDto[]> {
    return this.prisma.category.findMany({
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
  }
}
