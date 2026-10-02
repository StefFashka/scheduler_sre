import { apiClient } from '../../shared/api/apiClient';
import type { NotificationItem } from '../../shared/types';

export const notificationsApi = {
  async getNotifications(): Promise<NotificationItem[]> {
    return apiClient.get<NotificationItem[]>('/api/notifications');
  },

  async markAsRead(notificationId: number): Promise<NotificationItem> {
    return apiClient.patch<NotificationItem>(`/api/notifications/${notificationId}/read`);
  },

  async deleteNotification(notificationId: number): Promise<void> {
    return apiClient.delete<void>(`/api/notifications/${notificationId}`);
  },
};
