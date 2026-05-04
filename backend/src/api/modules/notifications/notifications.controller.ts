import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { GetNotificationParamDto } from './dto/get-notification-param.dto';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { NotificationOrderParamDto } from './dto/notification-order-param.dto';
import { NotificationsResponseDto } from './dto/notifications-response.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  listNotifications(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListNotificationsQueryDto,
  ): Promise<NotificationsResponseDto> {
    return this.notificationsService.listForUser(request.user.sub, query.limit);
  }

  @Post('read-all')
  markAllAsRead(
    @Req() request: AuthenticatedRequest,
  ): Promise<NotificationsResponseDto> {
    return this.notificationsService.markAllAsRead(request.user.sub);
  }

  @Post(':notificationId/read')
  markAsRead(
    @Req() request: AuthenticatedRequest,
    @Param() params: GetNotificationParamDto,
  ): Promise<NotificationsResponseDto> {
    return this.notificationsService.markAsRead(
      request.user.sub,
      params.notificationId,
    );
  }

  @Post('orders/:orderNo/read')
  markOrderNotificationsAsRead(
    @Req() request: AuthenticatedRequest,
    @Param() params: NotificationOrderParamDto,
  ): Promise<NotificationsResponseDto> {
    return this.notificationsService.markOrderNotificationsAsRead(
      request.user.sub,
      params.orderNo,
    );
  }

  @Sse('stream')
  streamNotifications(
    @Req() request: AuthenticatedRequest,
  ): Observable<MessageEvent> {
    return this.notificationsService.streamForUser(request.user.sub);
  }
}
