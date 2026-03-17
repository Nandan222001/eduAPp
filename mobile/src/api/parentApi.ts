import { apiClient } from './client';
import {
  Child,
  ChildStats,
  TodayAttendance,
  Grade,
  Assignment,
  FeePayment,
  TeacherMessage,
  Announcement,
  AttendanceCalendar,
  SubjectAttendance,
  ExamResult,
  SubjectPerformance,
} from '../types/parent';

export const parentApi = {
  getChildren: async (): Promise<Child[]> => {
    return apiClient.get('/parent/children');
  },

  getChildStats: async (childId: number): Promise<ChildStats> => {
    return apiClient.get(`/parent/children/${childId}/stats`);
  },

  getTodayAttendance: async (childId: number): Promise<TodayAttendance> => {
    return apiClient.get(`/parent/children/${childId}/attendance/today`);
  },

  getRecentGrades: async (childId: number, limit: number = 5): Promise<Grade[]> => {
    return apiClient.get(`/parent/children/${childId}/grades/recent?limit=${limit}`);
  },

  getPendingAssignments: async (childId: number): Promise<Assignment[]> => {
    return apiClient.get(`/parent/children/${childId}/assignments/pending`);
  },

  getFeePayments: async (childId: number): Promise<FeePayment[]> => {
    return apiClient.get(`/parent/children/${childId}/fees`);
  },

  getMessages: async (): Promise<TeacherMessage[]> => {
    return apiClient.get('/parent/messages');
  },

  getAnnouncements: async (): Promise<Announcement[]> => {
    return apiClient.get('/parent/announcements');
  },

  markMessageAsRead: async (messageId: number): Promise<void> => {
    return apiClient.patch(`/parent/messages/${messageId}/read`);
  },

  sendMessage: async (recipientId: number, subject: string, message: string): Promise<void> => {
    return apiClient.post('/parent/messages', { recipientId, subject, message });
  },

  getAttendanceCalendar: async (
    childId: number,
    year: number,
    month: number
  ): Promise<AttendanceCalendar> => {
    return apiClient.get(`/parent/children/${childId}/attendance/calendar`, {
      params: { year, month },
    });
  },

  getSubjectAttendance: async (childId: number): Promise<SubjectAttendance[]> => {
    return apiClient.get(`/parent/children/${childId}/attendance/subjects`);
  },

  getExamResults: async (childId: number, term?: string): Promise<ExamResult[]> => {
    const params = term ? { term } : {};
    return apiClient.get(`/parent/children/${childId}/exams/results`, { params });
  },

  getSubjectPerformance: async (childId: number): Promise<SubjectPerformance[]> => {
    return apiClient.get(`/parent/children/${childId}/performance/subjects`);
  },
};
