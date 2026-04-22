import { Controller, Get, Query } from '@nestjs/common';
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
}
