import axios from '@/lib/axios';
import type {
  Recognition,
  RecognitionCreate,
  RecognitionUpdate,
  RecognitionListParams,
  RecognitionListResponse,
  RecognitionStats,
  StudentSpotlight,
  RecognitionFlag,
  RecognitionModeration,
  RecognitionNotificationPreference,
  SchoolCultureAnalytics,
} from '@/types/recognition';

const recognitionApi = {
  listRecognitions: async (params: RecognitionListParams): Promise<RecognitionListResponse> => {
    const response = await axios.get('/api/v1/recognitions/', { params });
    return response.data;
  },

  getRecognition: async (id: number): Promise<Recognition> => {
    const response = await axios.get(`/api/v1/recognitions/${id}`);
    return response.data;
  },

  createRecognition: async (data: RecognitionCreate): Promise<Recognition> => {
    const response = await axios.post('/api/v1/recognitions/', data);
    return response.data;
  },

  updateRecognition: async (id: number, data: RecognitionUpdate): Promise<Recognition> => {
    const response = await axios.put(`/api/v1/recognitions/${id}`, data);
    return response.data;
  },

  deleteRecognition: async (id: number): Promise<void> => {
    await axios.delete(`/api/v1/recognitions/${id}`);
  },

  likeRecognition: async (id: number): Promise<{ likes_count: number }> => {
    const response = await axios.post(`/api/v1/recognitions/${id}/like`);
    return response.data;
  },

  unlikeRecognition: async (id: number): Promise<{ likes_count: number }> => {
    const response = await axios.delete(`/api/v1/recognitions/${id}/like`);
    return response.data;
  },

  getMyReceivedRecognitions: async (
    params?: RecognitionListParams
  ): Promise<RecognitionListResponse> => {
    const response = await axios.get('/api/v1/recognitions/me/received', { params });
    return response.data;
  },

  getMySentRecognitions: async (
    params?: RecognitionListParams
  ): Promise<RecognitionListResponse> => {
    const response = await axios.get('/api/v1/recognitions/me/sent', { params });
    return response.data;
  },

  getMyStats: async (): Promise<RecognitionStats> => {
    const response = await axios.get('/api/v1/recognitions/me/stats');
    return response.data;
  },

  getPublicRecognitions: async (
    params?: RecognitionListParams
  ): Promise<RecognitionListResponse> => {
    const response = await axios.get('/api/v1/recognitions/public', { params });
    return response.data;
  },

  getTrendingRecognitions: async (limit?: number): Promise<Recognition[]> => {
    const response = await axios.get('/api/v1/recognitions/trending', {
      params: { limit },
    });
    return response.data;
  },

  getStudentSpotlight: async (period?: 'weekly' | 'monthly'): Promise<StudentSpotlight[]> => {
    const response = await axios.get('/api/v1/recognitions/spotlight', {
      params: { period },
    });
    return response.data;
  },

  flagRecognition: async (data: RecognitionFlag): Promise<void> => {
    await axios.post('/api/v1/recognitions/flag', data);
  },

  getFlaggedRecognitions: async (): Promise<RecognitionModeration[]> => {
    const response = await axios.get('/api/v1/recognitions/moderation/flagged');
    return response.data;
  },

  approveRecognition: async (id: number, notes?: string): Promise<void> => {
    await axios.post(`/api/v1/recognitions/moderation/${id}/approve`, { notes });
  },

  removeRecognition: async (id: number, notes?: string): Promise<void> => {
    await axios.post(`/api/v1/recognitions/moderation/${id}/remove`, { notes });
  },

  getNotificationPreferences: async (): Promise<RecognitionNotificationPreference> => {
    const response = await axios.get('/api/v1/recognitions/notifications/preferences');
    return response.data;
  },

  updateNotificationPreferences: async (
    data: RecognitionNotificationPreference
  ): Promise<RecognitionNotificationPreference> => {
    const response = await axios.put('/api/v1/recognitions/notifications/preferences', data);
    return response.data;
  },

  getSchoolCultureAnalytics: async (
    startDate?: string,
    endDate?: string
  ): Promise<SchoolCultureAnalytics> => {
    const response = await axios.get('/api/v1/recognitions/analytics/culture', {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  },

  searchStudents: async (
    query: string
  ): Promise<
    Array<{
      id: number;
      name: string;
      avatar?: string;
      grade?: string;
      section?: string;
    }>
  > => {
    const response = await axios.get('/api/v1/students/search', {
      params: { q: query, limit: 10 },
    });
    return response.data;
  },
};

export default recognitionApi;
