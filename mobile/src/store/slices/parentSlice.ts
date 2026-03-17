import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { parentApi } from '../../api/parentApi';
import { ParentState, Child, ChildStats, TodayAttendance, Grade, Assignment, FeePayment, TeacherMessage, Announcement, AttendanceCalendar, SubjectAttendance, ExamResult, SubjectPerformance } from '../../types/parent';

const initialState: ParentState = {
  children: [],
  selectedChildId: null,
  childStats: {},
  todayAttendance: {},
  recentGrades: {},
  pendingAssignments: {},
  feePayments: {},
  messages: [],
  announcements: [],
  attendanceCalendar: {},
  subjectAttendance: {},
  examResults: {},
  subjectPerformance: {},
  isLoading: false,
  error: null,
};

export const fetchChildren = createAsyncThunk('parent/fetchChildren', async () => {
  return await parentApi.getChildren();
});

export const fetchChildStats = createAsyncThunk(
  'parent/fetchChildStats',
  async (childId: number) => {
    const stats = await parentApi.getChildStats(childId);
    return { childId, stats };
  }
);

export const fetchTodayAttendance = createAsyncThunk(
  'parent/fetchTodayAttendance',
  async (childId: number) => {
    const attendance = await parentApi.getTodayAttendance(childId);
    return { childId, attendance };
  }
);

export const fetchRecentGrades = createAsyncThunk(
  'parent/fetchRecentGrades',
  async (childId: number) => {
    const grades = await parentApi.getRecentGrades(childId);
    return { childId, grades };
  }
);

export const fetchPendingAssignments = createAsyncThunk(
  'parent/fetchPendingAssignments',
  async (childId: number) => {
    const assignments = await parentApi.getPendingAssignments(childId);
    return { childId, assignments };
  }
);

export const fetchFeePayments = createAsyncThunk(
  'parent/fetchFeePayments',
  async (childId: number) => {
    const payments = await parentApi.getFeePayments(childId);
    return { childId, payments };
  }
);

export const fetchMessages = createAsyncThunk('parent/fetchMessages', async () => {
  return await parentApi.getMessages();
});

export const fetchAnnouncements = createAsyncThunk('parent/fetchAnnouncements', async () => {
  return await parentApi.getAnnouncements();
});

export const markMessageAsRead = createAsyncThunk(
  'parent/markMessageAsRead',
  async (messageId: number) => {
    await parentApi.markMessageAsRead(messageId);
    return messageId;
  }
);

export const fetchAttendanceCalendar = createAsyncThunk(
  'parent/fetchAttendanceCalendar',
  async ({ childId, year, month }: { childId: number; year: number; month: number }) => {
    const calendar = await parentApi.getAttendanceCalendar(childId, year, month);
    return { childId, calendar };
  }
);

export const fetchSubjectAttendance = createAsyncThunk(
  'parent/fetchSubjectAttendance',
  async (childId: number) => {
    const attendance = await parentApi.getSubjectAttendance(childId);
    return { childId, attendance };
  }
);

export const fetchExamResults = createAsyncThunk(
  'parent/fetchExamResults',
  async ({ childId, term }: { childId: number; term?: string }) => {
    const results = await parentApi.getExamResults(childId, term);
    return { childId, results };
  }
);

export const fetchSubjectPerformance = createAsyncThunk(
  'parent/fetchSubjectPerformance',
  async (childId: number) => {
    const performance = await parentApi.getSubjectPerformance(childId);
    return { childId, performance };
  }
);

const parentSlice = createSlice({
  name: 'parent',
  initialState,
  reducers: {
    setSelectedChild: (state, action: PayloadAction<number>) => {
      state.selectedChildId = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChildren.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChildren.fulfilled, (state, action) => {
        state.isLoading = false;
        state.children = action.payload;
        if (action.payload.length > 0 && !state.selectedChildId) {
          state.selectedChildId = action.payload[0].id;
        }
      })
      .addCase(fetchChildren.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch children';
      })
      .addCase(fetchChildStats.fulfilled, (state, action) => {
        state.childStats[action.payload.childId] = action.payload.stats;
      })
      .addCase(fetchTodayAttendance.fulfilled, (state, action) => {
        state.todayAttendance[action.payload.childId] = action.payload.attendance;
      })
      .addCase(fetchRecentGrades.fulfilled, (state, action) => {
        state.recentGrades[action.payload.childId] = action.payload.grades;
      })
      .addCase(fetchPendingAssignments.fulfilled, (state, action) => {
        state.pendingAssignments[action.payload.childId] = action.payload.assignments;
      })
      .addCase(fetchFeePayments.fulfilled, (state, action) => {
        state.feePayments[action.payload.childId] = action.payload.payments;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messages = action.payload;
      })
      .addCase(fetchAnnouncements.fulfilled, (state, action) => {
        state.announcements = action.payload;
      })
      .addCase(markMessageAsRead.fulfilled, (state, action) => {
        const message = state.messages.find((m) => m.id === action.payload);
        if (message) {
          message.read = true;
        }
      })
      .addCase(fetchAttendanceCalendar.fulfilled, (state, action) => {
        state.attendanceCalendar[action.payload.childId] = action.payload.calendar;
      })
      .addCase(fetchSubjectAttendance.fulfilled, (state, action) => {
        state.subjectAttendance[action.payload.childId] = action.payload.attendance;
      })
      .addCase(fetchExamResults.fulfilled, (state, action) => {
        state.examResults[action.payload.childId] = action.payload.results;
      })
      .addCase(fetchSubjectPerformance.fulfilled, (state, action) => {
        state.subjectPerformance[action.payload.childId] = action.payload.performance;
      });
  },
});

export const { setSelectedChild, clearError } = parentSlice.actions;
export default parentSlice.reducer;
