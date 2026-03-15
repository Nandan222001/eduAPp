import axios from '@/lib/axios';
import type {
  StudentVenture,
  PitchCompetition,
  PitchSubmission,
  EntrepreneurshipMentor,
  MentorshipRelationship,
  VentureFundingRequest,
  VentureBuilderTemplate,
  BusinessPlanData,
  PitchDeckSlide,
  LogoDesign,
} from '@/types/entrepreneurship';

export const entrepreneurshipApi = {
  // Ventures
  getVentures: async (
    institutionId: number,
    filters?: {
      status?: string;
      featured?: boolean;
    }
  ): Promise<StudentVenture[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.featured !== undefined) params.append('featured', filters.featured.toString());

    const response = await axios.get<StudentVenture[]>(
      `/api/v1/institutions/${institutionId}/ventures?${params.toString()}`
    );
    return response.data;
  },

  getVenture: async (institutionId: number, ventureId: number): Promise<StudentVenture> => {
    const response = await axios.get<StudentVenture>(
      `/api/v1/institutions/${institutionId}/ventures/${ventureId}`
    );
    return response.data;
  },

  createVenture: async (
    institutionId: number,
    venture: Partial<StudentVenture>
  ): Promise<StudentVenture> => {
    const response = await axios.post<StudentVenture>(
      `/api/v1/institutions/${institutionId}/ventures`,
      venture
    );
    return response.data;
  },

  updateVenture: async (
    institutionId: number,
    ventureId: number,
    venture: Partial<StudentVenture>
  ): Promise<StudentVenture> => {
    const response = await axios.put<StudentVenture>(
      `/api/v1/institutions/${institutionId}/ventures/${ventureId}`,
      venture
    );
    return response.data;
  },

  deleteVenture: async (institutionId: number, ventureId: number): Promise<void> => {
    await axios.delete(`/api/v1/institutions/${institutionId}/ventures/${ventureId}`);
  },

  followVenture: async (institutionId: number, ventureId: number): Promise<void> => {
    await axios.post(`/api/v1/institutions/${institutionId}/ventures/${ventureId}/follow`);
  },

  unfollowVenture: async (institutionId: number, ventureId: number): Promise<void> => {
    await axios.post(`/api/v1/institutions/${institutionId}/ventures/${ventureId}/unfollow`);
  },

  // Pitch Competitions
  getCompetitions: async (
    institutionId: number,
    filters?: {
      status?: string;
    }
  ): Promise<PitchCompetition[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);

    const response = await axios.get<PitchCompetition[]>(
      `/api/v1/institutions/${institutionId}/pitch-competitions?${params.toString()}`
    );
    return response.data;
  },

  getCompetition: async (
    institutionId: number,
    competitionId: number
  ): Promise<PitchCompetition> => {
    const response = await axios.get<PitchCompetition>(
      `/api/v1/institutions/${institutionId}/pitch-competitions/${competitionId}`
    );
    return response.data;
  },

  getCompetitionSubmissions: async (
    institutionId: number,
    competitionId: number
  ): Promise<PitchSubmission[]> => {
    const response = await axios.get<PitchSubmission[]>(
      `/api/v1/institutions/${institutionId}/pitch-competitions/${competitionId}/submissions`
    );
    return response.data;
  },

  submitPitch: async (
    institutionId: number,
    submission: Partial<PitchSubmission>
  ): Promise<PitchSubmission> => {
    const response = await axios.post<PitchSubmission>(
      `/api/v1/institutions/${institutionId}/pitch-submissions`,
      submission
    );
    return response.data;
  },

  scoreSubmission: async (
    institutionId: number,
    submissionId: number,
    scores: { criteria_id: string; score: number }[],
    comments?: string
  ): Promise<PitchSubmission> => {
    const response = await axios.post<PitchSubmission>(
      `/api/v1/institutions/${institutionId}/pitch-submissions/${submissionId}/score`,
      { scores, comments }
    );
    return response.data;
  },

  voteForSubmission: async (institutionId: number, submissionId: number): Promise<void> => {
    await axios.post(
      `/api/v1/institutions/${institutionId}/pitch-submissions/${submissionId}/vote`
    );
  },

  // Mentors
  getMentors: async (
    institutionId: number,
    filters?: {
      available?: boolean;
      expertise?: string;
    }
  ): Promise<EntrepreneurshipMentor[]> => {
    const params = new URLSearchParams();
    if (filters?.available !== undefined) params.append('available', filters.available.toString());
    if (filters?.expertise) params.append('expertise', filters.expertise);

    const response = await axios.get<EntrepreneurshipMentor[]>(
      `/api/v1/institutions/${institutionId}/entrepreneurship-mentors?${params.toString()}`
    );
    return response.data;
  },

  getMentor: async (institutionId: number, mentorId: number): Promise<EntrepreneurshipMentor> => {
    const response = await axios.get<EntrepreneurshipMentor>(
      `/api/v1/institutions/${institutionId}/entrepreneurship-mentors/${mentorId}`
    );
    return response.data;
  },

  requestMentorship: async (
    institutionId: number,
    data: {
      mentor_id: number;
      venture_id: number;
      goals: string[];
      message?: string;
    }
  ): Promise<MentorshipRelationship> => {
    const response = await axios.post<MentorshipRelationship>(
      `/api/v1/institutions/${institutionId}/mentorship-relationships`,
      data
    );
    return response.data;
  },

  getMentorships: async (
    institutionId: number,
    ventureId?: number
  ): Promise<MentorshipRelationship[]> => {
    const params = ventureId ? `?venture_id=${ventureId}` : '';
    const response = await axios.get<MentorshipRelationship[]>(
      `/api/v1/institutions/${institutionId}/mentorship-relationships${params}`
    );
    return response.data;
  },

  updateMentorship: async (
    institutionId: number,
    mentorshipId: number,
    data: Partial<MentorshipRelationship>
  ): Promise<MentorshipRelationship> => {
    const response = await axios.put<MentorshipRelationship>(
      `/api/v1/institutions/${institutionId}/mentorship-relationships/${mentorshipId}`,
      data
    );
    return response.data;
  },

  // Funding
  getFundingRequests: async (
    institutionId: number,
    ventureId?: number
  ): Promise<VentureFundingRequest[]> => {
    const params = ventureId ? `?venture_id=${ventureId}` : '';
    const response = await axios.get<VentureFundingRequest[]>(
      `/api/v1/institutions/${institutionId}/funding-requests${params}`
    );
    return response.data;
  },

  createFundingRequest: async (
    institutionId: number,
    request: Partial<VentureFundingRequest>
  ): Promise<VentureFundingRequest> => {
    const response = await axios.post<VentureFundingRequest>(
      `/api/v1/institutions/${institutionId}/funding-requests`,
      request
    );
    return response.data;
  },

  updateFundingRequest: async (
    institutionId: number,
    requestId: number,
    data: Partial<VentureFundingRequest>
  ): Promise<VentureFundingRequest> => {
    const response = await axios.put<VentureFundingRequest>(
      `/api/v1/institutions/${institutionId}/funding-requests/${requestId}`,
      data
    );
    return response.data;
  },

  // Venture Builder Templates
  getBuilderTemplates: async (): Promise<VentureBuilderTemplate[]> => {
    const response = await axios.get<VentureBuilderTemplate[]>('/api/v1/venture-builder/templates');
    return response.data;
  },

  saveBusinessPlan: async (
    institutionId: number,
    ventureId: number,
    data: BusinessPlanData
  ): Promise<void> => {
    await axios.post(
      `/api/v1/institutions/${institutionId}/ventures/${ventureId}/business-plan`,
      data
    );
  },

  savePitchDeck: async (
    institutionId: number,
    ventureId: number,
    slides: PitchDeckSlide[]
  ): Promise<void> => {
    await axios.post(`/api/v1/institutions/${institutionId}/ventures/${ventureId}/pitch-deck`, {
      slides,
    });
  },

  generateLogo: async (design: LogoDesign): Promise<{ logo_url: string }> => {
    const response = await axios.post<{ logo_url: string }>(
      '/api/v1/venture-builder/generate-logo',
      design
    );
    return response.data;
  },

  calculateFinancialProjections: async (data: {
    initial_investment: number;
    monthly_revenue: number;
    monthly_expenses: number;
    growth_rate: number;
    period_months: number;
  }): Promise<{ projections: Record<string, unknown>[] }> => {
    const response = await axios.post<{ projections: Record<string, unknown>[] }>(
      '/api/v1/venture-builder/financial-projections',
      data
    );
    return response.data;
  },

  // Analytics
  getVentureAnalytics: async (
    institutionId: number,
    ventureId: number
  ): Promise<{
    metrics: Record<string, unknown>;
    growth_data: Record<string, unknown>[];
    customer_data: Record<string, unknown>[];
  }> => {
    const response = await axios.get(
      `/api/v1/institutions/${institutionId}/ventures/${ventureId}/analytics`
    );
    return response.data;
  },
};

export default entrepreneurshipApi;
