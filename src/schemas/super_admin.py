from pydantic import BaseModel, Field, EmailStr
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


class InstitutionListItem(BaseModel):
    id: int
    name: str
    slug: str
    domain: Optional[str]
    is_active: bool
    max_users: Optional[int]
    created_at: datetime
    subscription_status: Optional[str]
    subscription_plan: Optional[str]
    total_users: int
    active_users: int
    total_revenue: float

    class Config:
        from_attributes = True


class InstitutionListResponse(BaseModel):
    items: List[InstitutionListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class AdminUserCreate(BaseModel):
    email: EmailStr = Field(..., description="Admin user email")
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    password: str = Field(..., min_length=8)


class SubscriptionPlanCreate(BaseModel):
    plan_name: str = Field(..., description="Plan name (e.g., Basic, Pro, Enterprise)")
    billing_cycle: str = Field(..., description="Billing cycle: monthly, quarterly, yearly")
    price: float = Field(..., gt=0, description="Subscription price")
    max_users: Optional[int] = Field(None, description="Maximum number of users allowed")
    max_storage_gb: Optional[int] = Field(None, description="Maximum storage in GB")
    features: Optional[str] = Field(None, description="JSON string of features")
    trial_days: Optional[int] = Field(None, description="Number of trial days")


class InstitutionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100)
    domain: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    max_users: Optional[int] = None
    admin_user: AdminUserCreate
    subscription: Optional[SubscriptionPlanCreate] = None


class InstitutionUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, min_length=1, max_length=100)
    domain: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    is_active: Optional[bool] = None
    max_users: Optional[int] = None


class SubscriptionUpdate(BaseModel):
    plan_name: Optional[str] = None
    billing_cycle: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    max_users: Optional[int] = None
    max_storage_gb: Optional[int] = None
    features: Optional[str] = None
    auto_renew: Optional[bool] = None


class BillingHistoryItem(BaseModel):
    id: int
    invoice_number: Optional[str] = None
    payment_id: Optional[int] = None
    amount: float
    status: str
    payment_method: Optional[str] = None
    paid_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UsageMetric(BaseModel):
    metric_name: str
    current_value: float
    limit: Optional[float] = None
    percentage_used: Optional[float] = None
    period_start: datetime
    period_end: datetime


class InstitutionAnalytics(BaseModel):
    institution_id: int
    institution_name: str
    user_metrics: dict
    engagement_metrics: dict
    usage_trends: List[dict]
    revenue_metrics: dict
