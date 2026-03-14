from pydantic import BaseModel, Field, EmailStr, validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum


# ==================== Report Builder ====================

class ReportFieldConfig(BaseModel):
    """Configuration for a report field."""
    field_name: str = Field(..., description="Name of the field")
    display_name: Optional[str] = Field(None, description="Display name for the field")
    data_type: str = Field(..., description="Data type: string, integer, decimal, date, boolean")
    aggregation: Optional[str] = Field(None, description="Aggregation function: count, sum, avg, min, max")


class ReportFilter(BaseModel):
    """Filter configuration for reports."""
    field_name: str = Field(..., description="Field to filter on")
    operator: str = Field(..., description="Operator: equals, not_equals, greater_than, less_than, contains, in, between")
    value: Union[str, int, float, List[Any], Dict[str, Any]] = Field(..., description="Filter value")


class ReportSortConfig(BaseModel):
    """Sort configuration for reports."""
    field_name: str = Field(..., description="Field to sort by")
    direction: str = Field("asc", description="Sort direction: asc or desc")


class ReportBuilderRequest(BaseModel):
    """Request for building a custom report."""
    report_name: str = Field(..., min_length=1, max_length=255)
    entity_type: str = Field(..., description="Base entity: users, institutions, subscriptions, payments, students, etc.")
    selected_fields: List[ReportFieldConfig] = Field(..., min_items=1, description="Fields to include in the report")
    filters: Optional[List[ReportFilter]] = Field(default=[], description="Filters to apply")
    group_by: Optional[List[str]] = Field(default=[], description="Fields to group by")
    sort_by: Optional[List[ReportSortConfig]] = Field(default=[], description="Sort configuration")
    limit: Optional[int] = Field(1000, ge=1, le=100000, description="Maximum number of results")
    include_totals: bool = Field(True, description="Include totals/aggregations")
    output_format: str = Field("json", description="Output format: json, csv, excel")


class ReportBuilderResponse(BaseModel):
    """Response from report builder."""
    report_name: str
    entity_type: str
    columns: List[str]
    data: List[Dict[str, Any]]
    totals: Optional[Dict[str, Any]] = None
    row_count: int
    generated_at: datetime
    execution_time_ms: float


# ==================== Scheduled Reports ====================

class ScheduleConfig(BaseModel):
    """Cron-like schedule configuration."""
    frequency: str = Field(..., description="Frequency: daily, weekly, monthly, custom")
    time_of_day: str = Field(..., description="Time in HH:MM format")
    day_of_week: Optional[int] = Field(None, ge=0, le=6, description="0=Monday, 6=Sunday (for weekly)")
    day_of_month: Optional[int] = Field(None, ge=1, le=31, description="Day of month (for monthly)")
    timezone: str = Field("UTC", description="Timezone for scheduling")


class EmailRecipient(BaseModel):
    """Email recipient configuration."""
    email: EmailStr
    name: Optional[str] = None


class ScheduledReportCreate(BaseModel):
    """Create a scheduled report."""
    report_name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    report_config: ReportBuilderRequest = Field(..., description="Report configuration")
    schedule: ScheduleConfig = Field(..., description="Schedule configuration")
    email_recipients: List[EmailRecipient] = Field(..., min_items=1, description="Email recipients")
    store_in_s3: bool = Field(True, description="Store generated reports in S3")
    s3_bucket: Optional[str] = Field(None, description="S3 bucket name")
    s3_prefix: Optional[str] = Field("reports/", description="S3 key prefix")
    retention_days: int = Field(90, ge=1, le=3650, description="Days to retain reports")
    is_active: bool = Field(True, description="Whether the schedule is active")


class ScheduledReportUpdate(BaseModel):
    """Update a scheduled report."""
    report_name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    report_config: Optional[ReportBuilderRequest] = None
    schedule: Optional[ScheduleConfig] = None
    email_recipients: Optional[List[EmailRecipient]] = None
    store_in_s3: Optional[bool] = None
    s3_bucket: Optional[str] = None
    s3_prefix: Optional[str] = None
    retention_days: Optional[int] = Field(None, ge=1, le=3650)
    is_active: Optional[bool] = None


class ScheduledReportResponse(BaseModel):
    """Response for scheduled report."""
    id: int
    report_name: str
    description: Optional[str]
    report_config: Dict[str, Any]
    schedule: Dict[str, Any]
    email_recipients: List[Dict[str, str]]
    store_in_s3: bool
    s3_bucket: Optional[str]
    s3_prefix: Optional[str]
    retention_days: int
    is_active: bool
    last_run_at: Optional[datetime]
    next_run_at: Optional[datetime]
    created_by_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ScheduledReportListResponse(BaseModel):
    """Paginated list of scheduled reports."""
    items: List[ScheduledReportResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ==================== Data Export ====================

class AnonymizationStrategy(str, Enum):
    """Anonymization strategies."""
    NONE = "none"
    HASH = "hash"
    MASK = "mask"
    REMOVE = "remove"
    GENERALIZE = "generalize"
    PSEUDONYMIZE = "pseudonymize"


class AnonymizationFieldConfig(BaseModel):
    """Configuration for anonymizing a specific field."""
    field_name: str
    strategy: AnonymizationStrategy
    options: Optional[Dict[str, Any]] = Field(default={}, description="Strategy-specific options")


class AnonymizationConfig(BaseModel):
    """Configuration for data anonymization."""
    enabled: bool = Field(True, description="Enable anonymization")
    fields: List[AnonymizationFieldConfig] = Field(default=[], description="Field-specific anonymization rules")
    remove_pii: bool = Field(True, description="Automatically remove known PII fields")
    hash_salt: Optional[str] = Field(None, description="Salt for hashing (auto-generated if not provided)")


class DataExportRequest(BaseModel):
    """Request for cross-institution data export."""
    export_name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    entity_types: List[str] = Field(..., min_items=1, description="Entity types to export")
    institution_ids: Optional[List[int]] = Field(None, description="Specific institutions (None = all)")
    date_from: Optional[datetime] = Field(None, description="Export data from this date")
    date_to: Optional[datetime] = Field(None, description="Export data until this date")
    fields_to_include: Optional[List[str]] = Field(None, description="Specific fields (None = all)")
    fields_to_exclude: Optional[List[str]] = Field(default=[], description="Fields to exclude")
    anonymization: AnonymizationConfig = Field(default_factory=lambda: AnonymizationConfig())
    output_format: str = Field("csv", description="Format: csv, json, excel, parquet")
    compression: bool = Field(True, description="Compress output file")
    purpose: str = Field(..., description="Purpose of export (for audit trail)")


class DataExportResponse(BaseModel):
    """Response for data export request."""
    job_id: int
    status: str
    message: str
    download_url: Optional[str] = None
    file_size_bytes: Optional[int] = None
    row_count: Optional[int] = None
    created_at: datetime
    completed_at: Optional[datetime] = None


# ==================== Compliance Reports ====================

class ComplianceReportType(str, Enum):
    """Types of compliance reports."""
    STUDENT_PRIVACY_AUDIT = "student_privacy_audit"
    BILLING_HISTORY = "billing_history"
    USAGE_REPORT = "usage_report"
    GDPR_DATA_ACCESS = "gdpr_data_access"
    DATA_RETENTION = "data_retention"


class ComplianceReportRequest(BaseModel):
    """Request for compliance report."""
    report_type: ComplianceReportType
    start_date: datetime
    end_date: datetime
    institution_ids: Optional[List[int]] = Field(None, description="Specific institutions (None = all)")
    filters: Optional[Dict[str, Any]] = Field(default={}, description="Additional filters")
    include_details: bool = Field(True, description="Include detailed records")
    output_format: str = Field("pdf", description="Format: pdf, excel, csv")


class ComplianceReportResponse(BaseModel):
    """Response for compliance report."""
    report_id: str
    report_type: str
    generated_at: datetime
    period_start: datetime
    period_end: datetime
    summary: Dict[str, Any]
    download_url: Optional[str]
    file_size_bytes: Optional[int]


# ==================== Executive Dashboard ====================

class DashboardMetricType(str, Enum):
    """Types of dashboard metrics."""
    REVENUE = "revenue"
    GROWTH = "growth"
    USER_METRICS = "user_metrics"
    CHURN = "churn"
    ENGAGEMENT = "engagement"
    MRR = "mrr"
    ARR = "arr"
    COST_ANALYSIS = "cost_analysis"
    PROFITABILITY = "profitability"


class ExecutiveDashboardRequest(BaseModel):
    """Request for executive dashboard."""
    template_id: str = Field(..., description="Dashboard template ID")
    start_date: datetime
    end_date: datetime
    metrics: List[DashboardMetricType] = Field(..., min_items=1, description="Metrics to include")
    comparison_period: bool = Field(True, description="Include comparison with previous period")
    include_forecasts: bool = Field(False, description="Include forecasted data")
    granularity: str = Field("daily", description="Data granularity: daily, weekly, monthly")


class ExecutiveDashboardMetric(BaseModel):
    """Individual dashboard metric."""
    metric_name: str
    current_value: float
    previous_value: Optional[float]
    change_percentage: Optional[float]
    trend: str  # "up", "down", "stable"
    chart_data: Optional[List[Dict[str, Any]]]


class ExecutiveDashboardResponse(BaseModel):
    """Response for executive dashboard."""
    template_id: str
    template_name: str
    generated_at: datetime
    period_start: datetime
    period_end: datetime
    metrics: List[ExecutiveDashboardMetric]
    summary: Dict[str, Any]
    insights: List[str]


# ==================== API Access Logs & Security ====================

class APIAccessLogFilters(BaseModel):
    """Filters for API access logs."""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    user_id: Optional[int] = None
    institution_id: Optional[int] = None
    endpoint: Optional[str] = None
    method: Optional[str] = None
    status_code: Optional[int] = None
    has_errors: Optional[bool] = None
    ip_address: Optional[str] = None


class APIAccessLogItem(BaseModel):
    """Individual API access log entry."""
    id: int
    user_id: Optional[int]
    user_email: Optional[str]
    institution_id: Optional[int]
    endpoint: str
    method: str
    status_code: int
    request_data: Optional[Dict[str, Any]]
    response_time_ms: int
    ip_address: Optional[str]
    user_agent: Optional[str]
    error_message: Optional[str]
    created_at: datetime


class APIAccessLogResponse(BaseModel):
    """Response for API access logs."""
    items: List[APIAccessLogItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class SecurityAuditReportRequest(BaseModel):
    """Request for security audit report."""
    start_date: datetime
    end_date: datetime
    include_failed_logins: bool = Field(True, description="Include failed login attempts")
    include_data_access: bool = Field(True, description="Include sensitive data access")
    include_anomalies: bool = Field(True, description="Include detected anomalies")
    include_impersonations: bool = Field(True, description="Include impersonation logs")
    institution_ids: Optional[List[int]] = None


class SecurityAuditReportResponse(BaseModel):
    """Response for security audit report."""
    report_id: str
    generated_at: datetime
    period_start: datetime
    period_end: datetime
    failed_login_count: int
    suspicious_activity_count: int
    data_access_count: int
    impersonation_count: int
    anomalies: List[Dict[str, Any]]
    summary: Dict[str, Any]
    download_url: Optional[str]


# ==================== Data Retention ====================

class DataRetentionAction(str, Enum):
    """Actions for data retention."""
    ARCHIVE = "archive"
    DELETE = "delete"
    ANONYMIZE = "anonymize"


class DataRetentionPolicyCreate(BaseModel):
    """Create data retention policy."""
    policy_name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    entity_type: str = Field(..., description="Entity type to apply policy to")
    retention_days: int = Field(..., ge=1, description="Days to retain data")
    action: DataRetentionAction = Field(..., description="Action to take after retention period")
    filters: Optional[Dict[str, Any]] = Field(default={}, description="Additional filters")
    is_active: bool = Field(True, description="Whether policy is active")
    auto_execute: bool = Field(False, description="Automatically execute on schedule")
    execution_schedule: Optional[str] = Field(None, description="Cron expression for auto-execution")


class DataRetentionPolicyUpdate(BaseModel):
    """Update data retention policy."""
    policy_name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    retention_days: Optional[int] = Field(None, ge=1)
    action: Optional[DataRetentionAction] = None
    filters: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    auto_execute: Optional[bool] = None
    execution_schedule: Optional[str] = None


class DataRetentionPolicyResponse(BaseModel):
    """Response for data retention policy."""
    id: int
    policy_name: str
    description: Optional[str]
    entity_type: str
    retention_days: int
    action: str
    filters: Dict[str, Any]
    is_active: bool
    auto_execute: bool
    execution_schedule: Optional[str]
    last_executed_at: Optional[datetime]
    next_execution_at: Optional[datetime]
    records_processed: int
    created_by_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DataRetentionPolicyListResponse(BaseModel):
    """Paginated list of data retention policies."""
    items: List[DataRetentionPolicyResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ==================== Archival Jobs ====================

class ArchivalJobCreate(BaseModel):
    """Create archival job."""
    job_name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    entity_type: str = Field(..., description="Entity type to archive")
    date_from: Optional[datetime] = Field(None, description="Archive data from this date")
    date_to: datetime = Field(..., description="Archive data until this date")
    filters: Optional[Dict[str, Any]] = Field(default={}, description="Additional filters")
    s3_bucket: Optional[str] = Field(None, description="S3 bucket for archival")
    s3_prefix: Optional[str] = Field("archive/", description="S3 key prefix")
    compression: bool = Field(True, description="Compress archived data")
    delete_after_archive: bool = Field(False, description="Delete data after successful archive")


class ArchivalJobResponse(BaseModel):
    """Response for archival job."""
    id: int
    job_name: str
    description: Optional[str]
    entity_type: str
    status: str
    date_from: Optional[datetime]
    date_to: datetime
    filters: Dict[str, Any]
    s3_bucket: Optional[str]
    s3_prefix: Optional[str]
    s3_key: Optional[str]
    compression: bool
    delete_after_archive: bool
    records_archived: int
    file_size_bytes: Optional[int]
    error_message: Optional[str]
    created_by_id: int
    created_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class ArchivalJobListResponse(BaseModel):
    """Paginated list of archival jobs."""
    items: List[ArchivalJobResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
