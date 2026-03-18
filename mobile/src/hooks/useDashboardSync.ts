import { useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import {
  setProfile,
  setAttendanceSummary,
  setAssignments,
  setGrades,
  setAIPrediction,
  setWeakAreas,
  setGamification,
  setLastSynced,
  setSyncing,
  setError,
} from '@store/slices/dashboardSlice';
import { studentApi } from '@api/student';
import { offlineQueueManager } from '@utils/offlineQueue';

export const useDashboardSync = () => {
  const dispatch = useAppDispatch();
  const dashboardState = useAppSelector(state => state.dashboard);
  const [localSyncing, setLocalSyncing] = useState(false);

  const syncDashboard = useCallback(async () => {
    const isOnline = offlineQueueManager.isConnected();

    if (!isOnline) {
      console.log('[DashboardSync] Offline, using cached data');
      return;
    }

    setLocalSyncing(true);
    dispatch(setSyncing(true));

    try {
      const [
        profileRes,
        attendanceRes,
        assignmentsRes,
        gradesRes,
        aiPredictionRes,
        weakAreasRes,
        gamificationRes,
      ] = await Promise.allSettled([
        studentApi.getProfile(),
        studentApi.getAttendanceSummary(),
        studentApi.getAssignments(),
        studentApi.getGrades(),
        studentApi.getAIPredictionDashboard(),
        studentApi.getWeakAreas(),
        studentApi.getGamification(),
      ]);

      if (profileRes.status === 'fulfilled') {
        dispatch(setProfile(profileRes.value.data));
      }

      if (attendanceRes.status === 'fulfilled') {
        dispatch(setAttendanceSummary(attendanceRes.value.data || attendanceRes.value));
      }

      if (assignmentsRes.status === 'fulfilled') {
        dispatch(setAssignments(assignmentsRes.value.data));
      }

      if (gradesRes.status === 'fulfilled') {
        dispatch(setGrades(gradesRes.value.data));
      }

      if (aiPredictionRes.status === 'fulfilled') {
        dispatch(setAIPrediction(aiPredictionRes.value.data));
      }

      if (weakAreasRes.status === 'fulfilled') {
        dispatch(setWeakAreas(weakAreasRes.value.data));
      }

      if (gamificationRes.status === 'fulfilled') {
        dispatch(setGamification(gamificationRes.value.data));
      }

      dispatch(setLastSynced(new Date().toISOString()));
      console.log('[DashboardSync] Dashboard synced successfully');
    } catch (error: any) {
      console.error('[DashboardSync] Sync failed:', error);
      dispatch(setError(error.message || 'Failed to sync dashboard'));
    } finally {
      setLocalSyncing(false);
      dispatch(setSyncing(false));
    }
  }, [dispatch]);

  return {
    syncDashboard,
    isSyncing: localSyncing || dashboardState.isSyncing,
    lastSynced: dashboardState.lastSynced,
    error: dashboardState.error,
  };
};
