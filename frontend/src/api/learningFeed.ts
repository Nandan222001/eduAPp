import axios from 'axios';
import type {
  LearningResource,
  RecommendationCategory,
  LearningPlaylist,
  ContentFeedback,
  FilterOptions,
  ContentFilters,
  TeacherCuratedCollection,
  LearningProgress,
} from '@/types/learningFeed';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const learningFeedApi = {
  // Get personalized recommendations
  getRecommendations: async (filters?: ContentFilters): Promise<RecommendationCategory[]> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/learning-feed/recommendations`, {
      params: filters,
    });
    return response.data;
  },

  // Get filter options
  getFilterOptions: async (): Promise<FilterOptions> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/learning-feed/filter-options`);
    return response.data;
  },

  // Get a specific resource
  getResource: async (resourceId: number): Promise<LearningResource> => {
    const response = await axios.get(
      `${API_BASE_URL}/api/v1/learning-feed/resources/${resourceId}`
    );
    return response.data;
  },

  // Submit feedback on a resource
  submitFeedback: async (feedback: ContentFeedback): Promise<void> => {
    await axios.post(`${API_BASE_URL}/api/v1/learning-feed/feedback`, feedback);
  },

  // Update resource rating
  rateResource: async (resourceId: number, rating: number): Promise<void> => {
    await axios.post(`${API_BASE_URL}/api/v1/learning-feed/resources/${resourceId}/rate`, {
      rating,
    });
  },

  // Playlists
  getPlaylists: async (): Promise<LearningPlaylist[]> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/learning-feed/playlists`);
    return response.data;
  },

  createPlaylist: async (name: string, description?: string): Promise<LearningPlaylist> => {
    const response = await axios.post(`${API_BASE_URL}/api/v1/learning-feed/playlists`, {
      name,
      description,
    });
    return response.data;
  },

  addToPlaylist: async (playlistId: number, resourceId: number): Promise<void> => {
    await axios.post(
      `${API_BASE_URL}/api/v1/learning-feed/playlists/${playlistId}/resources/${resourceId}`
    );
  },

  removeFromPlaylist: async (playlistId: number, resourceId: number): Promise<void> => {
    await axios.delete(
      `${API_BASE_URL}/api/v1/learning-feed/playlists/${playlistId}/resources/${resourceId}`
    );
  },

  deletePlaylist: async (playlistId: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/api/v1/learning-feed/playlists/${playlistId}`);
  },

  // Bookmarks
  toggleBookmark: async (resourceId: number): Promise<void> => {
    await axios.post(`${API_BASE_URL}/api/v1/learning-feed/resources/${resourceId}/bookmark`);
  },

  // Teacher curated collections
  getCuratedCollections: async (): Promise<TeacherCuratedCollection[]> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/learning-feed/curated-collections`);
    return response.data;
  },

  getCuratedCollection: async (collectionId: number): Promise<TeacherCuratedCollection> => {
    const response = await axios.get(
      `${API_BASE_URL}/api/v1/learning-feed/curated-collections/${collectionId}`
    );
    return response.data;
  },

  // Track progress
  updateProgress: async (
    resourceId: number,
    progress: Partial<LearningProgress>
  ): Promise<void> => {
    await axios.post(
      `${API_BASE_URL}/api/v1/learning-feed/resources/${resourceId}/progress`,
      progress
    );
  },

  markAsCompleted: async (resourceId: number): Promise<void> => {
    await axios.post(`${API_BASE_URL}/api/v1/learning-feed/resources/${resourceId}/complete`);
  },
};

export default learningFeedApi;
