import axios from 'axios';
import type {
  MistakeReplayData,
  MistakeInsuranceData,
  MistakeCorrection,
  BeforeAfterComparison,
  SillyMistake,
} from '@/types/mistakeAnalysis';

const API_URL = import.meta.env.VITE_API_BASE_URL || '';

export const mistakeAnalysisApi = {
  getMistakeReplay: async (
    studentId: number,
    month?: string,
    year?: number
  ): Promise<MistakeReplayData> => {
    const params = {
      ...(month ? { month } : {}),
      ...(year ? { year } : {}),
    };
    const response = await axios.get(`${API_URL}/api/v1/students/${studentId}/mistakes/replay`, {
      params,
    });
    return response.data;
  },

  getMistakeInsurance: async (studentId: number): Promise<MistakeInsuranceData> => {
    const response = await axios.get(`${API_URL}/api/v1/students/${studentId}/mistakes/insurance`);
    return response.data;
  },

  submitMistakeCorrection: async (
    studentId: number,
    correction: MistakeCorrection
  ): Promise<{ success: boolean; tokens_earned?: number }> => {
    const response = await axios.post(
      `${API_URL}/api/v1/students/${studentId}/mistakes/corrections`,
      correction
    );
    return response.data;
  },

  getBeforeAfterComparison: async (
    studentId: number,
    examId: number
  ): Promise<BeforeAfterComparison> => {
    const response = await axios.get(
      `${API_URL}/api/v1/students/${studentId}/mistakes/comparison/${examId}`
    );
    return response.data;
  },

  completeMasteryTest: async (
    studentId: number,
    patternId: number,
    score: number
  ): Promise<{ success: boolean; new_mastery_level: number }> => {
    const response = await axios.post(
      `${API_URL}/api/v1/students/${studentId}/mistakes/mastery-test`,
      { pattern_id: patternId, score }
    );
    return response.data;
  },

  getSillyMistakeDetails: async (studentId: number, mistakeId: number): Promise<SillyMistake> => {
    const response = await axios.get(
      `${API_URL}/api/v1/students/${studentId}/mistakes/silly/${mistakeId}`
    );
    return response.data;
  },

  claimInsurance: async (
    studentId: number,
    examId: number,
    tokensToSpend: number
  ): Promise<{ success: boolean; new_score: number; new_rank?: number }> => {
    const response = await axios.post(
      `${API_URL}/api/v1/students/${studentId}/mistakes/insurance/claim`,
      { exam_id: examId, tokens: tokensToSpend }
    );
    return response.data;
  },
};
