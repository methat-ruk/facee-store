import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminRoleGuard } from '../../../common/guards/admin-role.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AdminDashboardQueryDto } from './dto/admin-dashboard-query.dto';
import { AdminDashboardResponseDto } from './dto/admin-dashboard-response.dto';
import { AdminDashboardService } from './admin-dashboard.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @Get('dashboard')
  getDashboard(
    @Query() query: AdminDashboardQueryDto,
  ): Promise<AdminDashboardResponseDto> {
    return this.adminDashboardService.getDashboard(query);
  }
}
