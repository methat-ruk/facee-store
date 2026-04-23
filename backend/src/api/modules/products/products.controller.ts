import { Controller, Get, Param, Query } from '@nestjs/common';
import { GetProductBySlugParamDto } from './dto/get-product-by-slug-param.dto';
import { ProductDetailResponseDto } from './dto/product-detail-response.dto';
import { GetProductsQueryDto } from './dto/get-products-query.dto';
import { ProductListResponseDto } from './dto/product-list-response.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getProducts(
    @Query() query: GetProductsQueryDto,
  ): Promise<ProductListResponseDto> {
    return this.productsService.findAll(query);
  }

  @Get(':slug')
  async getProductBySlug(
    @Param() params: GetProductBySlugParamDto,
  ): Promise<ProductDetailResponseDto> {
    return this.productsService.findBySlug(params.slug);
  }
}
