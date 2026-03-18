import { offlineQueueManager, QueuedRequestType } from '@utils/offlineQueue';
import { assignmentsApi, SubmitAssignmentData } from './assignments';
import { doubtsApi } from './doubts';
import { CreateDoubtRequest, CreateAnswerRequest } from '@types';
import { store } from '@store';
import {
  optimisticUpdateAssignment,
  rollbackAssignment,
  setLastSynced,
} from '@store/slices/assignmentsSlice';

export interface OfflineSubmitAssignmentOptions {
  optimistic?: boolean;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export const offlineAwareApi = {
  async submitAssignment(
    data: SubmitAssignmentData,
    options: OfflineSubmitAssignmentOptions = {}
  ): Promise<any> {
    const isOnline = offlineQueueManager.isConnected();
    const { optimistic = true } = options;

    const currentAssignment = store
      .getState()
      .assignments.assignments.find(a => a.id === data.assignmentId);

    if (optimistic && currentAssignment) {
      store.dispatch(
        optimisticUpdateAssignment({
          id: data.assignmentId,
          updates: {
            status: 'submitted',
            submittedAt: new Date().toISOString(),
            submission: {
              id: -1,
              submittedAt: new Date().toISOString(),
              status: 'submitted',
              comments: data.comments,
              attachments: data.attachments.map((att, idx) => ({
                id: -(idx + 1),
                fileName: att.fileName,
                fileUrl: '',
                fileType: att.fileType,
                fileSize: att.fileSize,
              })),
            },
          },
        })
      );
    }

    try {
      if (isOnline) {
        const response = await assignmentsApi.submitAssignment(data);
        store.dispatch(setLastSynced(new Date().toISOString()));
        options.onSuccess?.();
        return response;
      } else {
        const requestId = await offlineQueueManager.addRequest(
          QueuedRequestType.ASSIGNMENT_SUBMISSION,
          '/api/v1/submissions',
          'POST',
          data,
          undefined,
          { assignmentId: data.assignmentId }
        );

        console.log(`[OfflineAwareApi] Queued assignment submission: ${requestId}`);
        return { queued: true, requestId };
      }
    } catch (error: any) {
      if (optimistic && currentAssignment) {
        store.dispatch(rollbackAssignment(currentAssignment));
      }

      if (error.status === 0 || error.message?.includes('Network')) {
        const requestId = await offlineQueueManager.addRequest(
          QueuedRequestType.ASSIGNMENT_SUBMISSION,
          '/api/v1/submissions',
          'POST',
          data,
          undefined,
          { assignmentId: data.assignmentId }
        );

        console.log(`[OfflineAwareApi] Network error, queued assignment: ${requestId}`);
        return { queued: true, requestId };
      }

      options.onError?.(error);
      throw error;
    }
  },

  async postDoubt(doubt: CreateDoubtRequest): Promise<any> {
    const isOnline = offlineQueueManager.isConnected();

    try {
      if (isOnline) {
        const response = await doubtsApi.postDoubt(doubt);
        return response;
      } else {
        const requestId = await offlineQueueManager.addRequest(
          QueuedRequestType.DOUBT_POST,
          '/api/v1/doubts',
          'POST',
          doubt,
          { 'Content-Type': 'multipart/form-data' },
          { title: doubt.title }
        );

        console.log(`[OfflineAwareApi] Queued doubt post: ${requestId}`);
        return { queued: true, requestId };
      }
    } catch (error: any) {
      if (error.status === 0 || error.message?.includes('Network')) {
        const requestId = await offlineQueueManager.addRequest(
          QueuedRequestType.DOUBT_POST,
          '/api/v1/doubts',
          'POST',
          doubt,
          { 'Content-Type': 'multipart/form-data' },
          { title: doubt.title }
        );

        console.log(`[OfflineAwareApi] Network error, queued doubt: ${requestId}`);
        return { queued: true, requestId };
      }

      throw error;
    }
  },

  async postAnswer(answer: CreateAnswerRequest): Promise<any> {
    const isOnline = offlineQueueManager.isConnected();

    try {
      if (isOnline) {
        const response = await doubtsApi.postAnswer(answer);
        return response;
      } else {
        const requestId = await offlineQueueManager.addRequest(
          QueuedRequestType.DOUBT_ANSWER,
          `/api/v1/doubts/${answer.doubtId}/answers`,
          'POST',
          answer,
          { 'Content-Type': 'multipart/form-data' },
          { doubtId: answer.doubtId }
        );

        console.log(`[OfflineAwareApi] Queued doubt answer: ${requestId}`);
        return { queued: true, requestId };
      }
    } catch (error: any) {
      if (error.status === 0 || error.message?.includes('Network')) {
        const requestId = await offlineQueueManager.addRequest(
          QueuedRequestType.DOUBT_ANSWER,
          `/api/v1/doubts/${answer.doubtId}/answers`,
          'POST',
          answer,
          { 'Content-Type': 'multipart/form-data' },
          { doubtId: answer.doubtId }
        );

        console.log(`[OfflineAwareApi] Network error, queued answer: ${requestId}`);
        return { queued: true, requestId };
      }

      throw error;
    }
  },

  async markAttendance(attendanceData: {
    date: string;
    status: 'present' | 'absent' | 'late';
    sessionId?: number;
  }): Promise<any> {
    const isOnline = offlineQueueManager.isConnected();

    try {
      if (isOnline) {
        // Assuming there's an attendance marking endpoint
        // This would need to be implemented in attendanceApi
        return { success: true };
      } else {
        const requestId = await offlineQueueManager.addRequest(
          QueuedRequestType.ATTENDANCE_MARKING,
          '/api/v1/attendance/mark',
          'POST',
          attendanceData,
          undefined,
          { date: attendanceData.date }
        );

        console.log(`[OfflineAwareApi] Queued attendance marking: ${requestId}`);
        return { queued: true, requestId };
      }
    } catch (error: any) {
      if (error.status === 0 || error.message?.includes('Network')) {
        const requestId = await offlineQueueManager.addRequest(
          QueuedRequestType.ATTENDANCE_MARKING,
          '/api/v1/attendance/mark',
          'POST',
          attendanceData,
          undefined,
          { date: attendanceData.date }
        );

        console.log(`[OfflineAwareApi] Network error, queued attendance: ${requestId}`);
        return { queued: true, requestId };
      }

      throw error;
    }
  },
};
