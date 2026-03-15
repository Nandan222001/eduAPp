import axios from '@/lib/axios';
import type {
  ConferenceBooking,
  ConferenceDashboardData,
  ConferenceRequest,
  ConferenceAvailability,
  TeacherConferenceData,
  Teacher,
  ConferenceSlot,
} from '@/types/conference';

export const conferencesApi = {
  getChildTeachers: async (childId: number): Promise<Teacher[]> => {
    const response = await axios.get<Teacher[]>(`/api/v1/conferences/children/${childId}/teachers`);
    return response.data;
  },

  getTeacherAvailability: async (
    teacherId: number,
    startDate: string,
    endDate: string
  ): Promise<ConferenceAvailability[]> => {
    const response = await axios.get<ConferenceAvailability[]>(
      `/api/v1/conferences/teachers/${teacherId}/availability`,
      {
        params: { start_date: startDate, end_date: endDate },
      }
    );
    return response.data;
  },

  bookConference: async (data: ConferenceRequest): Promise<ConferenceBooking> => {
    const response = await axios.post<ConferenceBooking>('/api/v1/conferences/bookings', data);
    return response.data;
  },

  cancelBooking: async (bookingId: number): Promise<void> => {
    await axios.delete(`/api/v1/conferences/bookings/${bookingId}`);
  },

  getDashboard: async (): Promise<ConferenceDashboardData> => {
    const response = await axios.get<ConferenceDashboardData>('/api/v1/conferences/dashboard');
    return response.data;
  },

  submitFeedback: async (
    bookingId: number,
    feedback: string,
    rating: number
  ): Promise<ConferenceBooking> => {
    const response = await axios.post<ConferenceBooking>(
      `/api/v1/conferences/bookings/${bookingId}/feedback`,
      { feedback, rating }
    );
    return response.data;
  },

  downloadICS: async (bookingId: number): Promise<Blob> => {
    const response = await axios.get(`/api/v1/conferences/bookings/${bookingId}/ics`, {
      responseType: 'blob',
    });
    return response.data;
  },

  getTeacherDashboard: async (): Promise<TeacherConferenceData> => {
    const response = await axios.get<TeacherConferenceData>(
      '/api/v1/conferences/teacher/dashboard'
    );
    return response.data;
  },

  updateAvailability: async (
    date: string,
    slots: Omit<ConferenceSlot, 'id'>[]
  ): Promise<ConferenceAvailability> => {
    const response = await axios.post<ConferenceAvailability>(
      '/api/v1/conferences/teacher/availability',
      { date, slots }
    );
    return response.data;
  },

  acceptBookingRequest: async (bookingId: number): Promise<ConferenceBooking> => {
    const response = await axios.post<ConferenceBooking>(
      `/api/v1/conferences/bookings/${bookingId}/accept`
    );
    return response.data;
  },

  rescheduleBooking: async (bookingId: number, newSlotId: string): Promise<ConferenceBooking> => {
    const response = await axios.post<ConferenceBooking>(
      `/api/v1/conferences/bookings/${bookingId}/reschedule`,
      { slot_id: newSlotId }
    );
    return response.data;
  },

  saveConferenceNotes: async (bookingId: number, notes: string): Promise<ConferenceBooking> => {
    const response = await axios.post<ConferenceBooking>(
      `/api/v1/conferences/bookings/${bookingId}/notes`,
      { notes }
    );
    return response.data;
  },

  startMeeting: async (bookingId: number): Promise<{ meeting_url: string }> => {
    const response = await axios.post<{ meeting_url: string }>(
      `/api/v1/conferences/bookings/${bookingId}/start-meeting`
    );
    return response.data;
  },
};
