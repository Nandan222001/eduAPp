import { useQuery } from '@tanstack/react-query';
import { studentApi } from '../api';

export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await studentApi.getProfile();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useAttendanceSummary = () => {
  return useQuery({
    queryKey: ['attendance', 'summary'],
    queryFn: async () => {
      const response = await studentApi.getAttendanceSummary();
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useAssignments = () => {
  return useQuery({
    queryKey: ['assignments'],
    queryFn: async () => {
      const response = await studentApi.getAssignments();
      return response.data;
    },
    staleTime: 3 * 60 * 1000,
  });
};

export const useGrades = () => {
  return useQuery({
    queryKey: ['grades'],
    queryFn: async () => {
      const response = await studentApi.getGrades();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useAIPrediction = () => {
  return useQuery({
    queryKey: ['ai-prediction'],
    queryFn: async () => {
      const response = await studentApi.getAIPredictionDashboard();
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
  });
};

export const useWeakAreas = () => {
  return useQuery({
    queryKey: ['weak-areas'],
    queryFn: async () => {
      const response = await studentApi.getWeakAreas();
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
  });
};

export const useGamification = () => {
  return useQuery({
    queryKey: ['gamification'],
    queryFn: async () => {
      const response = await studentApi.getGamification();
      return response.data;
    },
    staleTime: 1 * 60 * 1000,
  });
};
