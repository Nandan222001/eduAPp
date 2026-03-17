import { apiClient } from './client';
import {
  Profile,
  AttendanceSummary,
  Assignment,
  Grade,
  AIPrediction,
  WeakArea,
  GamificationData,
} from '../types/student';

export const studentApi = {
  getProfile: async () => {
    return apiClient.get<Profile>('/api/v1/profile');
  },

  getAttendanceSummary: async () => {
    return apiClient.get<AttendanceSummary>('/api/v1/attendance/summary');
  },

  getAssignments: async () => {
    return apiClient.get<Assignment[]>('/api/v1/assignments');
  },

  getGrades: async () => {
    return apiClient.get<Grade[]>('/api/v1/grades');
  },

  getAIPredictionDashboard: async () => {
    return apiClient.get<AIPrediction>('/api/v1/ai-prediction-dashboard');
  },

  getWeakAreas: async () => {
    return apiClient.get<WeakArea[]>('/api/v1/weakness-detection');
  },

  getGamification: async () => {
    return apiClient.get<GamificationData>('/api/v1/gamification');
  },
};
