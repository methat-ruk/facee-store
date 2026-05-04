import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminOrdersController } from './admin-orders.controller';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [
    OrdersController,
    AdminOrdersController,
    AdminDashboardController,
  ],
  providers: [OrdersService, AdminDashboardService],
})
export class OrdersModule {}
