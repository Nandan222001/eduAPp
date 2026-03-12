# Performance Monitoring Dashboard - Quick Start Guide

## Overview
This guide will help you quickly set up and start using the comprehensive performance monitoring dashboard.

## Prerequisites
- Python 3.11+
- PostgreSQL running
- Redis running
- Admin/Super Admin account

## Quick Setup

### 1. Install Dependencies
```bash
poetry install
```

### 2. Apply Database Migration
```bash
alembic upgrade head
```

### 3. Start Background Services

**Terminal 1 - Celery Worker:**
```bash
celery -A src.celery_app worker --loglevel=info
```

**Terminal 2 - Celery Beat (Scheduler):**
```bash
celery -A src.celery_app beat --loglevel=info
```

**Terminal 3 - FastAPI Application:**
```bash
uvicorn src.main:app --reload
```

## Quick Access

### Get Dashboard Data
```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "http://localhost:8000/api/v1/admin/performance/dashboard?time_range=last_24_hours"
```

### Dashboard Sections
1. **API Performance** - Response times, error rates, endpoint statistics
2. **Database Performance** - Query times, slow queries, table statistics
3. **Cache Performance** - Hit rates, cache patterns, operation times
4. **Task Queue** - Celery task statistics, execution times
5. **Resources** - CPU, memory, disk, network utilization
6. **Active Users** - Current and historical user activity
7. **Alerts** - Performance degradation warnings

## Key Features

### Real-time Metrics
- API response times tracked automatically
- Database queries monitored via SQLAlchemy events
- Cache operations logged
- Celery tasks tracked
- System resources collected every minute

### Performance Alerts
Automatic alerts for:
- API response time > 3000ms (critical) or > 1000ms (warning)
- Error rate > 15% (critical) or > 5% (warning)
- DB query time > 2000ms (critical) or > 500ms (warning)
- Cache hit rate < 50% (critical) or < 70% (warning)
- CPU usage > 90% (critical) or > 70% (warning)
- Memory usage > 90% (critical) or > 75% (warning)

### Time Ranges
- Last Hour
- Last 24 Hours
- Last 7 Days
- Last 30 Days
- Custom (specify start_time and end_time)

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/v1/admin/performance/dashboard` | Complete dashboard |
| `/api/v1/admin/performance/api` | API metrics only |
| `/api/v1/admin/performance/database` | Database metrics |
| `/api/v1/admin/performance/cache` | Cache metrics |
| `/api/v1/admin/performance/tasks` | Task queue metrics |
| `/api/v1/admin/performance/resources` | Resource utilization |
| `/api/v1/admin/performance/active-users` | Active user stats |
| `/api/v1/admin/performance/alerts` | Performance alerts |

## Example Usage

### Python
```python
import requests

API_URL = "http://localhost:8000/api/v1"
TOKEN = "your_admin_token"

# Get dashboard
response = requests.get(
    f"{API_URL}/admin/performance/dashboard",
    headers={"Authorization": f"Bearer {TOKEN}"},
    params={"time_range": "last_24_hours"}
)

data = response.json()
print(f"Avg Response Time: {data['api_performance']['avg_response_time_ms']}ms")
print(f"Error Rate: {data['api_performance']['error_rate']}%")
print(f"Active Alerts: {data['alerts']['active_alerts']}")
```

### cURL
```bash
# Get slowest endpoints
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:8000/api/v1/admin/performance/api?time_range=last_hour" \
  | jq '.slowest_endpoints[:5]'

# Check active alerts
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:8000/api/v1/admin/performance/alerts?status=active" \
  | jq '.recent_alerts'

# Acknowledge alerts
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"alert_ids": [1, 2, 3]}' \
  "http://localhost:8000/api/v1/admin/performance/alerts/acknowledge"
```

## Monitoring Schedule

The following checks run automatically:
- **Every minute**: Resource utilization monitoring
- **Every 5 minutes**: API, database, and cache performance checks
- **Daily**: Old metrics cleanup (keeps 30 days)

## Dashboard Metrics Explained

### API Performance
- **Total Requests**: All API calls in time period
- **Avg Response Time**: Mean response time across all endpoints
- **Error Rate**: Percentage of requests with 4xx/5xx status
- **Slowest Endpoints**: Top 10 endpoints by avg response time
- **Most Used Endpoints**: Top 10 endpoints by request count

### Database Performance
- **Total Queries**: All database queries executed
- **Avg Query Time**: Mean execution time
- **Slow Queries**: Queries exceeding 500ms threshold
- **Slowest Queries**: Top 10 by execution time
- **Queries by Type**: SELECT, INSERT, UPDATE, DELETE distribution

### Cache Performance
- **Total Operations**: All cache operations
- **Hit Rate**: Percentage of cache hits
- **Avg Operation Time**: Mean cache operation time
- **Stats by Pattern**: Performance grouped by key pattern

### Resource Utilization
- **CPU**: Current, average, and peak CPU usage
- **Memory**: RAM consumption metrics
- **Disk**: Storage utilization
- **Connections**: Active database and network connections
- **Sessions**: Active user sessions

## Troubleshooting

### No metrics appearing
1. Verify middleware is enabled in `src/main.py`
2. Check Celery worker is running
3. Make some API requests to generate data
4. Check database for metric tables

### High database growth
- Metrics are kept for 30 days by default
- Cleanup task runs daily
- Manually run: `celery -A src.celery_app call performance.cleanup_old_metrics`

### Missing alerts
1. Verify Celery Beat is running
2. Check alert thresholds in schemas
3. Review recent metrics to see if thresholds are exceeded

## Next Steps

1. **Customize Thresholds**: Adjust alert thresholds for your environment
2. **Build Dashboard UI**: Create frontend dashboard using the API
3. **Set Up Notifications**: Integrate alerts with notification system
4. **Review Trends**: Analyze weekly/monthly performance trends
5. **Optimize**: Use insights to optimize slow endpoints and queries

## Support

For issues or questions:
1. Check logs in Celery worker and FastAPI application
2. Verify all services are running (PostgreSQL, Redis, Celery)
3. Review the full implementation documentation

## Key Files

- **Models**: `src/models/performance_monitoring.py`
- **API**: `src/api/v1/performance_monitoring.py`
- **Service**: `src/services/performance_monitoring_service.py`
- **Tasks**: `src/tasks/performance_monitoring_tasks.py`
- **Migration**: `alembic/versions/create_performance_monitoring_tables.py`
