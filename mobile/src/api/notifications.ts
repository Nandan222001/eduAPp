import { apiClient } from './client';
import { Notification, NotificationPreferences, NotificationStats } from '@types';

export interface NotificationFilter {
  category?: 'general' | 'academic' | 'attendance' | 'exam' | 'fee' | 'event' | 'assignment';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  isRead?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const notificationsApi = {
  getNotifications: async (filter?: NotificationFilter): Promise<Notification[]> => {
    const response = await apiClient.get<Notification[]>('/api/v1/notifications', {
      params: filter,
    });
    return response.data;
  },

  getNotificationById: async (notificationId: number): Promise<Notification> => {
    const response = await apiClient.get<Notification>(`/api/v1/notifications/${notificationId}`);
    return response.data;
  },

  markAsRead: async (notificationId: number | number[]): Promise<void> => {
    if (Array.isArray(notificationId)) {
      await apiClient.post('/api/v1/notifications/mark-read', {
        notificationIds: notificationId,
      });
    } else {
      await apiClient.patch(`/api/v1/notifications/${notificationId}/read`, {});
    }
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.post('/api/v1/notifications/mark-all-read', {});
  },

  deleteNotification: async (notificationId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/notifications/${notificationId}`);
  },

  getPreferences: async (): Promise<NotificationPreferences> => {
    const response = await apiClient.get<NotificationPreferences>(
      '/api/v1/notifications/preferences'
    );
    return response.data;
  },

  updatePreferences: async (
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> => {
    const response = await apiClient.put<NotificationPreferences>(
      '/api/v1/notifications/preferences',
      preferences
    );
    return response.data;
  },

  getStats: async (): Promise<NotificationStats> => {
    const response = await apiClient.get<NotificationStats>('/api/v1/notifications/stats');
    return response.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<{ count: number }>('/api/v1/notifications/unread-count');
    return response.data.count;
  },
};
