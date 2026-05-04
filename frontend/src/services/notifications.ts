import { apiConfig, buildApiUrl } from '@/config/api';
import { api } from '@/services/api';
import {
  notificationsSnapshotSchema,
  type NotificationsSnapshot,
} from '@/features/notifications/schemas';

export async function listNotifications(limit?: number) {
  const response = await api.get(apiConfig.endpoints.notifications.list, {
    params: limit ? { limit } : undefined,
  });
  return notificationsSnapshotSchema.parse(response.data);
}

export async function markNotificationAsRead(notificationId: string) {
  const response = await api.post(
    apiConfig.endpoints.notifications.read(notificationId),
  );
  return notificationsSnapshotSchema.parse(response.data);
}

export async function markOrderNotificationsAsRead(orderNo: string) {
  const response = await api.post(
    apiConfig.endpoints.notifications.readOrder(orderNo),
  );
  return notificationsSnapshotSchema.parse(response.data);
}

export async function markAllNotificationsAsRead() {
  const response = await api.post(apiConfig.endpoints.notifications.readAll);
  return notificationsSnapshotSchema.parse(response.data);
}

export function createNotificationsEventSource() {
  return new EventSource(
    buildApiUrl(apiConfig.endpoints.notifications.stream),
    {
      withCredentials: true,
    },
  );
}

export function parseNotificationsEvent(data: string): NotificationsSnapshot {
  return notificationsSnapshotSchema.parse(JSON.parse(data));
}
