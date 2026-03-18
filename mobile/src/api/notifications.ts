import { apiClient } from './client';
import { NotificationPreferences } from '../services/notificationService';

export interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  notification_group: string;
  priority: string;
  channel: string;
  status: string;
  data?: any;
  read_at?: string;
  sent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  by_channel: Record<string, number>;
  by_priority: Record<string, number>;
  by_group: Record<string, number>;
}

export interface NotificationPreferenceResponse {
  id: number;
  user_id: number;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  email_types?: Record<string, boolean>;
  sms_types?: Record<string, boolean>;
  push_types?: Record<string, boolean>;
  in_app_types?: Record<string, boolean>;
  group_preferences?: Record<string, boolean>;
  minimum_priority: string;
  quiet_hours_enabled: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  quiet_hours_days?: number[];
  digest_mode: string;
  digest_channels?: string[];
  digest_delivery_time?: string;
  enable_smart_grouping: boolean;
  grouping_window_minutes: number;
  dnd_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const notificationApi = {
  getNotifications: async (params?: {
    status?: string;
    channel?: string;
    group?: string;
    skip?: number;
    limit?: number;
  }) => {
    return apiClient.get<Notification[]>('/api/v1/notifications/', { params });
  },

  getNotificationById: async (id: number) => {
    return apiClient.get<Notification>(`/api/v1/notifications/${id}`);
  },

  markAsRead: async (id: number) => {
    return apiClient.patch<Notification>(`/api/v1/notifications/${id}/read`, {});
  },

  markAllAsRead: async () => {
    return apiClient.post<{ message: string }>('/api/v1/notifications/mark-all-read', {});
  },

  deleteNotification: async (id: number) => {
    return apiClient.delete<{ message: string }>(`/api/v1/notifications/${id}`);
  },

  getStats: async () => {
    return apiClient.get<NotificationStats>('/api/v1/notifications/stats');
  },

  getPreferences: async () => {
    return apiClient.get<NotificationPreferenceResponse>('/api/v1/notifications/preferences/me');
  },

  updatePreferences: async (preferences: Partial<NotificationPreferenceResponse>) => {
    return apiClient.put<NotificationPreferenceResponse>(
      '/api/v1/notifications/preferences/me',
      preferences
    );
  },
};
