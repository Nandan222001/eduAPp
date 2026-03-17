import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parentApi, AttendanceParams, GradesParams } from '../api/parent';
import { SendMessageData } from '../types/parent';

const DEFAULT_STALE_TIME = 5 * 60 * 1000;
const DEFAULT_RETRY = 3;
const DEFAULT_RETRY_DELAY = (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000);

export const useParentDashboard = () => {
  return useQuery({
    queryKey: ['parent-dashboard'],
    queryFn: async () => {
      const response = await parentApi.getDashboard();
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
    retry: DEFAULT_RETRY,
    retryDelay: DEFAULT_RETRY_DELAY,
  });
};

export const useChildren = () => {
  return useQuery({
    queryKey: ['parent-children'],
    queryFn: async () => {
      const response = await parentApi.getChildren();
      return response.data;
    },
    staleTime: DEFAULT_STALE_TIME,
    retry: DEFAULT_RETRY,
    retryDelay: DEFAULT_RETRY_DELAY,
  });
};

export const useChildAttendance = (childId: number | null, params?: AttendanceParams) => {
  return useQuery({
    queryKey: ['child-attendance', childId, params?.month, params?.year],
    queryFn: async () => {
      if (!childId) throw new Error('Child ID is required');
      const response = await parentApi.getChildAttendance(childId, params);
      return response.data;
    },
    enabled: !!childId,
    staleTime: 2 * 60 * 1000,
    retry: DEFAULT_RETRY,
    retryDelay: DEFAULT_RETRY_DELAY,
  });
};

export const useChildGrades = (childId: number | null, params?: GradesParams) => {
  return useQuery({
    queryKey: ['child-grades', childId, params?.term, params?.subject],
    queryFn: async () => {
      if (!childId) throw new Error('Child ID is required');
      const response = await parentApi.getChildGrades(childId, params);
      return response.data;
    },
    enabled: !!childId,
    staleTime: DEFAULT_STALE_TIME,
    retry: DEFAULT_RETRY,
    retryDelay: DEFAULT_RETRY_DELAY,
  });
};

export const useMessageThreads = () => {
  return useQuery({
    queryKey: ['message-threads'],
    queryFn: async () => {
      const response = await parentApi.getMessageThreads();
      return response.data;
    },
    staleTime: 1 * 60 * 1000,
    retry: DEFAULT_RETRY,
    retryDelay: DEFAULT_RETRY_DELAY,
  });
};

export const useThreadMessages = (threadId: number | null) => {
  return useQuery({
    queryKey: ['thread-messages', threadId],
    queryFn: async () => {
      if (!threadId) throw new Error('Thread ID is required');
      const response = await parentApi.getThreadMessages(threadId);
      return response.data;
    },
    enabled: !!threadId,
    staleTime: 30 * 1000,
    retry: DEFAULT_RETRY,
    retryDelay: DEFAULT_RETRY_DELAY,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendMessageData) => parentApi.sendMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-threads'] });
      queryClient.invalidateQueries({ queryKey: ['thread-messages'] });
    },
  });
};

export const useMarkMessageAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: number) => parentApi.markMessageAsRead(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-threads'] });
      queryClient.invalidateQueries({ queryKey: ['thread-messages'] });
    },
  });
};
