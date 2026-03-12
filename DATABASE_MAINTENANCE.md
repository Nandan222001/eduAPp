# Database Maintenance System

## Overview

Automated database maintenance system for PostgreSQL including VACUUM ANALYZE scheduling, index usage monitoring, automatic table partitioning, query performance logging, and dead tuple cleanup.

## Features

### 1. VACUUM ANALYZE Scheduling
- **Purpose**: Reclaim storage space and update query planner statistics
- **Schedule**: Daily (configurable)
- **Tables Covered**: All major tables including attendances, analytics_events, students, teachers, assignments, etc.
- **Benefits**:
  - Reclaims disk space from deleted/updated rows
  - Updates statistics for query optimizer
  - Improves query performance
  - Prevents transaction ID wraparound

### 2. Index Usage Monitoring
- **Purpose**: Identify unused or rarely used indexes
- **Schedule**: Weekly
- **Metrics Tracked**:
  - Index scan count
  - Tuples read/fetched
  - Index size
- **Output**: Recommendations for index removal
- **Thresholds**:
  - Unused: 0 scans and >1MB size
  - Rarely used: <10 scans and >5MB size

### 3. Automatic Table Partitioning
- **Tables**: `attendances`, `analytics_events`
- **Partition Strategy**: Range partitioning by date (monthly)
- **Automatic Creation**: Creates partitions for next 3 months
- **Schedule**: Daily check
- **Benefits**:
  - Faster queries on date ranges
  - Easier data archival
  - Improved maintenance performance
  - Better query parallelization

### 4. Query Performance Logging
- **Extension**: pg_stat_statements
- **Schedule**: Hourly
- **Tracked Metrics**:
  - Query execution time (mean, min, max, stddev)
  - Call frequency
  - Rows affected
- **Threshold**: Queries with mean execution time >100ms
- **Output**: Top 50 slow queries logged

### 5. Dead Tuple Cleanup
- **Purpose**: Monitor and clean up dead tuples
- **Schedule**: Every 6 hours
- **Metrics**:
  - Live vs dead tuple counts
  - Dead tuple ratio
  - Last vacuum/autovacuum times
- **Action**: Automatic VACUUM on tables with:
  - Dead tuple ratio >20%
  - Absolute dead tuples >10,000

### 6. Additional Maintenance Tasks

#### Table Bloat Report
- **Schedule**: Weekly
- **Output**: Top 20 largest tables with size breakdown
- **Metrics**: Total size, table size, index size, % of database

#### Reindex Tables
- **Purpose**: Rebuild indexes to reduce bloat
- **Method**: REINDEX TABLE CONCURRENTLY (no locks)
- **Default Tables**: attendances, analytics_events, performance_metrics, etc.

#### Statistics Update
- **Schedule**: Every 12 hours
- **Purpose**: Force update of query planner statistics
- **Method**: ANALYZE on all tables

## API Endpoints

All endpoints require super admin privileges.

### Maintenance Operations

```
POST   /api/v1/database-maintenance/vacuum-analyze
POST   /api/v1/database-maintenance/cleanup-dead-tuples
POST   /api/v1/database-maintenance/update-statistics
POST   /api/v1/database-maintenance/reindex
POST   /api/v1/database-maintenance/enable-pg-stat-statements
```

### Partitioning

```
POST   /api/v1/database-maintenance/create-partitions
POST   /api/v1/database-maintenance/cleanup-old-partitions?months_to_keep=12
GET    /api/v1/database-maintenance/partitions
```

### Monitoring & Reports

```
GET    /api/v1/database-maintenance/stats
GET    /api/v1/database-maintenance/index-recommendations
GET    /api/v1/database-maintenance/slow-queries
GET    /api/v1/database-maintenance/table-bloat
GET    /api/v1/database-maintenance/schedule
```

### Index Management

```
DELETE /api/v1/database-maintenance/indexes/{index_name}
```

## Celery Beat Schedule

The following automated tasks run on schedule:

| Task | Frequency | Purpose |
|------|-----------|---------|
| vacuum-analyze | Daily | Reclaim space and update statistics |
| analyze-indexes | Weekly | Identify unused indexes |
| cleanup-dead-tuples | 6 hours | Clean up dead tuples |
| log-slow-queries | Hourly | Log slow query performance |
| create-partitions | Daily | Create new monthly partitions |
| table-bloat-report | Weekly | Report on table sizes |
| update-statistics | 12 hours | Update query planner stats |

## Setup Instructions

### 1. Enable pg_stat_statements Extension

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

Or via API:
```bash
curl -X POST http://localhost:8000/api/v1/database-maintenance/enable-pg-stat-statements \
  -H "Authorization: Bearer {token}"
```

### 2. Configure PostgreSQL

Add to `postgresql.conf`:

```ini
# Required for pg_stat_statements
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.track = all
pg_stat_statements.max = 10000

# Autovacuum tuning
autovacuum = on
autovacuum_max_workers = 3
autovacuum_naptime = 30s
autovacuum_vacuum_threshold = 50
autovacuum_analyze_threshold = 50
autovacuum_vacuum_scale_factor = 0.1
autovacuum_analyze_scale_factor = 0.05

# For reindexing
max_parallel_maintenance_workers = 4
```

### 3. Run Partitioning Migration

**WARNING**: This migration requires a maintenance window for large tables.

```bash
# Backup your database first!
pg_dump -U postgres -d your_database > backup.sql

# Run the migration
alembic upgrade partition_001
```

### 4. Start Celery Workers

```bash
# Start Celery worker
celery -A src.celery_app worker --loglevel=info

# Start Celery beat scheduler
celery -A src.celery_app beat --loglevel=info
```

## Partition Management

### How Partitions Work

Tables are partitioned by date ranges (monthly):
- `attendances_y2024m01` - January 2024
- `attendances_y2024m02` - February 2024
- `analytics_events_y2024m01` - January 2024
- etc.

### Automatic Partition Creation

The system automatically creates partitions for the next 3 months. When querying:

```sql
-- This query automatically uses the correct partition
SELECT * FROM attendances 
WHERE date BETWEEN '2024-01-01' AND '2024-01-31';
```

### Manual Partition Creation

```python
from src.services.database_maintenance_service import DatabaseMaintenanceService

# Create partitions for next 3 months
DatabaseMaintenanceService.create_partitions()
```

### Partition Cleanup

Old partitions are retained for 12 months by default. To cleanup:

```python
# Keep only 6 months of data
DatabaseMaintenanceService.cleanup_old_partitions(months_to_keep=6)
```

## Monitoring & Alerts

### Database Statistics

Get comprehensive database metrics:

```bash
curl http://localhost:8000/api/v1/database-maintenance/stats \
  -H "Authorization: Bearer {token}"
```

Response includes:
- Database size
- Active/idle connections
- Cache hit ratio
- Transaction commit ratio

### Index Recommendations

```bash
curl http://localhost:8000/api/v1/database-maintenance/index-recommendations \
  -H "Authorization: Bearer {token}"
```

### Slow Query Report

```bash
curl http://localhost:8000/api/v1/database-maintenance/slow-queries \
  -H "Authorization: Bearer {token}"
```

## Best Practices

### 1. Regular Monitoring
- Check database stats daily
- Review slow queries weekly
- Monitor table bloat monthly

### 2. Index Management
- Review unused indexes quarterly
- Drop indexes that haven't been used in 3+ months
- Test query performance before dropping indexes

### 3. Partition Management
- Monitor partition sizes
- Archive old partitions to cold storage
- Adjust retention policy based on compliance requirements

### 4. Vacuum Strategy
- Let autovacuum handle routine maintenance
- Use manual VACUUM for emergency situations
- Schedule VACUUM FULL during maintenance windows

### 5. Statistics
- Keep statistics up-to-date
- Increase statistics target for frequently queried columns
- Monitor query plan changes after statistics updates

## Troubleshooting

### High Dead Tuple Count

```sql
-- Check dead tuples
SELECT schemaname, relname, n_dead_tup, n_live_tup
FROM pg_stat_user_tables
WHERE n_dead_tup > 10000
ORDER BY n_dead_tup DESC;

-- Manual vacuum
VACUUM ANALYZE table_name;
```

### Slow Queries

```sql
-- View slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Reset statistics
SELECT pg_stat_statements_reset();
```

### Table Bloat

```sql
-- Check table sizes
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Rebuild table (requires downtime)
VACUUM FULL table_name;
```

### Index Bloat

```sql
-- Reindex without locking
REINDEX INDEX CONCURRENTLY index_name;

-- Or reindex entire table
REINDEX TABLE CONCURRENTLY table_name;
```

## Performance Impact

### VACUUM ANALYZE
- **Impact**: Low to Medium
- **Duration**: Depends on table size and dead tuple count
- **Locks**: None (can run concurrently)
- **Best Time**: During low-traffic periods

### REINDEX CONCURRENTLY
- **Impact**: Low
- **Duration**: Longer than regular REINDEX
- **Locks**: None (concurrent operations allowed)
- **Best Time**: Can run anytime

### Partition Creation
- **Impact**: Very Low
- **Duration**: Milliseconds
- **Locks**: Brief metadata lock
- **Best Time**: Anytime

### Statistics Update
- **Impact**: Very Low
- **Duration**: Seconds to minutes
- **Locks**: ShareUpdateExclusiveLock (allows reads/writes)
- **Best Time**: Anytime

## Configuration

### Celery Beat Schedule

Edit `src/celery_app.py` to adjust schedules:

```python
celery_app.conf.beat_schedule = {
    "db-maintenance-vacuum-analyze": {
        "task": "db_maintenance.vacuum_analyze",
        "schedule": 86400.0,  # Adjust frequency (seconds)
    },
    # ... other tasks
}
```

### Maintenance Thresholds

Edit `src/tasks/database_maintenance_tasks.py`:

```python
# Dead tuple cleanup threshold
if dead_tuple_ratio > 20 or dead_tuples > 10000:
    # Run vacuum

# Slow query threshold
WHERE mean_exec_time > 100  # milliseconds

# Unused index criteria
if row[3] == 0 and row[7] > 1024 * 1024:  # 0 scans and > 1MB
    unused_indexes.append(index_info)
```

## Security

- All maintenance endpoints require super admin authentication
- Index dropping requires explicit confirmation
- Partition cleanup has safety limits (min 1 month retention)
- Statistics are cached in Redis with TTL
- Sensitive query data is truncated in logs

## Dependencies

- PostgreSQL 12+
- pg_stat_statements extension
- SQLAlchemy 2.0+
- Celery 5.0+
- Redis 5.0+

## Future Enhancements

- [ ] Automatic index creation based on query patterns
- [ ] Predictive partition creation based on growth trends
- [ ] Integration with monitoring systems (Prometheus, Grafana)
- [ ] Query optimization suggestions using ML
- [ ] Automated table partitioning for other large tables
- [ ] Cost-based maintenance scheduling
- [ ] Historical trend analysis for database metrics
