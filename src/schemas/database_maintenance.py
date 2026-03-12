from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class TaskResponse(BaseModel):
    """Response for async task operations."""
    task_id: str
    status: str
    message: str


class IndexInfo(BaseModel):
    """Information about a database index."""
    schema: str
    table: str
    index: str
    scans: int
    tuples_read: int
    tuples_fetched: int
    size: str
    size_bytes: int


class IndexRecommendations(BaseModel):
    """Index usage recommendations."""
    generated_at: str
    unused_indexes: List[IndexInfo]
    rarely_used_indexes: List[IndexInfo]
    total_indexes_analyzed: int


class DeadTupleInfo(BaseModel):
    """Information about dead tuples in a table."""
    schema: str
    table: str
    live_tuples: int
    dead_tuples: int
    dead_tuple_ratio: float
    last_vacuum: Optional[str]
    last_autovacuum: Optional[str]
    total_size: str


class DeadTupleReport(BaseModel):
    """Report on dead tuples."""
    status: str
    tables_vacuumed: int
    details: List[DeadTupleInfo]


class SlowQueryInfo(BaseModel):
    """Information about a slow query."""
    query_id: str
    query_sample: str
    calls: int
    total_time_ms: float
    mean_time_ms: float
    min_time_ms: float
    max_time_ms: float
    stddev_time_ms: float
    total_rows: int


class SlowQueryReport(BaseModel):
    """Report on slow queries."""
    generated_at: str
    queries: List[SlowQueryInfo]


class TableBloatInfo(BaseModel):
    """Information about table bloat."""
    schema: str
    table: str
    total_size: str
    table_size: str
    indexes_size: str
    total_bytes: int
    percent_of_db: float


class TableBloatReport(BaseModel):
    """Report on table bloat."""
    generated_at: str
    tables: List[TableBloatInfo]


class PartitionInfo(BaseModel):
    """Information about a partition."""
    schema: str
    name: str
    size: str


class PartitionListResponse(BaseModel):
    """Response containing partition information."""
    status: str
    partition_count: int
    partitions: List[PartitionInfo]


class DatabaseSize(BaseModel):
    """Database size information."""
    size: str
    size_bytes: int


class ConnectionStats(BaseModel):
    """Database connection statistics."""
    total: int
    active: int
    idle: int
    idle_in_transaction: int


class CacheStats(BaseModel):
    """Database cache statistics."""
    heap_blocks_hit: int
    heap_blocks_read: int
    cache_hit_ratio: float


class TransactionStats(BaseModel):
    """Database transaction statistics."""
    commits: int
    rollbacks: int
    commit_ratio: float


class DatabaseStats(BaseModel):
    """Comprehensive database statistics."""
    status: str
    database: DatabaseSize
    connections: ConnectionStats
    cache: CacheStats
    transactions: TransactionStats


class MaintenanceTaskSchedule(BaseModel):
    """Maintenance task schedule information."""
    task: str
    schedule_seconds: float
    schedule_human: str


class MaintenanceScheduleResponse(BaseModel):
    """Response containing maintenance schedule."""
    status: str
    tasks: Dict[str, MaintenanceTaskSchedule]


class VacuumAnalyzeResponse(BaseModel):
    """Response for VACUUM ANALYZE operation."""
    status: str
    tables_processed: Optional[int] = None
    message: Optional[str] = None


class ReindexRequest(BaseModel):
    """Request to reindex specific tables."""
    tables: Optional[List[str]] = Field(
        None,
        description="List of table names to reindex. If not provided, high-traffic tables will be reindexed."
    )


class ReindexResponse(BaseModel):
    """Response for reindex operation."""
    status: str
    tables_reindexed: int
    tables: List[str]


class PartitionCleanupRequest(BaseModel):
    """Request to cleanup old partitions."""
    months_to_keep: int = Field(
        12,
        ge=1,
        le=120,
        description="Number of months of data to retain"
    )


class PartitionCleanupResponse(BaseModel):
    """Response for partition cleanup operation."""
    status: str
    partitions_dropped: int
    partitions: List[str]


class DropIndexResponse(BaseModel):
    """Response for dropping an index."""
    status: str
    message: str


class EnableExtensionResponse(BaseModel):
    """Response for enabling a PostgreSQL extension."""
    status: str
    message: str


class MaintenanceStatus(BaseModel):
    """Overall maintenance status."""
    last_vacuum: Optional[datetime]
    last_analyze: Optional[datetime]
    last_reindex: Optional[datetime]
    pending_partitions: int
    unused_indexes_count: int
    tables_needing_vacuum: int
    slow_queries_count: int


class MaintenanceDashboard(BaseModel):
    """Comprehensive maintenance dashboard."""
    status: str
    database_stats: DatabaseStats
    maintenance_status: MaintenanceStatus
    recommendations: List[str]
