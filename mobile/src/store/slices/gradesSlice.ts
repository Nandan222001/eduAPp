import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GradeDetail, SubjectGrades, PerformanceInsights } from '@api/grades';

export interface GradesState {
  grades: GradeDetail[];
  subjectGrades: SubjectGrades[];
  performanceInsights: PerformanceInsights | null;
  isLoading: boolean;
  error: string | null;
  lastSynced: string | null;
  isSyncing: boolean;
}

const initialState: GradesState = {
  grades: [],
  subjectGrades: [],
  performanceInsights: null,
  isLoading: false,
  error: null,
  lastSynced: null,
  isSyncing: false,
};

const gradesSlice = createSlice({
  name: 'grades',
  initialState,
  reducers: {
    setGrades: (state, action: PayloadAction<GradeDetail[]>) => {
      state.grades = action.payload;
    },
    addGrade: (state, action: PayloadAction<GradeDetail>) => {
      const index = state.grades.findIndex(g => g.id === action.payload.id);
      if (index >= 0) {
        state.grades[index] = action.payload;
      } else {
        state.grades.unshift(action.payload);
      }
    },
    setSubjectGrades: (state, action: PayloadAction<SubjectGrades[]>) => {
      state.subjectGrades = action.payload;
    },
    setPerformanceInsights: (state, action: PayloadAction<PerformanceInsights>) => {
      state.performanceInsights = action.payload;
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
    clearGrades: state => {
      return initialState;
    },
  },
});

export const {
  setGrades,
  addGrade,
  setSubjectGrades,
  setPerformanceInsights,
  setLoading,
  setError,
  clearError,
  setLastSynced,
  setSyncing,
  clearGrades,
} = gradesSlice.actions;

export default gradesSlice.reducer;
