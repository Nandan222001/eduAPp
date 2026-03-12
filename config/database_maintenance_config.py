"""
Database Maintenance Configuration

This file contains configuration settings for database maintenance tasks.
Override these values in production based on your specific needs.
"""

from typing import List, Dict, Any


class DatabaseMaintenanceConfig:
    """Configuration for database maintenance operations."""
    
    VACUUM_ANALYZE_TABLES: List[str] = [
        'attendances',
        'attendance_corrections',
        'attendance_summaries',
        'analytics_events',
        'performance_metrics',
        'user_sessions',
        'feature_usage',
        'user_retention',
        'students',
        'teachers',
        'assignments',
        'submissions',
        'grades',
        'exams',
        'notifications',
        'messages',
        'announcements',
        'gamification_points',
        'goals',
        'study_plans',
        'question_bank',
        'previous_year_papers',
    ]
    
    REINDEX_TABLES: List[str] = [
        'attendances',
        'analytics_events',
        'performance_metrics',
        'user_sessions',
        'students',
        'assignments',
        'submissions',
        'exams',
    ]
    
    DEAD_TUPLE_RATIO_THRESHOLD: float = 20.0
    
    DEAD_TUPLE_COUNT_THRESHOLD: int = 10000
    
    SLOW_QUERY_THRESHOLD_MS: int = 100
    
    SLOW_QUERY_LIMIT: int = 50
    
    UNUSED_INDEX_SIZE_THRESHOLD_BYTES: int = 1024 * 1024
    
    RARELY_USED_INDEX_SCAN_THRESHOLD: int = 10
    
    RARELY_USED_INDEX_SIZE_THRESHOLD_BYTES: int = 5 * 1024 * 1024
    
    PARTITION_MONTHS_AHEAD: int = 3
    
    PARTITION_RETENTION_MONTHS: int = 12
    
    LONG_RUNNING_QUERY_THRESHOLD_SECONDS: int = 60
    
    MISSING_INDEX_SEQ_SCAN_THRESHOLD: int = 1000
    
    TABLE_BLOAT_REPORT_LIMIT: int = 20
    
    TABLE_SIZE_REPORT_LIMIT: int = 20
    
    CACHE_TTL: Dict[str, int] = {
        'index_recommendations': 86400 * 7,
        'slow_queries': 86400,
        'bloat_report': 86400,
    }
    
    CELERY_SCHEDULES: Dict[str, float] = {
        'vacuum_analyze': 86400.0,
        'analyze_indexes': 604800.0,
        'cleanup_dead_tuples': 21600.0,
        'log_slow_queries': 3600.0,
        'create_partitions': 86400.0,
        'table_bloat_report': 604800.0,
        'update_statistics': 43200.0,
    }
    
    POSTGRESQL_SETTINGS_RECOMMENDATIONS: Dict[str, str] = {
        'shared_preload_libraries': 'pg_stat_statements',
        'pg_stat_statements.track': 'all',
        'pg_stat_statements.max': '10000',
        'autovacuum': 'on',
        'autovacuum_max_workers': '3',
        'autovacuum_naptime': '30s',
        'autovacuum_vacuum_threshold': '50',
        'autovacuum_analyze_threshold': '50',
        'autovacuum_vacuum_scale_factor': '0.1',
        'autovacuum_analyze_scale_factor': '0.05',
        'max_parallel_maintenance_workers': '4',
        'maintenance_work_mem': '256MB',
    }
    
    MAINTENANCE_WINDOW_HOURS: List[int] = [0, 1, 2, 3, 4]
    
    ENABLE_AUTO_PARTITION_CREATION: bool = True
    
    ENABLE_AUTO_PARTITION_CLEANUP: bool = True
    
    ENABLE_AUTO_INDEX_RECOMMENDATIONS: bool = True
    
    ENABLE_AUTO_DEAD_TUPLE_CLEANUP: bool = True
    
    ENABLE_SLOW_QUERY_LOGGING: bool = True
    
    ALERT_THRESHOLDS: Dict[str, Any] = {
        'cache_hit_ratio_min': 85.0,
        'dead_tuple_ratio_max': 30.0,
        'connection_pool_usage_max': 80.0,
        'disk_usage_max': 85.0,
        'slow_query_count_max': 100,
        'long_running_query_max_seconds': 300,
    }
    
    NOTIFICATIONS: Dict[str, bool] = {
        'send_on_high_dead_tuples': True,
        'send_on_low_cache_hit_ratio': True,
        'send_on_partition_creation_failure': True,
        'send_on_vacuum_failure': True,
        'send_on_high_bloat': True,
    }
    
    PARTITION_STRATEGY: Dict[str, str] = {
        'attendances': 'RANGE',
        'analytics_events': 'RANGE',
    }
    
    PARTITION_COLUMN: Dict[str, str] = {
        'attendances': 'date',
        'analytics_events': 'created_at',
    }
    
    @classmethod
    def get_vacuum_tables(cls) -> List[str]:
        """Get list of tables to vacuum."""
        return cls.VACUUM_ANALYZE_TABLES
    
    @classmethod
    def get_reindex_tables(cls) -> List[str]:
        """Get list of tables to reindex."""
        return cls.REINDEX_TABLES
    
    @classmethod
    def get_schedule(cls, task_name: str) -> float:
        """Get schedule for a specific task."""
        return cls.CELERY_SCHEDULES.get(task_name, 86400.0)
    
    @classmethod
    def should_send_alert(cls, alert_type: str) -> bool:
        """Check if alerts should be sent for this type."""
        return cls.NOTIFICATIONS.get(alert_type, False)
    
    @classmethod
    def is_maintenance_window(cls, hour: int) -> bool:
        """Check if current hour is in maintenance window."""
        return hour in cls.MAINTENANCE_WINDOW_HOURS
    
    @classmethod
    def get_cache_ttl(cls, cache_type: str) -> int:
        """Get cache TTL for specific cache type."""
        return cls.CACHE_TTL.get(cache_type, 86400)


config = DatabaseMaintenanceConfig()
