# Database Maintenance System

A comprehensive, automated database maintenance system for PostgreSQL with FastAPI and Celery.

## 🎯 Overview

This system provides automated database maintenance including:
- **VACUUM ANALYZE scheduling** - Reclaim space and update statistics
- **Index usage monitoring** - Identify and remove unused indexes
- **Automatic partitioning** - Monthly partitions for large tables
- **Query performance logging** - Track and log slow queries
- **Dead tuple cleanup** - Automated cleanup of database bloat

## 📚 Documentation

- **[Quick Start Guide](DATABASE_MAINTENANCE_QUICK_START.md)** - Get started in 5 minutes
- **[Complete Documentation](DATABASE_MAINTENANCE.md)** - Detailed reference
- **[Implementation Summary](DATABASE_MAINTENANCE_SUMMARY.md)** - Technical overview
- **[Implementation Checklist](DATABASE_MAINTENANCE_CHECKLIST.md)** - Step-by-step setup

## 🚀 Quick Start

### 1. Prerequisites

```bash
# PostgreSQL 12+ with pg_stat_statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

# Configure postgresql.conf
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.track = all
autovacuum = on
```

### 2. Start Services

```bash
# Start Celery worker
celery -A src.celery_app worker --loglevel=info

# Start Celery beat scheduler
celery -A src.celery_app beat --loglevel=info
```

### 3. Verify Installation

```bash
# Test endpoints (requires super admin token)
python scripts/test_db_maintenance.py --token YOUR_TOKEN
```

## 🔥 Features

### Automated Maintenance Tasks

| Task | Schedule | Purpose |
|------|----------|---------|
| VACUUM ANALYZE | Daily | Reclaim space & update stats |
| Index Analysis | Weekly | Find unused indexes |
| Dead Tuple Cleanup | 6 hours | Remove dead tuples |
| Slow Query Logging | Hourly | Log performance issues |
| Partition Creation | Daily | Create monthly partitions |
| Table Bloat Report | Weekly | Report on table sizes |
| Statistics Update | 12 hours | Update query planner |

### API Endpoints

```bash
# Get database statistics
GET /database-maintenance/stats

# Trigger maintenance operations
POST /database-maintenance/vacuum-analyze
POST /database-maintenance/cleanup-dead-tuples
POST /database-maintenance/create-partitions

# Get reports
GET /database-maintenance/index-recommendations
GET /database-maintenance/slow-queries
GET /database-maintenance/table-bloat

# Manage indexes
GET /database-maintenance/index-stats
DELETE /database-maintenance/indexes/{index_name}

# Monitor partitions
GET /database-maintenance/partitions
POST /database-maintenance/cleanup-old-partitions
```

## 📊 Monitoring

### Database Health Dashboard

```bash
curl http://localhost:8000/api/v1/database-maintenance/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "status": "success",
  "database": {
    "size": "2.5 GB",
    "size_bytes": 2684354560
  },
  "connections": {
    "total": 15,
    "active": 3,
    "idle": 12
  },
  "cache": {
    "cache_hit_ratio": 94.5
  },
  "transactions": {
    "commits": 1245890,
    "rollbacks": 234,
    "commit_ratio": 99.98
  }
}
```

### Index Recommendations

```bash
curl http://localhost:8000/api/v1/database-maintenance/index-recommendations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Identifies:
- Unused indexes (0 scans, >1MB)
- Rarely used indexes (<10 scans, >5MB)

### Slow Query Report

```bash
curl http://localhost:8000/api/v1/database-maintenance/slow-queries \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Shows queries with mean execution time >100ms.

## 🗂️ Table Partitioning

### Automatic Partitioning

Tables are automatically partitioned by month:
- `attendances` - partitioned by `date`
- `analytics_events` - partitioned by `created_at`

**Partition Naming:**
```
attendances_y2024m01     # January 2024
attendances_y2024m02     # February 2024
analytics_events_y2024m01
analytics_events_y2024m02
```

### Benefits

- ✅ Faster queries on date ranges
- ✅ Easier data archival
- ✅ Improved maintenance performance
- ✅ Better query parallelization

### Query Example

```sql
-- Automatically uses correct partition
SELECT * FROM attendances 
WHERE date BETWEEN '2024-01-01' AND '2024-01-31';
```

### Partition Management

```bash
# Create partitions for next 3 months
POST /database-maintenance/create-partitions

# List all partitions
GET /database-maintenance/partitions

# Cleanup old partitions (keep last 12 months)
POST /database-maintenance/cleanup-old-partitions?months_to_keep=12
```

## 🔧 Configuration

### Environment Variables

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
REDIS_URL=redis://localhost:6379/0
```

### Maintenance Configuration

See `config/database_maintenance_config.py` for customization:

```python
from config.database_maintenance_config import config

# Adjust thresholds
config.DEAD_TUPLE_RATIO_THRESHOLD = 20.0
config.SLOW_QUERY_THRESHOLD_MS = 100

# Configure schedules
config.CELERY_SCHEDULES['vacuum_analyze'] = 86400.0  # Daily
```

## 🛠️ Maintenance Operations

### Manual VACUUM

```bash
curl -X POST http://localhost:8000/api/v1/database-maintenance/vacuum-analyze \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Reindex Tables

```bash
curl -X POST http://localhost:8000/api/v1/database-maintenance/reindex \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tables": ["attendances", "analytics_events"]}'
```

### Drop Unused Index

```bash
curl -X DELETE http://localhost:8000/api/v1/database-maintenance/indexes/idx_unused \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📈 Performance Impact

### Low Impact Operations
- ✅ VACUUM ANALYZE (no locks)
- ✅ Index analysis (read-only)
- ✅ Statistics updates
- ✅ REINDEX CONCURRENTLY (no locks)

### Scheduled During Low Traffic
All maintenance tasks are scheduled to minimize impact on production.

## 🔐 Security

- All endpoints require **super admin** authentication
- SQL injection prevention via parameterized queries
- Rate limiting on all API endpoints
- Audit logging of all maintenance operations

## 🐛 Troubleshooting

### High Dead Tuple Count

```bash
# Check dead tuples
curl http://localhost:8000/api/v1/database-maintenance/table-stats/TABLE_NAME \
  -H "Authorization: Bearer YOUR_TOKEN"

# Trigger cleanup
curl -X POST http://localhost:8000/api/v1/database-maintenance/cleanup-dead-tuples \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Slow Queries

```bash
# Get slow query report
curl http://localhost:8000/api/v1/database-maintenance/slow-queries \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check for missing indexes
curl http://localhost:8000/api/v1/database-maintenance/missing-indexes \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Table Bloat

```bash
# Get bloat estimate
curl http://localhost:8000/api/v1/database-maintenance/bloat-estimate \
  -H "Authorization: Bearer YOUR_TOKEN"

# Reindex bloated tables
curl -X POST http://localhost:8000/api/v1/database-maintenance/reindex \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Check Celery Status

```bash
# View registered tasks
celery -A src.celery_app inspect registered

# View active tasks
celery -A src.celery_app inspect active

# View scheduled tasks
celery -A src.celery_app inspect scheduled
```

## 📦 Components

### Backend Files
- `src/tasks/database_maintenance_tasks.py` - Celery tasks
- `src/services/database_maintenance_service.py` - Service layer
- `src/repositories/database_maintenance_repository.py` - Data access
- `src/api/v1/database_maintenance.py` - REST API endpoints
- `src/schemas/database_maintenance.py` - Pydantic models

### Configuration
- `config/database_maintenance_config.py` - Settings
- `src/celery_app.py` - Celery configuration

### Database
- `alembic/versions/convert_to_partitioned_tables.py` - Partitioning migration

### Scripts
- `scripts/test_db_maintenance.py` - Test suite

## 🧪 Testing

```bash
# Run test suite
python scripts/test_db_maintenance.py --token YOUR_SUPER_ADMIN_TOKEN

# Test specific endpoint
curl -X GET http://localhost:8000/api/v1/database-maintenance/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📝 Best Practices

1. **Monitor Weekly** - Check stats and reports regularly
2. **Review Indexes Quarterly** - Drop unused indexes every 3 months
3. **Backup Before Partitioning** - Always backup before converting tables
4. **Use Off-Peak Hours** - Schedule manual maintenance during low traffic
5. **Keep Statistics Updated** - Let automated tasks run as scheduled

## 🔄 Upgrade Path

### For Existing Databases

1. Enable pg_stat_statements
2. Run for 1 week to collect data
3. Review recommendations
4. Schedule maintenance window for partitioning
5. Run partition migration
6. Monitor for 48 hours

### For New Databases

1. Enable pg_stat_statements from start
2. Create tables as partitioned initially
3. Enable all automated tasks
4. Monitor weekly reports

## 📞 Support

### Logs
- Celery: `celery -A src.celery_app events`
- PostgreSQL: `/var/log/postgresql/postgresql-XX-main.log`
- Application: Check FastAPI logs

### Common Issues
- See [Troubleshooting](#-troubleshooting) section
- Check [DATABASE_MAINTENANCE.md](DATABASE_MAINTENANCE.md) for detailed guides
- Review [DATABASE_MAINTENANCE_CHECKLIST.md](DATABASE_MAINTENANCE_CHECKLIST.md)

## 📄 License

This is part of the FastAPI application. See main project LICENSE.

## 🤝 Contributing

1. Test thoroughly on development environment
2. Follow existing code patterns
3. Update documentation
4. Add tests for new features

## 🎉 Acknowledgments

Built with:
- FastAPI - Web framework
- Celery - Task queue
- PostgreSQL - Database
- SQLAlchemy - ORM
- Redis - Cache and broker
