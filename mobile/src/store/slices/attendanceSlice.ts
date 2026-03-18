import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AttendanceSummary, AttendanceHistory, AttendanceRecord } from '@types';

export interface AttendanceState {
  summary: AttendanceSummary | null;
  history: AttendanceHistory[];
  todayRecords: AttendanceRecord[];
  isLoading: boolean;
  error: string | null;
  lastSynced: string | null;
  isSyncing: boolean;
}

const initialState: AttendanceState = {
  summary: null,
  history: [],
  todayRecords: [],
  isLoading: false,
  error: null,
  lastSynced: null,
  isSyncing: false,
};

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    setSummary: (state, action: PayloadAction<AttendanceSummary>) => {
      state.summary = action.payload;
    },
    setHistory: (state, action: PayloadAction<AttendanceHistory[]>) => {
      state.history = action.payload;
    },
    setTodayRecords: (state, action: PayloadAction<AttendanceRecord[]>) => {
      state.todayRecords = action.payload;
    },
    addHistoryRecord: (state, action: PayloadAction<AttendanceHistory>) => {
      const index = state.history.findIndex(h => h.date === action.payload.date);
      if (index >= 0) {
        state.history[index] = action.payload;
      } else {
        state.history.unshift(action.payload);
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
    setLastSynced: (state, action: PayloadAction<string>) => {
      state.lastSynced = action.payload;
    },
    setSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
    },
    clearAttendance: state => {
      return initialState;
    },
  },
});

export const {
  setSummary,
  setHistory,
  setTodayRecords,
  addHistoryRecord,
  setLoading,
  setError,
  clearError,
  setLastSynced,
  setSyncing,
  clearAttendance,
} = attendanceSlice.actions;

export default attendanceSlice.reducer;
