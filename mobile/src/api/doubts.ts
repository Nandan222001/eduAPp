import { apiClient } from './client';
import {
  Doubt,
  Answer,
  DoubtFilter,
  DoubtStats,
  CreateDoubtRequest,
  CreateAnswerRequest,
} from '@types';

export const doubtsApi = {
  getDoubts: async (filter?: DoubtFilter): Promise<Doubt[]> => {
    const response = await apiClient.get<Doubt[]>('/api/v1/doubts', {
      params: filter,
    });
    return response.data;
  },

  getDoubtById: async (doubtId: number): Promise<Doubt> => {
    const response = await apiClient.get<Doubt>(`/api/v1/doubts/${doubtId}`);
    return response.data;
  },

  postDoubt: async (doubt: CreateDoubtRequest): Promise<Doubt> => {
    const formData = new FormData();
    formData.append('title', doubt.title);
    formData.append('description', doubt.description);
    formData.append('subjectId', doubt.subjectId.toString());

    if (doubt.chapterId) formData.append('chapterId', doubt.chapterId.toString());
    if (doubt.topicId) formData.append('topicId', doubt.topicId.toString());
    if (doubt.priority) formData.append('priority', doubt.priority);
    if (doubt.tags) formData.append('tags', JSON.stringify(doubt.tags));

    if (doubt.attachments && doubt.attachments.length > 0) {
      doubt.attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });
    }

    const response = await apiClient.post<Doubt>('/api/v1/doubts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateDoubt: async (doubtId: number, updates: Partial<CreateDoubtRequest>): Promise<Doubt> => {
    const response = await apiClient.put<Doubt>(`/api/v1/doubts/${doubtId}`, updates);
    return response.data;
  },

  deleteDoubt: async (doubtId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/doubts/${doubtId}`);
  },

  getAnswers: async (doubtId: number): Promise<Answer[]> => {
    const response = await apiClient.get<Answer[]>(`/api/v1/doubts/${doubtId}/answers`);
    return response.data;
  },

  postAnswer: async (answer: CreateAnswerRequest): Promise<Answer> => {
    const formData = new FormData();
    formData.append('content', answer.content);

    if (answer.attachments && answer.attachments.length > 0) {
      answer.attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });
    }

    const response = await apiClient.post<Answer>(
      `/api/v1/doubts/${answer.doubtId}/answers`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  updateAnswer: async (answerId: number, content: string): Promise<Answer> => {
    const response = await apiClient.put<Answer>(`/api/v1/doubts/answers/${answerId}`, {
      content,
    });
    return response.data;
  },

  deleteAnswer: async (answerId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/doubts/answers/${answerId}`);
  },

  upvoteDoubt: async (doubtId: number): Promise<void> => {
    await apiClient.post(`/api/v1/doubts/${doubtId}/upvote`, {});
  },

  removeUpvoteDoubt: async (doubtId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/doubts/${doubtId}/upvote`);
  },

  upvoteAnswer: async (answerId: number): Promise<void> => {
    await apiClient.post(`/api/v1/doubts/answers/${answerId}/upvote`, {});
  },

  removeUpvoteAnswer: async (answerId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/doubts/answers/${answerId}/upvote`);
  },

  acceptAnswer: async (answerId: number): Promise<void> => {
    await apiClient.post(`/api/v1/doubts/answers/${answerId}/accept`, {});
  },

  resolveDoubt: async (doubtId: number): Promise<void> => {
    await apiClient.post(`/api/v1/doubts/${doubtId}/resolve`, {});
  },

  closeDoubt: async (doubtId: number): Promise<void> => {
    await apiClient.post(`/api/v1/doubts/${doubtId}/close`, {});
  },

  getMyDoubts: async (filter?: DoubtFilter): Promise<Doubt[]> => {
    const response = await apiClient.get<Doubt[]>('/api/v1/doubts/my-doubts', {
      params: filter,
    });
    return response.data;
  },

  getMyAnswers: async (): Promise<Answer[]> => {
    const response = await apiClient.get<Answer[]>('/api/v1/doubts/my-answers');
    return response.data;
  },

  getStats: async (): Promise<DoubtStats> => {
    const response = await apiClient.get<DoubtStats>('/api/v1/doubts/stats');
    return response.data;
  },

  searchDoubts: async (query: string, filter?: DoubtFilter): Promise<Doubt[]> => {
    const response = await apiClient.get<Doubt[]>('/api/v1/doubts/search', {
      params: { q: query, ...filter },
    });
    return response.data;
  },
};
