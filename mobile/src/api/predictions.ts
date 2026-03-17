import { apiClient } from './client';

export interface TopicProbability {
  id: number;
  topic: string;
  subject: string;
  probability: number;
  starRating: number;
  expectedQuestions: number;
  lastYearFrequency: number;
}

export interface QuestionBlueprint {
  id: number;
  section: string;
  topic: string;
  questionType: string;
  marks: number;
  expectedCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  subtopics?: string[];
}

export interface FocusArea {
  id: number;
  topic: string;
  subject: string;
  priority: 'high' | 'medium' | 'low';
  estimatedStudyHours: number;
  currentMastery: number;
  targetMastery: number;
  resources: string[];
}

export interface DailyTask {
  id: number;
  title: string;
  description: string;
  subject: string;
  duration: number;
  taskType: 'practice' | 'reading' | 'revision' | 'mock_test';
  completed: boolean;
  scheduledFor: string;
}

export interface StudyPlan {
  id: number;
  startDate: string;
  endDate: string;
  totalHours: number;
  completedHours: number;
  dailyTasks: DailyTask[];
  weeklyGoals: string[];
}

export interface AIPredictionDashboard {
  predictedScore: number;
  confidence: number;
  trend: 'improving' | 'stable' | 'declining';
  topicProbabilities: TopicProbability[];
  focusAreas: FocusArea[];
  studyPlan: StudyPlan;
  lastUpdated: string;
}

export interface BoardExamPrediction {
  examName: string;
  examDate: string;
  predictedGrade: string;
  predictedPercentage: number;
  confidence: number;
  questionBlueprint: QuestionBlueprint[];
  subjectWisePrediction: {
    subject: string;
    predictedScore: number;
    maxScore: number;
    confidence: number;
  }[];
}

export const predictionsApi = {
  getAIPredictionDashboard: async () => {
    return apiClient.get<AIPredictionDashboard>('/api/v1/ai-prediction-dashboard');
  },

  getBoardExamPredictions: async () => {
    return apiClient.get<BoardExamPrediction>('/api/v1/board-exam-predictions');
  },

  markTaskComplete: async (taskId: number) => {
    return apiClient.post<DailyTask>(`/api/v1/study-plan/tasks/${taskId}/complete`);
  },

  regenerateStudyPlan: async () => {
    return apiClient.post<StudyPlan>('/api/v1/study-plan/regenerate');
  },
};
