import { apiClient } from './client';

export interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  subjects?: string[];
  department?: string;
  profilePhoto?: string;
}

export interface Message {
  id: number;
  threadId: number;
  senderId: number;
  senderName: string;
  senderType: 'teacher' | 'parent' | 'admin' | 'school';
  receiverId: number;
  receiverName: string;
  receiverType: 'teacher' | 'parent' | 'admin' | 'school';
  content: string;
  sentAt: string;
  isRead: boolean;
}

export interface MessageThread {
  id: number;
  subject: string;
  participants: {
    id: number;
    name: string;
    type: 'teacher' | 'parent' | 'admin' | 'school';
    profilePhoto?: string;
  }[];
  lastMessage: {
    content: string;
    sentAt: string;
    senderName: string;
  };
  unreadCount: number;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  authorId: number;
  authorName: string;
  authorType: 'teacher' | 'admin' | 'school';
  category: 'general' | 'academic' | 'event' | 'urgent' | 'holiday';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  publishedAt: string;
  expiresAt?: string;
  isRead: boolean;
  attachments?: {
    id: number;
    fileName: string;
    fileUrl: string;
    fileSize: number;
  }[];
  targetAudience: string[];
}

export interface SendMessageRequest {
  receiverId: number;
  receiverType: 'teacher' | 'admin';
  subject: string;
  content: string;
  threadId?: number;
}

export interface CreateThreadRequest {
  receiverId: number;
  receiverType: 'teacher' | 'admin';
  subject: string;
  content: string;
}

export interface MarkAsReadRequest {
  messageIds?: number[];
  threadId?: number;
  announcementId?: number;
}

export const messagesApi = {
  getTeachers: async () => {
    return apiClient.get<Teacher[]>('/api/v1/teachers');
  },

  getThreads: async (search?: string) => {
    const queryString = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiClient.get<MessageThread[]>(`/api/v1/messages${queryString}`);
  },

  getThread: async (threadId: number) => {
    return apiClient.get<MessageThread>(`/api/v1/messages/${threadId}`);
  },

  sendMessage: async (data: SendMessageRequest) => {
    return apiClient.post<Message>('/api/v1/messages', data);
  },

  createThread: async (data: CreateThreadRequest) => {
    return apiClient.post<MessageThread>('/api/v1/messages/threads', data);
  },

  markAsRead: async (data: MarkAsReadRequest) => {
    return apiClient.patch<void>('/api/v1/messages/read', data);
  },

  markThreadAsRead: async (threadId: number) => {
    return apiClient.patch<void>(`/api/v1/messages/threads/${threadId}/read`, {});
  },

  getAnnouncements: async (category?: string, unreadOnly?: boolean) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (unreadOnly !== undefined) params.append('unread_only', unreadOnly.toString());
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<Announcement[]>(`/api/v1/announcements${queryString}`);
  },

  getAnnouncement: async (announcementId: number) => {
    return apiClient.get<Announcement>(`/api/v1/announcements/${announcementId}`);
  },

  markAnnouncementAsRead: async (announcementId: number) => {
    return apiClient.patch<void>(`/api/v1/announcements/${announcementId}/read`, {});
  },
};
