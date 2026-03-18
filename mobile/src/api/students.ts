import { apiClient } from './client';
import { StudentProfile, PerformanceSummary } from '@types';

export const studentsApi = {
  getProfile: async (): Promise<StudentProfile> => {
    const response = await apiClient.get<StudentProfile>('/api/v1/students/profile');
    return response.data;
  },

  getPerformanceSummary: async (studentId?: number): Promise<PerformanceSummary> => {
    const endpoint = studentId
      ? `/api/v1/students/${studentId}/performance`
      : '/api/v1/students/performance';
    const response = await apiClient.get<PerformanceSummary>(endpoint);
    return response.data;
  },

  updateProfile: async (data: Partial<StudentProfile>): Promise<StudentProfile> => {
    const response = await apiClient.put<StudentProfile>('/api/v1/students/profile', data);
    return response.data;
  },
};
