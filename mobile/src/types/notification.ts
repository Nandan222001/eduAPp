export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'read' | 'batched';

export type NotificationGroup =
  | 'academic'
  | 'administrative'
  | 'social'
  | 'system'
  | 'announcements'
  | 'assignments'
  | 'grades'
  | 'attendance'
  | 'fees'
  | 'events';

export type NotificationTopic = 'assignments' | 'grades' | 'attendance' | 'announcements';

export interface NotificationData {
  notification_id?: number;
  type?: NotificationTopic;
  screen?: string;
  id?: number | string;
  params?: Record<string, any>;
  [key: string]: any;
}

export interface PushNotification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  notification_group: NotificationGroup;
  priority: NotificationPriority;
  channel: NotificationChannel;
  status: NotificationStatus;
  data?: NotificationData;
  read_at?: string;
  sent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreference {
  id?: number;
  user_id?: number;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  email_types?: Record<string, boolean>;
  sms_types?: Record<string, boolean>;
  push_types?: Record<string, boolean>;
  in_app_types?: Record<string, boolean>;
  group_preferences?: Record<string, boolean>;
  minimum_priority: NotificationPriority;
  quiet_hours_enabled: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  quiet_hours_days?: number[];
  digest_mode: 'disabled' | 'hourly' | 'daily' | 'weekly';
  digest_channels?: NotificationChannel[];
  digest_delivery_time?: string;
  enable_smart_grouping: boolean;
  grouping_window_minutes: number;
  dnd_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  by_channel: Record<string, number>;
  by_priority: Record<string, number>;
  by_group: Record<string, number>;
}

export interface DeviceRegistration {
  token: string;
  platform: 'ios' | 'android' | 'web';
  device_name?: string;
  os_version?: string;
  app_version?: string;
  topics?: NotificationTopic[];
}
