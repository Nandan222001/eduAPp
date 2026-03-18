import { useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import {
  setGrades,
  setPerformanceInsights,
  setLastSynced,
  setSyncing,
  setError,
} from '@store/slices/gradesSlice';
import { gradesApi } from '@api/grades';
import { offlineQueueManager } from '@utils/offlineQueue';

export const useGradesSync = () => {
  const dispatch = useAppDispatch();
  const gradesState = useAppSelector(state => state.grades);
  const [localSyncing, setLocalSyncing] = useState(false);

  const syncGrades = useCallback(async () => {
    const isOnline = offlineQueueManager.isConnected();

    if (!isOnline) {
      console.log('[GradesSync] Offline, using cached data');
      return;
    }

    setLocalSyncing(true);
    dispatch(setSyncing(true));

    try {
      const [gradesRes, insightsRes] = await Promise.allSettled([
        gradesApi.getGrades(),
        gradesApi.getPerformanceInsights(),
      ]);

      if (gradesRes.status === 'fulfilled') {
        dispatch(setGrades(gradesRes.value.data));
      }

      if (insightsRes.status === 'fulfilled') {
        dispatch(setPerformanceInsights(insightsRes.value.data));
      }

      dispatch(setLastSynced(new Date().toISOString()));
      console.log('[GradesSync] Grades synced successfully');
    } catch (error: any) {
      console.error('[GradesSync] Sync failed:', error);
      dispatch(setError(error.message || 'Failed to sync grades'));
    } finally {
      setLocalSyncing(false);
      dispatch(setSyncing(false));
    }
  }, [dispatch]);

  return {
    syncGrades,
    isSyncing: localSyncing || gradesState.isSyncing,
    lastSynced: gradesState.lastSynced,
    error: gradesState.error,
    grades: gradesState.grades,
    performanceInsights: gradesState.performanceInsights,
  };
};
