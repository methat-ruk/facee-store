import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import multer from 'multer';
import { AdminRoleGuard } from '../../../common/guards/admin-role.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { appEnv } from '../../../config/env';
import { AdminProductsService } from './admin-products.service';
import { AdminProductCategoryResponseDto } from './dto/admin-product-category-response.dto';
import { AdminProductDetailResponseDto } from './dto/admin-product-detail-response.dto';
import { AdminProductListQueryDto } from './dto/admin-product-list-query.dto';
import { AdminProductListResponseDto } from './dto/admin-product-list-response.dto';
import { AdminProductParamDto } from './dto/admin-product-param.dto';
import { AdminProductUploadResponseDto } from './dto/admin-product-upload-response.dto';
import {
  CreateAdminProductDto,
  UpdateAdminProductDto,
} from './dto/admin-upsert-product.dto';

@Controller('admin/products')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class AdminProductsController {
  constructor(private readonly adminProductsService: AdminProductsService) {}

  @Get()
  listProducts(
    @Query() query: AdminProductListQueryDto,
  ): Promise<AdminProductListResponseDto> {
    return this.adminProductsService.listProducts(query);
  }

  @Get('categories')
  listCategories(): Promise<AdminProductCategoryResponseDto[]> {
    return this.adminProductsService.listCategories();
  }

  @Get(':productId')
  getProduct(
    @Param() params: AdminProductParamDto,
  ): Promise<AdminProductDetailResponseDto> {
    return this.adminProductsService.getProductById(params.productId);
  }

  @Post()
  createProduct(
    @Body() body: CreateAdminProductDto,
  ): Promise<AdminProductDetailResponseDto> {
    return this.adminProductsService.createProduct(body);
  }

  @Patch(':productId')
  updateProduct(
    @Param() params: AdminProductParamDto,
    @Body() body: UpdateAdminProductDto,
  ): Promise<AdminProductDetailResponseDto> {
    return this.adminProductsService.updateProduct(params.productId, body);
  }

  @Post('upload')
  @UseInterceptors(
    FilesInterceptor('files', 8, {
      storage: multer.memoryStorage(),
      limits: {
        fileSize: appEnv.mediaMaxFileSizeBytes,
      },
    }),
  )
  uploadImages(
    @Body('slug') slug: string | undefined,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<AdminProductUploadResponseDto> {
    return this.adminProductsService.uploadImages(files ?? [], slug);
  }
}
