import { apiClient } from './client';
import { StudyMaterial, MaterialFilter, Bookmark, MaterialStats } from '@types';

export const studyMaterialsApi = {
  getMaterials: async (filter?: MaterialFilter): Promise<StudyMaterial[]> => {
    const response = await apiClient.get<StudyMaterial[]>('/api/v1/study-materials', {
      params: filter,
    });
    return response.data;
  },

  getMaterialById: async (materialId: number): Promise<StudyMaterial> => {
    const response = await apiClient.get<StudyMaterial>(`/api/v1/study-materials/${materialId}`);
    return response.data;
  },

  downloadMaterial: async (
    materialId: number
  ): Promise<{ downloadUrl: string; fileName: string }> => {
    const response = await apiClient.get<{ downloadUrl: string; fileName: string }>(
      `/api/v1/study-materials/${materialId}/download`
    );
    return response.data;
  },

  bookmarkMaterial: async (materialId: number, note?: string): Promise<Bookmark> => {
    const response = await apiClient.post<Bookmark>(
      `/api/v1/study-materials/${materialId}/bookmark`,
      { note }
    );
    return response.data;
  },

  removeBookmark: async (materialId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/study-materials/${materialId}/bookmark`);
  },

  getBookmarks: async (): Promise<Bookmark[]> => {
    const response = await apiClient.get<Bookmark[]>('/api/v1/study-materials/bookmarks');
    return response.data;
  },

  getMaterialsBySubject: async (
    subjectId: number,
    filter?: MaterialFilter
  ): Promise<StudyMaterial[]> => {
    const response = await apiClient.get<StudyMaterial[]>(
      `/api/v1/study-materials/subject/${subjectId}`,
      { params: filter }
    );
    return response.data;
  },

  getMaterialsByChapter: async (chapterId: number): Promise<StudyMaterial[]> => {
    const response = await apiClient.get<StudyMaterial[]>(
      `/api/v1/study-materials/chapter/${chapterId}`
    );
    return response.data;
  },

  searchMaterials: async (query: string, filter?: MaterialFilter): Promise<StudyMaterial[]> => {
    const response = await apiClient.get<StudyMaterial[]>('/api/v1/study-materials/search', {
      params: { q: query, ...filter },
    });
    return response.data;
  },

  getRecentlyViewed: async (limit?: number): Promise<StudyMaterial[]> => {
    const response = await apiClient.get<StudyMaterial[]>('/api/v1/study-materials/recent', {
      params: { limit },
    });
    return response.data;
  },

  getRecommended: async (limit?: number): Promise<StudyMaterial[]> => {
    const response = await apiClient.get<StudyMaterial[]>('/api/v1/study-materials/recommended', {
      params: { limit },
    });
    return response.data;
  },

  getStats: async (): Promise<MaterialStats> => {
    const response = await apiClient.get<MaterialStats>('/api/v1/study-materials/stats');
    return response.data;
  },

  recordView: async (materialId: number): Promise<void> => {
    await apiClient.post(`/api/v1/study-materials/${materialId}/view`, {});
  },

  rateMaterial: async (materialId: number, rating: number): Promise<void> => {
    await apiClient.post(`/api/v1/study-materials/${materialId}/rate`, { rating });
  },
};
