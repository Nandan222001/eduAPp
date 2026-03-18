import { useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import {
  setSummary,
  setHistory,
  setTodayRecords,
  setLastSynced,
  setSyncing,
  setError,
} from '@store/slices/attendanceSlice';
import { attendanceApi } from '@api/attendance';
import { offlineQueueManager } from '@utils/offlineQueue';

export const useAttendanceSync = () => {
  const dispatch = useAppDispatch();
  const attendanceState = useAppSelector(state => state.attendance);
  const [localSyncing, setLocalSyncing] = useState(false);

  const syncAttendance = useCallback(async () => {
    const isOnline = offlineQueueManager.isConnected();

    if (!isOnline) {
      console.log('[AttendanceSync] Offline, using cached data');
      return;
    }

    setLocalSyncing(true);
    dispatch(setSyncing(true));

    try {
      const [summaryRes, historyRes, todayRes] = await Promise.allSettled([
        attendanceApi.getAttendanceSummary(),
        attendanceApi.getAttendanceHistory(),
        attendanceApi.getTodayAttendance(),
      ]);

      if (summaryRes.status === 'fulfilled') {
        dispatch(setSummary(summaryRes.value));
      }

      if (historyRes.status === 'fulfilled') {
        dispatch(setHistory(historyRes.value));
      }

      if (todayRes.status === 'fulfilled') {
        dispatch(setTodayRecords(todayRes.value));
      }

      dispatch(setLastSynced(new Date().toISOString()));
      console.log('[AttendanceSync] Attendance synced successfully');
    } catch (error: any) {
      console.error('[AttendanceSync] Sync failed:', error);
      dispatch(setError(error.message || 'Failed to sync attendance'));
    } finally {
      setLocalSyncing(false);
      dispatch(setSyncing(false));
    }
  }, [dispatch]);

  return {
    syncAttendance,
    isSyncing: localSyncing || attendanceState.isSyncing,
    lastSynced: attendanceState.lastSynced,
    error: attendanceState.error,
    summary: attendanceState.summary,
    history: attendanceState.history,
    todayRecords: attendanceState.todayRecords,
  };
};
