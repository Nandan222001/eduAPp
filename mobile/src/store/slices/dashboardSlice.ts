import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Profile, Assignment, Grade, AIPrediction, WeakArea, AttendanceSummary, GamificationStats } from '@types';

export interface DashboardState {
  profile: Profile | null;
  attendanceSummary: AttendanceSummary | null;
  assignments: Assignment[];
  grades: Grade[];
  aiPrediction: AIPrediction | null;
  weakAreas: WeakArea[];
  gamification: GamificationStats | null;
  isLoading: boolean;
  error: string | null;
  lastSynced: string | null;
  isSyncing: boolean;
}

const initialState: DashboardState = {
  profile: null,
  attendanceSummary: null,
  assignments: [],
  grades: [],
  aiPrediction: null,
  weakAreas: [],
  gamification: null,
  isLoading: false,
  error: null,
  lastSynced: null,
  isSyncing: false,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<Profile>) => {
      state.profile = action.payload;
    },
    setAttendanceSummary: (state, action: PayloadAction<AttendanceSummary>) => {
      state.attendanceSummary = action.payload;
    },
    setAssignments: (state, action: PayloadAction<Assignment[]>) => {
      state.assignments = action.payload;
    },
    addAssignment: (state, action: PayloadAction<Assignment>) => {
      const index = state.assignments.findIndex(a => a.id === action.payload.id);
      if (index >= 0) {
        state.assignments[index] = action.payload;
      } else {
        state.assignments.unshift(action.payload);
      }
    },
    updateAssignment: (state, action: PayloadAction<Assignment>) => {
      const index = state.assignments.findIndex(a => a.id === action.payload.id);
      if (index >= 0) {
        state.assignments[index] = action.payload;
      }
    },
    setGrades: (state, action: PayloadAction<Grade[]>) => {
      state.grades = action.payload;
    },
    addGrade: (state, action: PayloadAction<Grade>) => {
      const index = state.grades.findIndex(g => g.id === action.payload.id);
      if (index >= 0) {
        state.grades[index] = action.payload;
      } else {
        state.grades.unshift(action.payload);
      }
    },
    setAIPrediction: (state, action: PayloadAction<AIPrediction>) => {
      state.aiPrediction = action.payload;
    },
    setWeakAreas: (state, action: PayloadAction<WeakArea[]>) => {
      state.weakAreas = action.payload;
    },
    setGamification: (state, action: PayloadAction<GamificationStats>) => {
      state.gamification = action.payload;
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
    clearDashboard: state => {
      return initialState;
    },
  },
});

export const {
  setProfile,
  setAttendanceSummary,
  setAssignments,
  addAssignment,
  updateAssignment,
  setGrades,
  addGrade,
  setAIPrediction,
  setWeakAreas,
  setGamification,
  setLoading,
  setError,
  clearError,
  setLastSynced,
  setSyncing,
  clearDashboard,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
