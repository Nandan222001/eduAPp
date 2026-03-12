# Database Maintenance - Implementation Checklist

## Pre-Implementation Checklist

### Database Preparation
- [ ] PostgreSQL version 12+ installed
- [ ] Sufficient disk space (at least 20% free)
- [ ] Database backup completed
- [ ] Backup verified and can be restored
- [ ] pg_stat_statements extension available

### Environment Setup
- [ ] Redis server running
- [ ] Celery installed (via Poetry)
- [ ] SQLAlchemy 2.0+ installed
- [ ] FastAPI 0.109+ installed
- [ ] All dependencies from pyproject.toml installed

### Access & Permissions
- [ ] Super admin user created in system
- [ ] Database superuser credentials available
- [ ] Redis connection credentials configured
- [ ] .env file configured with DATABASE_URL
- [ ] .env file configured with REDIS_URL

## Installation Checklist

### Step 1: Enable PostgreSQL Extension
- [ ] Connect to PostgreSQL as superuser
- [ ] Run `CREATE EXTENSION IF NOT EXISTS pg_stat_statements;`
- [ ] Verify extension: `SELECT * FROM pg_extension WHERE extname = 'pg_stat_statements';`
- [ ] Or use API endpoint: `POST /database-maintenance/enable-pg-stat-statements`

### Step 2: Configure PostgreSQL
- [ ] Locate postgresql.conf file
- [ ] Add `shared_preload_libraries = 'pg_stat_statements'`
- [ ] Add `pg_stat_statements.track = all`
- [ ] Add `pg_stat_statements.max = 10000`
- [ ] Configure autovacuum settings
- [ ] Restart PostgreSQL service
- [ ] Verify settings: `SHOW shared_preload_libraries;`

### Step 3: Deploy Code
- [ ] Pull latest code with maintenance features
- [ ] Install dependencies: `poetry install`
- [ ] Verify imports work: `python -c "from src.tasks.database_maintenance_tasks import *"`
- [ ] Run database migrations: `alembic upgrade head`
- [ ] Restart FastAPI application

### Step 4: Start Celery Workers
- [ ] Start Celery worker: `celery -A src.celery_app worker --loglevel=info`
- [ ] Verify worker is running
- [ ] Start Celery beat: `celery -A src.celery_app beat --loglevel=info`
- [ ] Verify beat is running
- [ ] Check scheduled tasks appear in logs

## Verification Checklist

### API Endpoints
- [ ] GET /database-maintenance/stats returns 200
- [ ] POST /database-maintenance/vacuum-analyze returns 202
- [ ] GET /database-maintenance/index-recommendations returns data
- [ ] GET /database-maintenance/slow-queries returns data (after 1 hour)
- [ ] GET /database-maintenance/partitions returns empty list initially
- [ ] GET /database-maintenance/table-sizes returns data
- [ ] All endpoints require super admin auth

### Celery Tasks
- [ ] vacuum_analyze task scheduled in beat
- [ ] analyze_index_usage task scheduled in beat
- [ ] cleanup_dead_tuples task scheduled in beat
- [ ] log_slow_queries task scheduled in beat
- [ ] create_partitions task scheduled in beat
- [ ] table_bloat_report task scheduled in beat
- [ ] update_statistics task scheduled in beat

### Database Objects
- [ ] pg_stat_statements extension exists
- [ ] pg_stat_statements collecting data
- [ ] Can query: `SELECT * FROM pg_stat_statements LIMIT 10;`
- [ ] Can query: `SELECT * FROM pg_stat_user_tables;`
- [ ] Can query: `SELECT * FROM pg_stat_user_indexes;`

## Partitioning Migration Checklist (Optional)

### Pre-Migration
- [ ] Complete full database backup
- [ ] Test backup restoration
- [ ] Schedule maintenance window
- [ ] Notify users of downtime
- [ ] Estimate migration time based on table sizes
- [ ] Test migration on staging/dev environment
- [ ] Verify queries work on partitioned tables in test

### Migration Execution
- [ ] Stop application (optional but recommended)
- [ ] Run migration: `alembic upgrade partition_001`
- [ ] Monitor migration progress
- [ ] Verify no errors in migration logs
- [ ] Check partitions created: `\dt+ *_y*` in psql
- [ ] Verify data in partitions
- [ ] Test queries on partitioned tables
- [ ] Start application

### Post-Migration
- [ ] Verify all queries still work
- [ ] Check application logs for errors
- [ ] Monitor query performance
- [ ] Verify automatic partition creation works
- [ ] Test date-range queries on attendance table
- [ ] Test date-range queries on analytics_events table
- [ ] Monitor for 48 hours

## Operational Checklist

### Daily Monitoring
- [ ] Check Celery worker is running
- [ ] Check Celery beat is running
- [ ] Review any task failures in logs
- [ ] Check database size: `GET /database-maintenance/stats`
- [ ] Verify cache hit ratio >85%

### Weekly Monitoring
- [ ] Review index recommendations
- [ ] Review slow query report
- [ ] Check table bloat report
- [ ] Review dead tuple statistics
- [ ] Check partition creation is working
- [ ] Review long-running queries

### Monthly Maintenance
- [ ] Review and drop unused indexes
- [ ] Analyze table growth trends
- [ ] Adjust partition retention if needed
- [ ] Review disk space usage
- [ ] Update maintenance schedules if needed
- [ ] Review autovacuum effectiveness

### Quarterly Review
- [ ] Audit all indexes (drop consistently unused)
- [ ] Review partition strategy effectiveness
- [ ] Analyze slow query trends
- [ ] Update statistics thresholds if needed
- [ ] Review and optimize maintenance schedules
- [ ] Performance testing of queries

## Troubleshooting Checklist

### Celery Issues
- [ ] Check Redis is running: `redis-cli ping`
- [ ] Check worker logs for errors
- [ ] Verify tasks are registered: `celery -A src.celery_app inspect registered`
- [ ] Check task queue: `celery -A src.celery_app inspect active`
- [ ] Restart workers if needed

### PostgreSQL Issues
- [ ] Check PostgreSQL is running: `systemctl status postgresql`
- [ ] Check PostgreSQL logs: `/var/log/postgresql/postgresql-*-main.log`
- [ ] Verify pg_stat_statements is loaded: `SHOW shared_preload_libraries;`
- [ ] Check for locks: `SELECT * FROM pg_locks;`
- [ ] Check autovacuum is running: `SELECT * FROM pg_stat_progress_vacuum;`

### Performance Issues
- [ ] Check cache hit ratio: `GET /database-maintenance/stats`
- [ ] Review slow queries: `GET /database-maintenance/slow-queries`
- [ ] Check for missing indexes: `GET /database-maintenance/missing-indexes`
- [ ] Review table bloat: `GET /database-maintenance/bloat-estimate`
- [ ] Check dead tuple ratio per table

### Partition Issues
- [ ] List all partitions: `GET /database-maintenance/partitions`
- [ ] Check partition dates are correct
- [ ] Verify data in correct partitions: `SELECT tableoid::regclass, COUNT(*) FROM attendances GROUP BY 1;`
- [ ] Check default partition if exists
- [ ] Verify constraint exclusion working: `EXPLAIN SELECT * FROM attendances WHERE date = '2024-01-15';`

## Rollback Checklist

### If Issues Occur
- [ ] Stop Celery workers immediately
- [ ] Document the issue thoroughly
- [ ] Check if rollback is needed
- [ ] If yes, restore from backup
- [ ] Or run downgrade: `alembic downgrade -1`
- [ ] Verify application still works
- [ ] Notify stakeholders
- [ ] Plan corrective actions

### Rollback Partitioning
- [ ] Ensure backup is available
- [ ] Run: `alembic downgrade partition_001`
- [ ] Verify tables converted back
- [ ] Test all queries
- [ ] Monitor for 24 hours
- [ ] Review what went wrong

## Success Criteria

### Technical Metrics
- [ ] All API endpoints responding
- [ ] All Celery tasks executing successfully
- [ ] No errors in application logs
- [ ] Database cache hit ratio >85%
- [ ] Dead tuple ratio <20% on all tables
- [ ] Partition creation working automatically
- [ ] Query performance maintained or improved

### Operational Metrics
- [ ] Zero downtime during implementation (except partition migration)
- [ ] Database maintenance is automated
- [ ] Manual DBA time reduced
- [ ] Clear visibility into database health
- [ ] Actionable recommendations generated
- [ ] Storage space reclaimed

### User Impact
- [ ] No user-reported performance degradation
- [ ] Query response times maintained or improved
- [ ] No data loss or corruption
- [ ] System availability maintained

## Documentation Checklist

- [ ] DATABASE_MAINTENANCE.md reviewed
- [ ] DATABASE_MAINTENANCE_QUICK_START.md reviewed
- [ ] DATABASE_MAINTENANCE_SUMMARY.md reviewed
- [ ] Team trained on new endpoints
- [ ] Runbook created for common issues
- [ ] Monitoring alerts configured
- [ ] Escalation procedures documented

## Sign-Off

- [ ] Development team approval
- [ ] DBA/Operations team approval
- [ ] Security team review (if required)
- [ ] Stakeholder notification complete
- [ ] Production deployment approved
- [ ] Rollback plan confirmed
- [ ] Support team briefed

## Post-Implementation

- [ ] Monitor for 1 week intensively
- [ ] Collect feedback from operations team
- [ ] Tune schedules based on observed patterns
- [ ] Document lessons learned
- [ ] Update procedures based on experience
- [ ] Plan next phase improvements

---

## Notes

**Important**: 
- Always test in development/staging first
- Keep backups before major changes
- Monitor closely after implementation
- Be prepared to rollback if needed
- Document everything

**Timeline**:
- Setup: 30 minutes
- Testing: 1-2 hours
- Partition migration (optional): 1-4 hours depending on data size
- Monitoring period: 1 week

**Support**:
- Check logs first: Celery, PostgreSQL, Application
- Review documentation
- Test on development environment
- Contact DBA if database issues persist
