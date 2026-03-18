import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AssignmentDetail } from '@api/assignments';

export interface AssignmentsState {
  assignments: AssignmentDetail[];
  currentAssignment: AssignmentDetail | null;
  isLoading: boolean;
  error: string | null;
  lastSynced: string | null;
  isSyncing: boolean;
}

const initialState: AssignmentsState = {
  assignments: [],
  currentAssignment: null,
  isLoading: false,
  error: null,
  lastSynced: null,
  isSyncing: false,
};

const assignmentsSlice = createSlice({
  name: 'assignments',
  initialState,
  reducers: {
    setAssignments: (state, action: PayloadAction<AssignmentDetail[]>) => {
      state.assignments = action.payload;
    },
    addAssignment: (state, action: PayloadAction<AssignmentDetail>) => {
      const index = state.assignments.findIndex(a => a.id === action.payload.id);
      if (index >= 0) {
        state.assignments[index] = action.payload;
      } else {
        state.assignments.unshift(action.payload);
      }
    },
    updateAssignment: (state, action: PayloadAction<AssignmentDetail>) => {
      const index = state.assignments.findIndex(a => a.id === action.payload.id);
      if (index >= 0) {
        state.assignments[index] = action.payload;
      }
    },
    setCurrentAssignment: (state, action: PayloadAction<AssignmentDetail | null>) => {
      state.currentAssignment = action.payload;
    },
    optimisticUpdateAssignment: (state, action: PayloadAction<{ id: number; updates: Partial<AssignmentDetail> }>) => {
      const index = state.assignments.findIndex(a => a.id === action.payload.id);
      if (index >= 0) {
        state.assignments[index] = { ...state.assignments[index], ...action.payload.updates };
      }
      if (state.currentAssignment?.id === action.payload.id) {
        state.currentAssignment = { ...state.currentAssignment, ...action.payload.updates };
      }
    },
    rollbackAssignment: (state, action: PayloadAction<AssignmentDetail>) => {
      const index = state.assignments.findIndex(a => a.id === action.payload.id);
      if (index >= 0) {
        state.assignments[index] = action.payload;
      }
      if (state.currentAssignment?.id === action.payload.id) {
        state.currentAssignment = action.payload;
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
    clearAssignments: state => {
      return initialState;
    },
  },
});

export const {
  setAssignments,
  addAssignment,
  updateAssignment,
  setCurrentAssignment,
  optimisticUpdateAssignment,
  rollbackAssignment,
  setLoading,
  setError,
  clearError,
  setLastSynced,
  setSyncing,
  clearAssignments,
} = assignmentsSlice.actions;

export default assignmentsSlice.reducer;
