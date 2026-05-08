import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AdminRoleGuard } from '../../../common/guards/admin-role.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AdminCustomerDetailResponseDto } from './dto/admin-customer-detail-response.dto';
import { AdminCustomerListResponseDto } from './dto/admin-customer-list-response.dto';
import { AdminCustomerParamDto } from './dto/admin-customer-param.dto';
import { AdminCustomerQueryDto } from './dto/admin-customer-query.dto';
import { AdminCustomersService } from './admin-customers.service';

@Controller('admin/customers')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class AdminCustomersController {
  constructor(private readonly adminCustomersService: AdminCustomersService) {}

  @Get()
  listCustomers(
    @Query() query: AdminCustomerQueryDto,
  ): Promise<AdminCustomerListResponseDto> {
    return this.adminCustomersService.listCustomers(query);
  }

  @Get(':customerId')
  getCustomerDetail(
    @Param() params: AdminCustomerParamDto,
  ): Promise<AdminCustomerDetailResponseDto> {
    return this.adminCustomersService.getCustomerDetail(params.customerId);
  }
}
