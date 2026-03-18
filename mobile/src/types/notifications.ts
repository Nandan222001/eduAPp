export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'announcement';
  category: 'general' | 'academic' | 'attendance' | 'exam' | 'fee' | 'event' | 'assignment';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: NotificationMetadata;
  senderId?: number;
  senderName?: string;
  senderRole?: string;
}

export interface NotificationMetadata {
  examId?: number;
  assignmentId?: number;
  eventId?: number;
  announcementId?: number;
  entityType?: string;
  entityId?: number;
  [key: string]: any;
}

export interface NotificationPreferences {
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  categories: {
    general: boolean;
    academic: boolean;
    attendance: boolean;
    exam: boolean;
    fee: boolean;
    event: boolean;
    assignment: boolean;
  };
  quiet_hours?: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

export interface NotificationStats {
  total: number;
  unread: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
}
