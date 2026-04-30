import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminRoleGuard } from '../../../common/guards/admin-role.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { AdminReviewCancellationRequestDto } from './dto/admin-review-cancellation-request.dto';
import { CancellationRequestParamDto } from './dto/cancellation-request-param.dto';
import { GetOrderByOrderNoParamDto } from './dto/get-order-by-order-no-param.dto';
import { OrderDetailResponseDto } from './dto/order-detail-response.dto';
import { OrderListResponseDto } from './dto/order-list-response.dto';
import { UpdateRefundStatusDto } from './dto/update-refund-status.dto';
import { OrdersService } from './orders.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('orders')
  listOrders(): Promise<OrderListResponseDto> {
    return this.ordersService.listAdminOrders();
  }

  @Get('orders/:orderNo')
  getOrderByOrderNo(
    @Param() params: GetOrderByOrderNoParamDto,
  ): Promise<OrderDetailResponseDto> {
    return this.ordersService.getAdminOrderByOrderNo(params.orderNo);
  }

  @Post('cancellation-requests/:requestId/review')
  reviewCancellationRequest(
    @Req() request: AuthenticatedRequest,
    @Param() params: CancellationRequestParamDto,
    @Body() body: AdminReviewCancellationRequestDto,
  ): Promise<OrderDetailResponseDto> {
    return this.ordersService.reviewCancellationRequest(
      request.user.sub,
      params.requestId,
      body,
    );
  }

  @Post('orders/:orderNo/refund-status')
  updateRefundStatus(
    @Param() params: GetOrderByOrderNoParamDto,
    @Body() body: UpdateRefundStatusDto,
  ): Promise<OrderDetailResponseDto> {
    return this.ordersService.updateRefundStatus(params.orderNo, body);
  }
}
