import axios from 'axios';
import {
  EssayPrompt,
  SavedEssay,
  EssayVersion,
  AISuggestion,
  PeerReview,
  CounselorFeedback,
  EssayTemplate,
  EssayAnalytics,
  AssignedEssayForReview,
  EssayFeedbackSummary,
  GrammarCheckRequest,
  GrammarCheckResponse,
} from '@/types/scholarshipEssay';
import {
  mockPrompts,
  mockEssays,
  mockTemplates,
  mockAssignedEssays,
  mockFeedbackSummary,
  mockAnalytics,
  mockAISuggestions,
  mockGrammarIssues,
} from '@/data/mockScholarshipEssayData';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export const scholarshipEssayApi = {
  getPrompts: async (type?: string): Promise<EssayPrompt[]> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return type ? mockPrompts.filter((p) => p.type === type) : mockPrompts;
    }
    const response = await axios.get(`${API_URL}/scholarship-essays/prompts`, {
      params: { type },
    });
    return response.data;
  },

  getPromptById: async (id: string): Promise<EssayPrompt> => {
    const response = await axios.get(`${API_URL}/scholarship-essays/prompts/${id}`);
    return response.data;
  },

  getEssays: async (studentId: string): Promise<SavedEssay[]> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return mockEssays;
    }
    const response = await axios.get(`${API_URL}/scholarship-essays/essays`, {
      params: { studentId },
    });
    return response.data;
  },

  getEssayById: async (id: string): Promise<SavedEssay> => {
    const response = await axios.get(`${API_URL}/scholarship-essays/essays/${id}`);
    return response.data;
  },

  createEssay: async (data: Partial<SavedEssay>): Promise<SavedEssay> => {
    const response = await axios.post(`${API_URL}/scholarship-essays/essays`, data);
    return response.data;
  },

  updateEssay: async (id: string, data: Partial<SavedEssay>): Promise<SavedEssay> => {
    const response = await axios.put(`${API_URL}/scholarship-essays/essays/${id}`, data);
    return response.data;
  },

  deleteEssay: async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/scholarship-essays/essays/${id}`);
  },

  getEssayVersions: async (essayId: string): Promise<EssayVersion[]> => {
    const response = await axios.get(`${API_URL}/scholarship-essays/essays/${essayId}/versions`);
    return response.data;
  },

  createEssayVersion: async (essayId: string, content: string): Promise<EssayVersion> => {
    const response = await axios.post(`${API_URL}/scholarship-essays/essays/${essayId}/versions`, {
      content,
    });
    return response.data;
  },

  getAISuggestions: async (essayId: string): Promise<AISuggestion[]> => {
    const response = await axios.get(
      `${API_URL}/scholarship-essays/essays/${essayId}/ai-suggestions`
    );
    return response.data;
  },

  generateAISuggestions: async (essayId: string, content: string): Promise<AISuggestion[]> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return mockAISuggestions;
    }
    const response = await axios.post(
      `${API_URL}/scholarship-essays/essays/${essayId}/ai-suggestions`,
      {
        content,
      }
    );
    return response.data;
  },

  acceptAISuggestion: async (essayId: string, suggestionId: string): Promise<void> => {
    await axios.post(
      `${API_URL}/scholarship-essays/essays/${essayId}/ai-suggestions/${suggestionId}/accept`
    );
  },

  checkGrammar: async (request: GrammarCheckRequest): Promise<GrammarCheckResponse> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        matches: mockGrammarIssues,
        language: { code: request.language, name: 'English (US)' },
      };
    }
    const response = await axios.post(`${API_URL}/scholarship-essays/grammar-check`, request);
    return response.data;
  },

  getAssignedReviews: async (reviewerId: string): Promise<AssignedEssayForReview[]> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return mockAssignedEssays;
    }
    const response = await axios.get(`${API_URL}/scholarship-essays/peer-reviews/assigned`, {
      params: { reviewerId },
    });
    return response.data;
  },

  getEssayForReview: async (assignmentId: string): Promise<AssignedEssayForReview> => {
    const response = await axios.get(
      `${API_URL}/scholarship-essays/peer-reviews/assignments/${assignmentId}`
    );
    return response.data;
  },

  submitPeerReview: async (
    assignmentId: string,
    review: Partial<PeerReview>
  ): Promise<PeerReview> => {
    const response = await axios.post(
      `${API_URL}/scholarship-essays/peer-reviews/assignments/${assignmentId}/submit`,
      review
    );
    return response.data;
  },

  updatePeerReview: async (
    assignmentId: string,
    review: Partial<PeerReview>
  ): Promise<PeerReview> => {
    const response = await axios.put(
      `${API_URL}/scholarship-essays/peer-reviews/assignments/${assignmentId}`,
      review
    );
    return response.data;
  },

  getEssayFeedback: async (essayId: string): Promise<EssayFeedbackSummary> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return mockFeedbackSummary;
    }
    const response = await axios.get(`${API_URL}/scholarship-essays/essays/${essayId}/feedback`);
    return response.data;
  },

  getCounselorReviewQueue: async (counselorId: string): Promise<SavedEssay[]> => {
    const response = await axios.get(`${API_URL}/scholarship-essays/counselor/review-queue`, {
      params: { counselorId },
    });
    return response.data;
  },

  submitCounselorFeedback: async (
    essayId: string,
    feedback: Partial<CounselorFeedback>
  ): Promise<CounselorFeedback> => {
    const response = await axios.post(
      `${API_URL}/scholarship-essays/counselor/essays/${essayId}/feedback`,
      feedback
    );
    return response.data;
  },

  getTemplates: async (type?: string): Promise<EssayTemplate[]> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return type ? mockTemplates.filter((t) => t.promptType === type) : mockTemplates;
    }
    const response = await axios.get(`${API_URL}/scholarship-essays/templates`, {
      params: { type },
    });
    return response.data;
  },

  getTemplateById: async (id: string): Promise<EssayTemplate> => {
    const response = await axios.get(`${API_URL}/scholarship-essays/templates/${id}`);
    return response.data;
  },

  getEssayAnalytics: async (essayId: string): Promise<EssayAnalytics> => {
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return mockAnalytics;
    }
    const response = await axios.get(`${API_URL}/scholarship-essays/essays/${essayId}/analytics`);
    return response.data;
  },

  compareVersions: async (
    essayId: string,
    version1: number,
    version2: number
  ): Promise<{ diff: string; metrics: Record<string, unknown> }> => {
    const response = await axios.get(
      `${API_URL}/scholarship-essays/essays/${essayId}/versions/compare`,
      {
        params: { version1, version2 },
      }
    );
    return response.data;
  },
};

export default scholarshipEssayApi;
