import { useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import {
  setAssignments,
  setLastSynced,
  setSyncing,
  setError,
} from '@store/slices/assignmentsSlice';
import { assignmentsApi } from '@api/assignments';
import { offlineQueueManager } from '@utils/offlineQueue';

export const useAssignmentsSync = () => {
  const dispatch = useAppDispatch();
  const assignmentsState = useAppSelector(state => state.assignments);
  const [localSyncing, setLocalSyncing] = useState(false);

  const syncAssignments = useCallback(async () => {
    const isOnline = offlineQueueManager.isConnected();

    if (!isOnline) {
      console.log('[AssignmentsSync] Offline, using cached data');
      return;
    }

    setLocalSyncing(true);
    dispatch(setSyncing(true));

    try {
      const response = await assignmentsApi.getAssignments();
      dispatch(setAssignments(response.data));
      dispatch(setLastSynced(new Date().toISOString()));
      console.log('[AssignmentsSync] Assignments synced successfully');
    } catch (error: any) {
      console.error('[AssignmentsSync] Sync failed:', error);
      dispatch(setError(error.message || 'Failed to sync assignments'));
    } finally {
      setLocalSyncing(false);
      dispatch(setSyncing(false));
    }
  }, [dispatch]);

  return {
    syncAssignments,
    isSyncing: localSyncing || assignmentsState.isSyncing,
    lastSynced: assignmentsState.lastSynced,
    error: assignmentsState.error,
    assignments: assignmentsState.assignments,
  };
};
