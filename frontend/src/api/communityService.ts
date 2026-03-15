import axios from '@/lib/axios';
import type {
  ServiceLog,
  ServiceLogForm,
  ServicePortfolio,
  ServiceHourCertificate,
  ServiceOpportunity,
  ServiceOpportunityApplication,
  ServiceReflectionEntry,
  GraduationRequirementProgress,
  ServiceVerificationRequest,
  ServiceVerificationResponse,
  OrganizationContact,
  ServiceStats,
} from '@/types/communityService';

export const communityServiceApi = {
  // Service Logs
  getMyServiceLogs: async (): Promise<ServiceLog[]> => {
    const response = await axios.get<ServiceLog[]>('/api/v1/community-service/logs');
    return response.data;
  },

  getServiceLog: async (logId: number): Promise<ServiceLog> => {
    const response = await axios.get<ServiceLog>(`/api/v1/community-service/logs/${logId}`);
    return response.data;
  },

  createServiceLog: async (log: ServiceLogForm): Promise<ServiceLog> => {
    const response = await axios.post<ServiceLog>('/api/v1/community-service/logs', log);
    return response.data;
  },

  updateServiceLog: async (logId: number, log: Partial<ServiceLogForm>): Promise<ServiceLog> => {
    const response = await axios.put<ServiceLog>(`/api/v1/community-service/logs/${logId}`, log);
    return response.data;
  },

  deleteServiceLog: async (logId: number): Promise<void> => {
    await axios.delete(`/api/v1/community-service/logs/${logId}`);
  },

  // Portfolio
  getMyPortfolio: async (): Promise<ServicePortfolio> => {
    const response = await axios.get<ServicePortfolio>('/api/v1/community-service/portfolio');
    return response.data;
  },

  getStudentPortfolio: async (studentId: number): Promise<ServicePortfolio> => {
    const response = await axios.get<ServicePortfolio>(
      `/api/v1/community-service/portfolio/${studentId}`
    );
    return response.data;
  },

  // Certificate
  getCertificateData: async (academicYear?: string): Promise<ServiceHourCertificate> => {
    const params = academicYear ? `?academic_year=${academicYear}` : '';
    const response = await axios.get<ServiceHourCertificate>(
      `/api/v1/community-service/certificate/data${params}`
    );
    return response.data;
  },

  downloadCertificate: async (academicYear?: string): Promise<Blob> => {
    const params = academicYear ? `?academic_year=${academicYear}` : '';
    const response = await axios.get(`/api/v1/community-service/certificate${params}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Service Opportunities
  getServiceOpportunities: async (filters?: {
    category?: string;
    interest_area?: string;
    min_age?: number;
    max_age?: number;
    remote?: boolean;
  }): Promise<ServiceOpportunity[]> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.interest_area) params.append('interest_area', filters.interest_area);
    if (filters?.min_age) params.append('min_age', filters.min_age.toString());
    if (filters?.max_age) params.append('max_age', filters.max_age.toString());
    if (filters?.remote !== undefined) params.append('remote', filters.remote.toString());

    const response = await axios.get<ServiceOpportunity[]>(
      `/api/v1/community-service/opportunities?${params.toString()}`
    );
    return response.data;
  },

  getServiceOpportunity: async (opportunityId: number): Promise<ServiceOpportunity> => {
    const response = await axios.get<ServiceOpportunity>(
      `/api/v1/community-service/opportunities/${opportunityId}`
    );
    return response.data;
  },

  applyToOpportunity: async (
    opportunityId: number,
    coverLetter?: string
  ): Promise<ServiceOpportunityApplication> => {
    const response = await axios.post<ServiceOpportunityApplication>(
      `/api/v1/community-service/opportunities/${opportunityId}/apply`,
      { cover_letter: coverLetter }
    );
    return response.data;
  },

  getMyApplications: async (): Promise<ServiceOpportunityApplication[]> => {
    const response = await axios.get<ServiceOpportunityApplication[]>(
      '/api/v1/community-service/applications'
    );
    return response.data;
  },

  withdrawApplication: async (applicationId: number): Promise<void> => {
    await axios.delete(`/api/v1/community-service/applications/${applicationId}`);
  },

  // Reflection Journal
  getMyReflections: async (): Promise<ServiceReflectionEntry[]> => {
    const response = await axios.get<ServiceReflectionEntry[]>(
      '/api/v1/community-service/reflections'
    );
    return response.data;
  },

  createReflection: async (
    reflection: Omit<ServiceReflectionEntry, 'id' | 'student_id' | 'created_at' | 'updated_at'>
  ): Promise<ServiceReflectionEntry> => {
    const response = await axios.post<ServiceReflectionEntry>(
      '/api/v1/community-service/reflections',
      reflection
    );
    return response.data;
  },

  updateReflection: async (
    reflectionId: number,
    reflection: Partial<
      Omit<ServiceReflectionEntry, 'id' | 'student_id' | 'created_at' | 'updated_at'>
    >
  ): Promise<ServiceReflectionEntry> => {
    const response = await axios.put<ServiceReflectionEntry>(
      `/api/v1/community-service/reflections/${reflectionId}`,
      reflection
    );
    return response.data;
  },

  deleteReflection: async (reflectionId: number): Promise<void> => {
    await axios.delete(`/api/v1/community-service/reflections/${reflectionId}`);
  },

  // Admin - Graduation Requirements
  getGraduationProgress: async (filters?: {
    grade?: string;
    at_risk?: boolean;
  }): Promise<GraduationRequirementProgress[]> => {
    const params = new URLSearchParams();
    if (filters?.grade) params.append('grade', filters.grade);
    if (filters?.at_risk !== undefined) params.append('at_risk', filters.at_risk.toString());

    const response = await axios.get<GraduationRequirementProgress[]>(
      `/api/v1/community-service/admin/graduation-progress?${params.toString()}`
    );
    return response.data;
  },

  updateRequiredHours: async (
    studentId: number,
    requiredHours: number,
    notes?: string
  ): Promise<void> => {
    await axios.put(`/api/v1/community-service/admin/requirements/${studentId}`, {
      required_hours: requiredHours,
      notes,
    });
  },

  // Verification Portal
  getVerificationRequest: async (verificationCode: string): Promise<ServiceVerificationRequest> => {
    const response = await axios.get<ServiceVerificationRequest>(
      `/api/v1/community-service/verify/${verificationCode}`
    );
    return response.data;
  },

  submitVerification: async (
    verificationCode: string,
    verification: ServiceVerificationResponse
  ): Promise<void> => {
    await axios.post(`/api/v1/community-service/verify/${verificationCode}`, verification);
  },

  resendVerificationEmail: async (logId: number): Promise<void> => {
    await axios.post(`/api/v1/community-service/logs/${logId}/resend-verification`);
  },

  // Organization Contacts
  getMyOrganizations: async (): Promise<OrganizationContact[]> => {
    const response = await axios.get<OrganizationContact[]>(
      '/api/v1/community-service/organizations'
    );
    return response.data;
  },

  createOrganization: async (
    organization: Omit<
      OrganizationContact,
      'id' | 'activities_count' | 'total_hours' | 'last_activity_date' | 'created_at' | 'updated_at'
    >
  ): Promise<OrganizationContact> => {
    const response = await axios.post<OrganizationContact>(
      '/api/v1/community-service/organizations',
      organization
    );
    return response.data;
  },

  updateOrganization: async (
    organizationId: number,
    organization: Partial<OrganizationContact>
  ): Promise<OrganizationContact> => {
    const response = await axios.put<OrganizationContact>(
      `/api/v1/community-service/organizations/${organizationId}`,
      organization
    );
    return response.data;
  },

  deleteOrganization: async (organizationId: number): Promise<void> => {
    await axios.delete(`/api/v1/community-service/organizations/${organizationId}`);
  },

  // Admin Analytics
  getServiceStats: async (startDate?: string, endDate?: string): Promise<ServiceStats> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await axios.get<ServiceStats>(
      `/api/v1/community-service/admin/stats?${params.toString()}`
    );
    return response.data;
  },
};

export default communityServiceApi;
