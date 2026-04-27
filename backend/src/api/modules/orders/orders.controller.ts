import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateOrderRequestDto } from './dto/create-order-request.dto';
import { CreateOrderResponseDto } from './dto/create-order-response.dto';
import { GetOrderByOrderNoParamDto } from './dto/get-order-by-order-no-param.dto';
import { OrderDetailResponseDto } from './dto/order-detail-response.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateOrderRequestDto,
  ): Promise<CreateOrderResponseDto> {
    return this.ordersService.createOrder(request.user.sub, body);
  }

  @Get(':orderNo')
  async getOrderByOrderNo(
    @Req() request: AuthenticatedRequest,
    @Param() params: GetOrderByOrderNoParamDto,
  ): Promise<OrderDetailResponseDto> {
    return this.ordersService.getOrderByOrderNo(
      request.user.sub,
      params.orderNo,
    );
  }
}
