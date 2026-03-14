import axios from '@/lib/axios';

export interface InstitutionMetricsSummary {
  total_institutions: number;
  active_subscriptions: number;
  mrr: number;
  arr: number;
  institution_growth_trend: number;
}

export interface SubscriptionStatusDistribution {
  active: number;
  trial: number;
  expired: number;
  cancelled: number;
}

export interface PlatformUsageStatistics {
  dau: number;
  mau: number;
  total_users: number;
  active_users: number;
  dau_mau_ratio: number;
}

export interface RevenueTrend {
  month: string;
  mrr: number;
  arr: number;
  total_revenue: number;
}

export interface RecentActivity {
  type: string;
  title: string;
  description: string;
  time: string;
  institution_id?: number;
}

export interface InstitutionPerformanceComparison {
  id: number;
  name: string;
  total_users: number;
  active_users: number;
  subscription_status: string;
  revenue: number;
  last_activity: string;
  engagement: number;
}

export interface QuickActionStats {
  trials_expiring_soon: number;
  grace_period_ending: number;
  pending_onboarding: number;
}

export interface SuperAdminDashboardResponse {
  metrics_summary: InstitutionMetricsSummary;
  subscription_distribution: SubscriptionStatusDistribution;
  platform_usage: PlatformUsageStatistics;
  revenue_trends: RevenueTrend[];
  recent_activities: RecentActivity[];
  institution_performance: InstitutionPerformanceComparison[];
  quick_actions: QuickActionStats;
}

export interface InstitutionDetails {
  institution: {
    id: number;
    name: string;
    slug: string;
    domain: string;
    description: string;
    is_active: boolean;
    max_users: number;
    created_at: string;
    updated_at: string;
  };
  subscription: {
    id: number;
    plan_name: string;
    status: string;
    billing_cycle: string;
    price: number;
    start_date: string;
    end_date: string;
    trial_end_date: string;
  } | null;
  stats: {
    total_users: number;
    active_users: number;
    student_count: number;
    teacher_count: number;
    total_revenue: number;
  };
  recent_usage: Array<{
    metric_name: string;
    metric_value: number;
    recorded_at: string;
  }>;
}

export interface RevenueBreakdown {
  revenue_breakdown: Array<{
    plan_name: string;
    billing_cycle: string;
    subscription_count: number;
    total_revenue: number;
  }>;
}

export interface UserGrowthStatistics {
  daily_registrations: Array<{
    date: string;
    count: number;
  }>;
  total_new_users: number;
}

export interface InstitutionListItem {
  id: number;
  name: string;
  slug: string;
  domain: string | null;
  is_active: boolean;
  max_users: number | null;
  created_at: string;
  subscription_status: string | null;
  subscription_plan: string | null;
  total_users: number;
  active_users: number;
  total_revenue: number;
}

export interface InstitutionListResponse {
  items: InstitutionListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AdminUserCreate {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  password: string;
}

export interface SubscriptionPlanCreate {
  plan_name: string;
  billing_cycle: string;
  price: number;
  max_users?: number;
  max_storage_gb?: number;
  features?: string;
  trial_days?: number;
}

export interface InstitutionCreate {
  name: string;
  slug: string;
  domain?: string;
  description?: string;
  max_users?: number;
  admin_user: AdminUserCreate;
  subscription?: SubscriptionPlanCreate;
}

export interface InstitutionUpdate {
  name?: string;
  slug?: string;
  domain?: string;
  description?: string;
  is_active?: boolean;
  max_users?: number;
}

export interface SubscriptionUpdate {
  plan_name?: string;
  billing_cycle?: string;
  price?: number;
  max_users?: number;
  max_storage_gb?: number;
  features?: string;
  auto_renew?: boolean;
}

export interface BillingHistoryItem {
  id: number;
  invoice_number?: string;
  payment_id?: number;
  amount: number;
  status: string;
  payment_method?: string;
  paid_at?: string;
  created_at: string;
}

export interface UsageMetric {
  metric_name: string;
  current_value: number;
  limit?: number;
  percentage_used?: number;
  period_start: string;
  period_end: string;
}

export interface InstitutionAnalytics {
  institution_id: number;
  institution_name: string;
  user_metrics: {
    total_users: number;
    active_users: number;
    new_users: number;
    students: number;
    teachers: number;
  };
  engagement_metrics: {
    daily_active_users: number;
    weekly_active_users: number;
    monthly_active_users: number;
    engagement_rate: number;
  };
  usage_trends: Array<{
    date: string;
    active_users: number;
  }>;
  revenue_metrics: {
    total_revenue: number;
    recent_revenue: number;
    currency: string;
  };
}

export interface InstitutionBranding {
  id: number;
  institution_id: number;
  logo_url?: string;
  logo_s3_key?: string;
  favicon_url?: string;
  favicon_s3_key?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  custom_domain?: string;
  subdomain?: string;
  ssl_enabled: boolean;
  domain_verified: boolean;
  email_logo_url?: string;
  email_logo_s3_key?: string;
  email_header_color?: string;
  email_footer_text?: string;
  email_from_name?: string;
  login_background_url?: string;
  login_background_s3_key?: string;
  login_banner_text?: string;
  login_welcome_message?: string;
  institution_name_override?: string;
  custom_css?: string;
  custom_meta_tags?: Record<string, any>;
  social_links?: Record<string, string>;
  show_powered_by: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BrandingCreate {
  institution_id: number;
  logo_url?: string;
  favicon_url?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  custom_domain?: string;
  subdomain?: string;
  ssl_enabled?: boolean;
  email_logo_url?: string;
  email_header_color?: string;
  email_footer_text?: string;
  email_from_name?: string;
  login_background_url?: string;
  login_banner_text?: string;
  login_welcome_message?: string;
  institution_name_override?: string;
  custom_css?: string;
  custom_meta_tags?: Record<string, any>;
  social_links?: Record<string, string>;
  show_powered_by?: boolean;
  is_active?: boolean;
}

export interface BrandingUpdate {
  logo_url?: string;
  favicon_url?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  custom_domain?: string;
  subdomain?: string;
  ssl_enabled?: boolean;
  email_logo_url?: string;
  email_header_color?: string;
  email_footer_text?: string;
  email_from_name?: string;
  login_background_url?: string;
  login_banner_text?: string;
  login_welcome_message?: string;
  institution_name_override?: string;
  custom_css?: string;
  custom_meta_tags?: Record<string, any>;
  social_links?: Record<string, string>;
  show_powered_by?: boolean;
  is_active?: boolean;
}

export interface BrandingPreview {
  branding: InstitutionBranding;
  institution_name: string;
  preview_url: string;
}

export interface CustomDomainRequest {
  custom_domain: string;
  ssl_enabled: boolean;
}

export interface CustomDomainResponse {
  custom_domain: string;
  subdomain?: string;
  domain_verified: boolean;
  ssl_enabled: boolean;
  verification_instructions: string;
  dns_records: Array<{
    type: string;
    name: string;
    value: string;
    ttl: string;
  }>;
}

export interface UploadLogoResponse {
  url: string;
  s3_key: string;
  field: string;
}

const superAdminApi = {
  getDashboard: async (): Promise<SuperAdminDashboardResponse> => {
    const response = await axios.get<SuperAdminDashboardResponse>('/api/v1/super-admin/dashboard');
    return response.data;
  },

  getInstitutionDetails: async (institutionId: number): Promise<InstitutionDetails> => {
    const response = await axios.get<InstitutionDetails>(
      `/api/v1/super-admin/institutions/${institutionId}/details`
    );
    return response.data;
  },

  getRevenueBreakdown: async (startDate?: string, endDate?: string): Promise<RevenueBreakdown> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await axios.get<RevenueBreakdown>(
      `/api/v1/super-admin/statistics/revenue-breakdown?${params.toString()}`
    );
    return response.data;
  },

  getUserGrowthStatistics: async (days: number = 30): Promise<UserGrowthStatistics> => {
    const response = await axios.get<UserGrowthStatistics>(
      `/api/v1/super-admin/statistics/user-growth?days=${days}`
    );
    return response.data;
  },

  listInstitutions: async (params: {
    page?: number;
    page_size?: number;
    search?: string;
    status?: string;
    plan?: string;
    sort_by?: string;
    sort_order?: string;
  }): Promise<InstitutionListResponse> => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await axios.get<InstitutionListResponse>(
      `/api/v1/super-admin/institutions?${queryParams.toString()}`
    );
    return response.data;
  },

  createInstitution: async (
    data: InstitutionCreate
  ): Promise<{ id: number; name: string; slug: string; message: string }> => {
    const response = await axios.post('/api/v1/super-admin/institutions', data);
    return response.data;
  },

  updateInstitution: async (
    institutionId: number,
    data: InstitutionUpdate
  ): Promise<{ id: number; name: string; message: string }> => {
    const response = await axios.put(`/api/v1/super-admin/institutions/${institutionId}`, data);
    return response.data;
  },

  updateSubscription: async (
    institutionId: number,
    data: SubscriptionUpdate
  ): Promise<{ id: number; plan_name: string; status: string; message: string }> => {
    const response = await axios.put(
      `/api/v1/super-admin/institutions/${institutionId}/subscription`,
      data
    );
    return response.data;
  },

  getBillingHistory: async (
    institutionId: number
  ): Promise<{ billing_history: BillingHistoryItem[] }> => {
    const response = await axios.get(
      `/api/v1/super-admin/institutions/${institutionId}/billing-history`
    );
    return response.data;
  },

  getUsageMetrics: async (institutionId: number): Promise<{ usage_metrics: UsageMetric[] }> => {
    const response = await axios.get(`/api/v1/super-admin/institutions/${institutionId}/usage`);
    return response.data;
  },

  getInstitutionAnalytics: async (
    institutionId: number,
    days: number = 30
  ): Promise<InstitutionAnalytics> => {
    const response = await axios.get<InstitutionAnalytics>(
      `/api/v1/super-admin/institutions/${institutionId}/analytics?days=${days}`
    );
    return response.data;
  },

  // Branding endpoints
  getBranding: async (institutionId: number): Promise<InstitutionBranding> => {
    const response = await axios.get<InstitutionBranding>(
      `/api/v1/super-admin/institutions/${institutionId}/branding`
    );
    return response.data;
  },

  createBranding: async (
    institutionId: number,
    data: BrandingCreate
  ): Promise<InstitutionBranding> => {
    const response = await axios.post<InstitutionBranding>(
      `/api/v1/super-admin/institutions/${institutionId}/branding`,
      data
    );
    return response.data;
  },

  updateBranding: async (
    institutionId: number,
    data: BrandingUpdate
  ): Promise<InstitutionBranding> => {
    const response = await axios.put<InstitutionBranding>(
      `/api/v1/super-admin/institutions/${institutionId}/branding`,
      data
    );
    return response.data;
  },

  uploadLogo: async (
    institutionId: number,
    field: 'logo' | 'favicon' | 'email_logo' | 'login_background',
    file: File
  ): Promise<UploadLogoResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post<UploadLogoResponse>(
      `/api/v1/super-admin/institutions/${institutionId}/branding/upload-logo?field=${field}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  setCustomDomain: async (
    institutionId: number,
    data: CustomDomainRequest
  ): Promise<CustomDomainResponse> => {
    const response = await axios.post<CustomDomainResponse>(
      `/api/v1/super-admin/institutions/${institutionId}/branding/custom-domain`,
      data
    );
    return response.data;
  },

  verifyDomain: async (
    institutionId: number
  ): Promise<{ verified: boolean; message: string }> => {
    const response = await axios.post(
      `/api/v1/super-admin/institutions/${institutionId}/branding/verify-domain`
    );
    return response.data;
  },

  getBrandingPreview: async (institutionId: number): Promise<BrandingPreview> => {
    const response = await axios.get<BrandingPreview>(
      `/api/v1/super-admin/institutions/${institutionId}/branding/preview`
    );
    return response.data;
  },

  deleteBranding: async (institutionId: number): Promise<{ message: string }> => {
    const response = await axios.delete(`/api/v1/super-admin/institutions/${institutionId}/branding`);
    return response.data;
  },
};

export default superAdminApi;
