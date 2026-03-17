import { apiClient } from './client';

export interface TimetableEntry {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  subject: string;
  subjectCode?: string;
  teacherName: string;
  room: string;
  type?: 'lecture' | 'lab' | 'tutorial' | 'practical';
  section?: string;
}

export interface DailySchedule {
  date: string;
  dayOfWeek: string;
  entries: TimetableEntry[];
}

export interface WeeklySchedule {
  weekStart: string;
  weekEnd: string;
  schedule: DailySchedule[];
}

export interface TimetableParams {
  date?: string;
  weekStart?: string;
  weekEnd?: string;
}

export const scheduleApi = {
  getTimetable: async (params?: TimetableParams) => {
    const queryParams = new URLSearchParams();
    if (params?.date) queryParams.append('date', params.date);
    if (params?.weekStart) queryParams.append('week_start', params.weekStart);
    if (params?.weekEnd) queryParams.append('week_end', params.weekEnd);

    const url = `/api/v1/timetable${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<TimetableEntry[]>(url);
  },

  getWeeklySchedule: async (weekStart: string, weekEnd: string) => {
    return apiClient.get<WeeklySchedule>(
      `/api/v1/timetable?week_start=${weekStart}&week_end=${weekEnd}`
    );
  },

  getDailySchedule: async (date: string) => {
    return apiClient.get<DailySchedule>(`/api/v1/timetable?date=${date}`);
  },
};
