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
};

export default superAdminApi;
