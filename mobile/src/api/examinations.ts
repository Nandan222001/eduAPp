import { apiClient } from './client';
import { Exam, ExamResult, Marksheet, ExamSchedule } from '@types';

export interface ExamFilter {
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  subjectId?: number;
  examType?: string;
  startDate?: string;
  endDate?: string;
}

export const examinationsApi = {
  getExams: async (filter?: ExamFilter): Promise<Exam[]> => {
    const response = await apiClient.get<Exam[]>('/api/v1/examinations', {
      params: filter,
    });
    return response.data;
  },

  getExamById: async (examId: number): Promise<Exam> => {
    const response = await apiClient.get<Exam>(`/api/v1/examinations/${examId}`);
    return response.data;
  },

  getExamResults: async (studentId?: number, examId?: number): Promise<ExamResult[]> => {
    let endpoint = '/api/v1/examinations/results';

    if (studentId && examId) {
      endpoint = `/api/v1/examinations/results?studentId=${studentId}&examId=${examId}`;
    } else if (studentId) {
      endpoint = `/api/v1/examinations/results?studentId=${studentId}`;
    } else if (examId) {
      endpoint = `/api/v1/examinations/results?examId=${examId}`;
    }

    const response = await apiClient.get<ExamResult[]>(endpoint);
    return response.data;
  },

  getExamResultById: async (resultId: number): Promise<ExamResult> => {
    const response = await apiClient.get<ExamResult>(`/api/v1/examinations/results/${resultId}`);
    return response.data;
  },

  getMarksheet: async (examId: number, studentId?: number): Promise<Marksheet> => {
    const endpoint = studentId
      ? `/api/v1/examinations/${examId}/marksheet?studentId=${studentId}`
      : `/api/v1/examinations/${examId}/marksheet`;
    const response = await apiClient.get<Marksheet>(endpoint);
    return response.data;
  },

  getExamSchedule: async (examId: number): Promise<ExamSchedule[]> => {
    const response = await apiClient.get<ExamSchedule[]>(`/api/v1/examinations/${examId}/schedule`);
    return response.data;
  },

  getUpcomingExams: async (limit?: number): Promise<Exam[]> => {
    const response = await apiClient.get<Exam[]>('/api/v1/examinations/upcoming', {
      params: { limit },
    });
    return response.data;
  },
};
