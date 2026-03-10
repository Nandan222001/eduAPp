from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class InstitutionMetricsSummary(BaseModel):
    total_institutions: int = Field(..., description="Total number of institutions")
    active_subscriptions: int = Field(..., description="Number of active subscriptions")
    mrr: float = Field(..., description="Monthly Recurring Revenue")
    arr: float = Field(..., description="Annual Recurring Revenue")
    institution_growth_trend: float = Field(..., description="Institution growth percentage")


class SubscriptionStatusDistribution(BaseModel):
    active: int = Field(default=0, description="Number of active subscriptions")
    trial: int = Field(default=0, description="Number of trial subscriptions")
    expired: int = Field(default=0, description="Number of expired subscriptions")
    cancelled: int = Field(default=0, description="Number of cancelled subscriptions")


class PlatformUsageStatistics(BaseModel):
    dau: int = Field(..., description="Daily Active Users")
    mau: int = Field(..., description="Monthly Active Users")
    total_users: int = Field(..., description="Total registered users")
    active_users: int = Field(..., description="Total active users")
    dau_mau_ratio: float = Field(..., description="DAU/MAU ratio as percentage")


class RevenueTrend(BaseModel):
    month: str = Field(..., description="Month label (e.g., 'Jan 2024')")
    mrr: float = Field(..., description="Monthly Recurring Revenue for this month")
    arr: float = Field(..., description="Annual Recurring Revenue for this month")
    total_revenue: float = Field(..., description="Total revenue collected in this month")


class RecentActivity(BaseModel):
    type: str = Field(..., description="Type of activity (institution, subscription, payment, alert)")
    title: str = Field(..., description="Activity title")
    description: str = Field(..., description="Activity description")
    time: str = Field(..., description="Time ago string (e.g., '2 hours ago')")
    institution_id: Optional[int] = Field(None, description="Related institution ID if applicable")


class InstitutionPerformanceComparison(BaseModel):
    id: int = Field(..., description="Institution ID")
    name: str = Field(..., description="Institution name")
    total_users: int = Field(..., description="Total number of users")
    active_users: int = Field(..., description="Number of active users")
    subscription_status: str = Field(..., description="Current subscription status")
    revenue: float = Field(..., description="Total revenue from this institution")
    last_activity: str = Field(..., description="Last activity timestamp")
    engagement: float = Field(..., description="Engagement percentage")


class QuickActionStats(BaseModel):
    trials_expiring_soon: int = Field(..., description="Number of trials expiring within 7 days")
    grace_period_ending: int = Field(..., description="Number of subscriptions with grace period ending soon")
    pending_onboarding: int = Field(..., description="Number of institutions pending onboarding")


class SuperAdminDashboardResponse(BaseModel):
    metrics_summary: InstitutionMetricsSummary
    subscription_distribution: SubscriptionStatusDistribution
    platform_usage: PlatformUsageStatistics
    revenue_trends: List[RevenueTrend]
    recent_activities: List[RecentActivity]
    institution_performance: List[InstitutionPerformanceComparison]
    quick_actions: QuickActionStats

    class Config:
        from_attributes = True
