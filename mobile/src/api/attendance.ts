import { apiClient } from './client';
import { AttendanceSummary, AttendanceHistory, AttendanceRecord } from '@types';

export interface AttendanceFilter {
  startDate?: string;
  endDate?: string;
  subjectId?: number;
  status?: 'present' | 'absent' | 'late';
}

export const attendanceApi = {
  getAttendanceSummary: async (studentId?: number): Promise<AttendanceSummary> => {
    const endpoint = studentId
      ? `/api/v1/attendance/${studentId}/summary`
      : '/api/v1/attendance/summary';
    const response = await apiClient.get<AttendanceSummary>(endpoint);
    return response.data;
  },

  getAttendanceHistory: async (
    filter?: AttendanceFilter,
    studentId?: number
  ): Promise<AttendanceHistory[]> => {
    const endpoint = studentId
      ? `/api/v1/attendance/${studentId}/history`
      : '/api/v1/attendance/history';

    const response = await apiClient.get<AttendanceHistory[]>(endpoint, {
      params: filter,
    });
    return response.data;
  },

  getAttendanceByDate: async (date: string, studentId?: number): Promise<AttendanceRecord[]> => {
    const endpoint = studentId
      ? `/api/v1/attendance/${studentId}/date/${date}`
      : `/api/v1/attendance/date/${date}`;
    const response = await apiClient.get<AttendanceRecord[]>(endpoint);
    return response.data;
  },

  getTodayAttendance: async (studentId?: number): Promise<AttendanceRecord[]> => {
    const endpoint = studentId
      ? `/api/v1/attendance/${studentId}/today`
      : '/api/v1/attendance/today';
    const response = await apiClient.get<AttendanceRecord[]>(endpoint);
    return response.data;
  },
};
