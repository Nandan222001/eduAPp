from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class TimeRange(str, Enum):
    LAST_HOUR = "last_hour"
    LAST_24_HOURS = "last_24_hours"
    LAST_7_DAYS = "last_7_days"
    LAST_30_DAYS = "last_30_days"
    CUSTOM = "custom"


class MetricAggregation(str, Enum):
    AVG = "avg"
    MIN = "min"
    MAX = "max"
    SUM = "sum"
    COUNT = "count"
    P50 = "p50"
    P95 = "p95"
    P99 = "p99"


class APIEndpointStats(BaseModel):
    endpoint: str
    method: str
    total_requests: int
    avg_response_time_ms: float
    min_response_time_ms: float
    max_response_time_ms: float
    p50_response_time_ms: float
    p95_response_time_ms: float
    p99_response_time_ms: float
    error_rate: float
    success_rate: float
    total_errors: int
    requests_per_minute: float


class APIPerformanceOverview(BaseModel):
    total_requests: int
    avg_response_time_ms: float
    error_rate: float
    slowest_endpoints: List[APIEndpointStats]
    most_used_endpoints: List[APIEndpointStats]
    error_endpoints: List[APIEndpointStats]
    requests_by_status: Dict[int, int]
    requests_over_time: List[Dict[str, Any]]


class DatabaseQueryStats(BaseModel):
    query_hash: str
    query_type: str
    table_name: Optional[str]
    execution_count: int
    avg_execution_time_ms: float
    min_execution_time_ms: float
    max_execution_time_ms: float
    total_execution_time_ms: float
    slow_query_count: int
    total_rows_affected: int


class DatabasePerformanceOverview(BaseModel):
    total_queries: int
    avg_query_time_ms: float
    slow_queries_count: int
    slowest_queries: List[DatabaseQueryStats]
    queries_by_type: Dict[str, int]
    queries_by_table: Dict[str, int]
    queries_over_time: List[Dict[str, Any]]


class CachePerformanceStats(BaseModel):
    cache_key_pattern: str
    total_operations: int
    hits: int
    misses: int
    hit_rate: float
    avg_execution_time_ms: float
    total_size_bytes: int


class CachePerformanceOverview(BaseModel):
    total_operations: int
    total_hits: int
    total_misses: int
    overall_hit_rate: float
    avg_operation_time_ms: float
    cache_stats_by_pattern: List[CachePerformanceStats]
    operations_over_time: List[Dict[str, Any]]


class TaskQueueStats(BaseModel):
    task_name: str
    total_tasks: int
    successful_tasks: int
    failed_tasks: int
    pending_tasks: int
    avg_execution_time_ms: float
    avg_wait_time_ms: float
    avg_retries: float
    error_rate: float


class TaskQueueOverview(BaseModel):
    total_tasks: int
    active_tasks: int
    completed_tasks: int
    failed_tasks: int
    avg_execution_time_ms: float
    avg_wait_time_ms: float
    task_stats: List[TaskQueueStats]
    tasks_over_time: List[Dict[str, Any]]


class ResourceUtilizationStats(BaseModel):
    timestamp: datetime
    cpu_percent: Optional[float]
    memory_percent: Optional[float]
    memory_used_mb: Optional[float]
    disk_percent: Optional[float]
    active_connections: Optional[int]
    active_sessions: Optional[int]


class ResourceUtilizationOverview(BaseModel):
    current_cpu_percent: float
    current_memory_percent: float
    current_memory_used_mb: float
    current_disk_percent: float
    current_active_connections: int
    current_active_sessions: int
    avg_cpu_percent: float
    avg_memory_percent: float
    peak_cpu_percent: float
    peak_memory_percent: float
    utilization_over_time: List[ResourceUtilizationStats]


class ActiveUserStats(BaseModel):
    timestamp: datetime
    active_users: int
    new_sessions: int
    total_sessions: int


class ActiveUsersOverview(BaseModel):
    current_active_users: int
    peak_active_users: int
    avg_active_users: float
    total_unique_users: int
    active_users_over_time: List[ActiveUserStats]


class PerformanceAlertResponse(BaseModel):
    id: int
    timestamp: datetime
    alert_type: str
    severity: str
    status: str
    title: str
    description: str
    metric_value: Optional[float]
    threshold_value: Optional[float]
    affected_resource: Optional[str]
    acknowledged_by: Optional[int]
    acknowledged_at: Optional[datetime]
    resolved_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class PerformanceAlertsOverview(BaseModel):
    total_alerts: int
    active_alerts: int
    critical_alerts: int
    alerts_by_severity: Dict[str, int]
    alerts_by_type: Dict[str, int]
    recent_alerts: List[PerformanceAlertResponse]


class PerformanceDashboardData(BaseModel):
    time_range: TimeRange
    start_time: datetime
    end_time: datetime
    api_performance: APIPerformanceOverview
    database_performance: DatabasePerformanceOverview
    cache_performance: CachePerformanceOverview
    task_queue_performance: TaskQueueOverview
    resource_utilization: ResourceUtilizationOverview
    active_users: ActiveUsersOverview
    alerts: PerformanceAlertsOverview


class PerformanceMetricsQuery(BaseModel):
    time_range: TimeRange = Field(default=TimeRange.LAST_24_HOURS)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    institution_id: Optional[int] = None
    endpoint: Optional[str] = None
    aggregation: MetricAggregation = Field(default=MetricAggregation.AVG)


class AcknowledgeAlertRequest(BaseModel):
    alert_ids: List[int]


class ResolveAlertRequest(BaseModel):
    alert_ids: List[int]


class PerformanceThresholds(BaseModel):
    api_response_time_warning_ms: float = Field(default=1000.0)
    api_response_time_critical_ms: float = Field(default=3000.0)
    api_error_rate_warning: float = Field(default=0.05)
    api_error_rate_critical: float = Field(default=0.15)
    db_query_time_warning_ms: float = Field(default=500.0)
    db_query_time_critical_ms: float = Field(default=2000.0)
    cache_hit_rate_warning: float = Field(default=0.7)
    cache_hit_rate_critical: float = Field(default=0.5)
    cpu_usage_warning: float = Field(default=70.0)
    cpu_usage_critical: float = Field(default=90.0)
    memory_usage_warning: float = Field(default=75.0)
    memory_usage_critical: float = Field(default=90.0)
    disk_usage_warning: float = Field(default=80.0)
    disk_usage_critical: float = Field(default=95.0)


class UpdateThresholdsRequest(BaseModel):
    thresholds: PerformanceThresholds
