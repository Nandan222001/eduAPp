import axios from '@/lib/axios';
import {
  LearningStyleQuestion,
  LearningStyleProfile,
  LearningStyleAnswer,
  StudyTip,
  AdaptiveContent,
  ContentEffectiveness,
  ClassLearningStyleDistribution,
  ParentLearningGuide,
} from '@/types/learningStyle';

const learningStyleApi = {
  // Get assessment questions
  getAssessmentQuestions: async (): Promise<LearningStyleQuestion[]> => {
    const response = await axios.get('/learning-style/questions');
    return response.data;
  },

  // Submit assessment
  submitAssessment: async (
    studentId: number,
    answers: LearningStyleAnswer[]
  ): Promise<LearningStyleProfile> => {
    const response = await axios.post(`/learning-style/students/${studentId}/assessment`, {
      answers,
    });
    return response.data;
  },

  // Get student's learning style profile
  getProfile: async (studentId: number): Promise<LearningStyleProfile> => {
    const response = await axios.get(`/learning-style/students/${studentId}/profile`);
    return response.data;
  },

  // Get study tips for learning style
  getStudyTips: async (learningStyle: string): Promise<StudyTip[]> => {
    const response = await axios.get(`/learning-style/study-tips/${learningStyle}`);
    return response.data;
  },

  // Get adaptive content
  getAdaptiveContent: async (
    studentId: number,
    filters?: {
      subject?: string;
      topic?: string;
      difficulty?: number;
    }
  ): Promise<AdaptiveContent[]> => {
    const response = await axios.get(`/learning-style/students/${studentId}/content`, {
      params: filters,
    });
    return response.data;
  },

  // Track content interaction
  trackContentInteraction: async (
    studentId: number,
    contentId: number,
    format: string,
    data: {
      completion_rate: number;
      time_spent: number;
      quiz_score?: number;
      engagement_score: number;
    }
  ): Promise<void> => {
    await axios.post(`/learning-style/students/${studentId}/content/${contentId}/track`, {
      format,
      ...data,
    });
  },

  // Get content effectiveness
  getContentEffectiveness: async (studentId: number): Promise<ContentEffectiveness[]> => {
    const response = await axios.get(`/learning-style/students/${studentId}/effectiveness`);
    return response.data;
  },

  // Get class distribution (for teachers)
  getClassDistribution: async (classId: number): Promise<ClassLearningStyleDistribution> => {
    const response = await axios.get(`/learning-style/classes/${classId}/distribution`);
    return response.data;
  },

  // Get parent guide
  getParentGuide: async (studentId: number): Promise<ParentLearningGuide> => {
    const response = await axios.get(`/learning-style/students/${studentId}/parent-guide`);
    return response.data;
  },

  // Update learning style profile
  updateProfile: async (
    studentId: number,
    updates: Partial<LearningStyleProfile>
  ): Promise<LearningStyleProfile> => {
    const response = await axios.patch(`/learning-style/students/${studentId}/profile`, updates);
    return response.data;
  },
};

export default learningStyleApi;
