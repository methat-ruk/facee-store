import { Injectable, type MessageEvent } from '@nestjs/common';
import type { NotificationType, UserRole } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { Observable, Subject } from 'rxjs';
import type { NotificationsResponseDto } from './dto/notifications-response.dto';

type NotificationCopy = {
  type: NotificationType;
  orderNo?: string | null;
  titleEn: string;
  titleTh: string;
  bodyEn: string;
  bodyTh: string;
};

type NotificationRecord = {
  id: string;
  type: NotificationType;
  orderNo: string | null;
  titleEn: string;
  titleTh: string;
  bodyEn: string;
  bodyTh: string;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
};

const DEFAULT_NOTIFICATION_LIMIT = 12;

@Injectable()
export class NotificationsService {
  private readonly streams = new Map<
    string,
    Subject<NotificationsResponseDto>
  >();

  constructor(private readonly prisma: PrismaService) {}

  async listForUser(
    userId: string,
    limit = DEFAULT_NOTIFICATION_LIMIT,
  ): Promise<NotificationsResponseDto> {
    const [items, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: {
          userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      }),
      this.prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      }),
    ]);

    return {
      unreadCount,
      items: items.map((item: NotificationRecord) =>
        this.toNotificationItem(item),
      ),
    };
  }

  async markAsRead(
    userId: string,
    notificationId: string,
  ): Promise<NotificationsResponseDto> {
    await this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    const snapshot = await this.listForUser(userId);
    this.pushSnapshot(userId, snapshot);
    return snapshot;
  }

  async markAllAsRead(userId: string): Promise<NotificationsResponseDto> {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    const snapshot = await this.listForUser(userId);
    this.pushSnapshot(userId, snapshot);
    return snapshot;
  }

  async markOrderNotificationsAsRead(
    userId: string,
    orderNo: string,
  ): Promise<NotificationsResponseDto> {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        orderNo,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    const snapshot = await this.listForUser(userId);
    this.pushSnapshot(userId, snapshot);
    return snapshot;
  }

  streamForUser(userId: string): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      const subject = this.getOrCreateStream(userId);
      let isClosed = false;

      void this.listForUser(userId).then((snapshot) => {
        if (!isClosed) {
          subscriber.next({
            type: 'notifications.snapshot',
            data: snapshot,
          });
        }
      });

      const keepAliveId = setInterval(() => {
        subscriber.next({
          type: 'notifications.ping',
          data: {
            timestamp: new Date().toISOString(),
          },
        });
      }, 25_000);

      const subscription = subject.subscribe((snapshot) => {
        subscriber.next({
          type: 'notifications.snapshot',
          data: snapshot,
        });
      });

      return () => {
        isClosed = true;
        clearInterval(keepAliveId);
        subscription.unsubscribe();

        queueMicrotask(() => {
          if (!subject.observed) {
            this.streams.delete(userId);
          }
        });
      };
    });
  }

  async notifyUser(userId: string, copy: NotificationCopy) {
    await this.prisma.notification.create({
      data: {
        userId,
        type: copy.type,
        orderNo: copy.orderNo ?? null,
        titleEn: copy.titleEn,
        titleTh: copy.titleTh,
        bodyEn: copy.bodyEn,
        bodyTh: copy.bodyTh,
      },
    });

    await this.emitSnapshot(userId);
  }

  async notifyUsers(userIds: string[], copy: NotificationCopy) {
    const normalizedUserIds = Array.from(new Set(userIds.filter(Boolean)));

    if (normalizedUserIds.length === 0) {
      return;
    }

    await this.prisma.notification.createMany({
      data: normalizedUserIds.map((userId) => ({
        userId,
        type: copy.type,
        orderNo: copy.orderNo ?? null,
        titleEn: copy.titleEn,
        titleTh: copy.titleTh,
        bodyEn: copy.bodyEn,
        bodyTh: copy.bodyTh,
      })),
    });

    await Promise.all(
      normalizedUserIds.map((userId) => this.emitSnapshot(userId)),
    );
  }

  async notifyRole(role: UserRole, copy: NotificationCopy) {
    const users = await this.prisma.user.findMany({
      where: {
        role,
      },
      select: {
        id: true,
      },
    });

    await this.notifyUsers(
      users.map((user: { id: string }) => user.id),
      copy,
    );
  }

  private getOrCreateStream(userId: string) {
    const current = this.streams.get(userId);

    if (current) {
      return current;
    }

    const subject = new Subject<NotificationsResponseDto>();
    this.streams.set(userId, subject);
    return subject;
  }

  private async emitSnapshot(userId: string) {
    if (!this.streams.has(userId)) {
      return;
    }

    const snapshot = await this.listForUser(userId);
    this.pushSnapshot(userId, snapshot);
  }

  private pushSnapshot(userId: string, snapshot: NotificationsResponseDto) {
    this.streams.get(userId)?.next(snapshot);
  }

  private toNotificationItem(item: NotificationRecord) {
    return {
      id: item.id,
      type: item.type,
      orderNo: item.orderNo,
      titleEn: item.titleEn,
      titleTh: item.titleTh,
      bodyEn: item.bodyEn,
      bodyTh: item.bodyTh,
      isRead: item.isRead,
      readAt: item.readAt?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
    };
  }
}
