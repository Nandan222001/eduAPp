# Database Maintenance - Quick Start Guide

## Overview

This guide helps you quickly set up and use the automated database maintenance system.

## Setup (5 minutes)

### 1. Enable pg_stat_statements Extension

Connect to PostgreSQL and run:

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

Or use the API:

```bash
curl -X POST http://localhost:8000/api/v1/database-maintenance/enable-pg-stat-statements \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN"
```

### 2. Configure PostgreSQL

Add to `postgresql.conf`:

```ini
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.track = all
autovacuum = on
```

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

### 3. Start Celery Workers

```bash
# Terminal 1: Start Celery worker
celery -A src.celery_app worker --loglevel=info

# Terminal 2: Start Celery beat scheduler
celery -A src.celery_app beat --loglevel=info
```

## Usage

### Monitor Database Health

```bash
# Get database statistics
curl http://localhost:8000/api/v1/database-maintenance/stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get table sizes
curl http://localhost:8000/api/v1/database-maintenance/table-sizes \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Run Maintenance Tasks

```bash
# Run VACUUM ANALYZE
curl -X POST http://localhost:8000/api/v1/database-maintenance/vacuum-analyze \
  -H "Authorization: Bearer YOUR_TOKEN"

# Cleanup dead tuples
curl -X POST http://localhost:8000/api/v1/database-maintenance/cleanup-dead-tuples \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create partitions
curl -X POST http://localhost:8000/api/v1/database-maintenance/create-partitions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Reports

```bash
# Index recommendations
curl http://localhost:8000/api/v1/database-maintenance/index-recommendations \
  -H "Authorization: Bearer YOUR_TOKEN"

# Slow queries
curl http://localhost:8000/api/v1/database-maintenance/slow-queries \
  -H "Authorization: Bearer YOUR_TOKEN"

# Table bloat
curl http://localhost:8000/api/v1/database-maintenance/table-bloat \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Manage Partitions

```bash
# List existing partitions
curl http://localhost:8000/api/v1/database-maintenance/partitions \
  -H "Authorization: Bearer YOUR_TOKEN"

# Cleanup old partitions (keep last 6 months)
curl -X POST "http://localhost:8000/api/v1/database-maintenance/cleanup-old-partitions?months_to_keep=6" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Automated Schedule

The following tasks run automatically:

| Task | Frequency | What it does |
|------|-----------|--------------|
| VACUUM ANALYZE | Daily | Reclaims space, updates statistics |
| Index Analysis | Weekly | Finds unused indexes |
| Dead Tuple Cleanup | 6 hours | Removes dead tuples |
| Slow Query Logging | Hourly | Logs slow queries |
| Create Partitions | Daily | Creates monthly partitions |
| Table Bloat Report | Weekly | Reports on table sizes |
| Update Statistics | 12 hours | Updates query planner stats |

## Common Operations

### Check Current Maintenance Status

```bash
curl http://localhost:8000/api/v1/database-maintenance/autovacuum-progress \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Find Long Running Queries

```bash
curl "http://localhost:8000/api/v1/database-maintenance/long-running-queries?min_duration_seconds=30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Specific Table Stats

```bash
curl http://localhost:8000/api/v1/database-maintenance/table-stats/attendances \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Find Missing Indexes

```bash
curl "http://localhost:8000/api/v1/database-maintenance/missing-indexes?min_seq_scans=500" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Drop Unused Index

```bash
curl -X DELETE http://localhost:8000/api/v1/database-maintenance/indexes/idx_old_unused_index \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Partitioning Tables

### Convert to Partitioned Tables (One-Time)

**WARNING: Requires maintenance window for large tables**

```bash
# Backup first!
pg_dump -U postgres -d your_database > backup.sql

# Run migration
alembic upgrade partition_001
```

### How Partitions Work

After migration, queries automatically use the correct partition:

```sql
-- This automatically queries the correct month's partition
SELECT * FROM attendances WHERE date BETWEEN '2024-01-01' AND '2024-01-31';
```

Partitions are named:
- `attendances_y2024m01` (January 2024)
- `analytics_events_y2024m02` (February 2024)

## Monitoring & Alerts

### Check Database Health

Key metrics to monitor:

```bash
# Database stats (check cache_hit_ratio - should be >90%)
curl http://localhost:8000/api/v1/database-maintenance/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Review Recommendations Weekly

```bash
# Get all recommendations
curl http://localhost:8000/api/v1/database-maintenance/index-recommendations \
  -H "Authorization: Bearer YOUR_TOKEN"

curl http://localhost:8000/api/v1/database-maintenance/bloat-estimate \
  -H "Authorization: Bearer YOUR_TOKEN"

curl http://localhost:8000/api/v1/database-maintenance/duplicate-indexes \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### Dead Tuple Count is High

```bash
# Run vacuum manually
curl -X POST http://localhost:8000/api/v1/database-maintenance/vacuum-analyze \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Query is Slow

```bash
# Check slow queries
curl http://localhost:8000/api/v1/database-maintenance/slow-queries \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check missing indexes
curl http://localhost:8000/api/v1/database-maintenance/missing-indexes \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Table is Too Large

```bash
# Check table bloat
curl http://localhost:8000/api/v1/database-maintenance/bloat-estimate \
  -H "Authorization: Bearer YOUR_TOKEN"

# Reindex if bloated
curl -X POST http://localhost:8000/api/v1/database-maintenance/reindex \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tables": ["attendances"]}'
```

### Partition Not Created

```bash
# Manually trigger partition creation
curl -X POST http://localhost:8000/api/v1/database-maintenance/create-partitions \
  -H "Authorization: Bearer YOUR_TOKEN"

# List partitions
curl http://localhost:8000/api/v1/database-maintenance/partitions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Best Practices

1. **Monitor Weekly**: Check database stats and reports every week
2. **Review Indexes Quarterly**: Drop unused indexes every 3 months
3. **Backup Before Partitioning**: Always backup before converting to partitioned tables
4. **Use Low-Traffic Periods**: Run manual maintenance during off-peak hours
5. **Keep Statistics Updated**: Let automated tasks run - they're optimized

## Next Steps

- Read [DATABASE_MAINTENANCE.md](DATABASE_MAINTENANCE.md) for detailed documentation
- Configure monitoring alerts for your metrics
- Set up regular backup schedule
- Plan partition retention policy based on compliance needs

## Support

For issues or questions:
- Check Celery logs: `celery -A src.celery_app events`
- Check PostgreSQL logs: `/var/log/postgresql/postgresql-XX-main.log`
- Monitor database with: `SELECT * FROM pg_stat_activity;`
