from datetime import datetime, timedelta
from celery import Task
from celery.signals import task_prerun, task_postrun, task_failure
from src.celery_app import celery_app
from src.database import SessionLocal
from src.models.performance_monitoring import PerformanceAlert, AlertSeverity
from src.services.performance_monitoring_service import PerformanceMonitoringService
from src.utils.performance_tracker import TaskQueuePerformanceTracker
import time


# Store task start times
task_start_times = {}


@task_prerun.connect
def task_prerun_handler(sender=None, task_id=None, task=None, args=None, kwargs=None, **extra):
    """Called before task execution"""
    task_start_times[task_id] = {
        'start_time': time.time(),
        'task_name': sender.name if sender else task.name if task else 'unknown',
    }


@task_postrun.connect
def task_postrun_handler(sender=None, task_id=None, task=None, args=None, kwargs=None, retval=None, **extra):
    """Called after successful task execution"""
    if task_id in task_start_times:
        start_info = task_start_times.pop(task_id)
        execution_time_ms = (time.time() - start_info['start_time']) * 1000
        
        TaskQueuePerformanceTracker.track_task(
            task_name=start_info['task_name'],
            task_id=task_id,
            status='SUCCESS',
            execution_time_ms=execution_time_ms,
            retries=task.request.retries if task and hasattr(task, 'request') else 0,
        )


@task_failure.connect
def task_failure_handler(sender=None, task_id=None, exception=None, args=None, kwargs=None, traceback=None, einfo=None, **extra):
    """Called when task fails"""
    if task_id in task_start_times:
        start_info = task_start_times.pop(task_id)
        execution_time_ms = (time.time() - start_info['start_time']) * 1000
        
        TaskQueuePerformanceTracker.track_task(
            task_name=start_info['task_name'],
            task_id=task_id,
            status='FAILURE',
            execution_time_ms=execution_time_ms,
            error_message=str(exception) if exception else None,
        )


@celery_app.task(name="performance.check_api_performance")
def check_api_performance_degradation():
    """Check for API performance degradation and create alerts"""
    db = SessionLocal()
    try:
        service = PerformanceMonitoringService(db)
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(minutes=15)
        
        api_performance = service.get_api_performance(start_time, end_time)
        
        # Check average response time
        if api_performance.avg_response_time_ms > service.thresholds.api_response_time_critical_ms:
            service.create_alert(
                alert_type="api_response_time",
                severity=AlertSeverity.CRITICAL,
                title="Critical API Response Time",
                description=f"Average API response time is {api_performance.avg_response_time_ms}ms, exceeding critical threshold of {service.thresholds.api_response_time_critical_ms}ms",
                metric_value=api_performance.avg_response_time_ms,
                threshold_value=service.thresholds.api_response_time_critical_ms,
            )
        elif api_performance.avg_response_time_ms > service.thresholds.api_response_time_warning_ms:
            service.create_alert(
                alert_type="api_response_time",
                severity=AlertSeverity.MEDIUM,
                title="High API Response Time",
                description=f"Average API response time is {api_performance.avg_response_time_ms}ms, exceeding warning threshold of {service.thresholds.api_response_time_warning_ms}ms",
                metric_value=api_performance.avg_response_time_ms,
                threshold_value=service.thresholds.api_response_time_warning_ms,
            )
        
        # Check error rate
        if api_performance.error_rate > service.thresholds.api_error_rate_critical * 100:
            service.create_alert(
                alert_type="api_error_rate",
                severity=AlertSeverity.CRITICAL,
                title="Critical API Error Rate",
                description=f"API error rate is {api_performance.error_rate}%, exceeding critical threshold of {service.thresholds.api_error_rate_critical * 100}%",
                metric_value=api_performance.error_rate,
                threshold_value=service.thresholds.api_error_rate_critical * 100,
            )
        elif api_performance.error_rate > service.thresholds.api_error_rate_warning * 100:
            service.create_alert(
                alert_type="api_error_rate",
                severity=AlertSeverity.MEDIUM,
                title="High API Error Rate",
                description=f"API error rate is {api_performance.error_rate}%, exceeding warning threshold of {service.thresholds.api_error_rate_warning * 100}%",
                metric_value=api_performance.error_rate,
                threshold_value=service.thresholds.api_error_rate_warning * 100,
            )
    finally:
        db.close()


@celery_app.task(name="performance.check_database_performance")
def check_database_performance_degradation():
    """Check for database performance degradation and create alerts"""
    db = SessionLocal()
    try:
        service = PerformanceMonitoringService(db)
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(minutes=15)
        
        db_performance = service.get_database_performance(start_time, end_time)
        
        # Check average query time
        if db_performance.avg_query_time_ms > service.thresholds.db_query_time_critical_ms:
            service.create_alert(
                alert_type="database_query_time",
                severity=AlertSeverity.CRITICAL,
                title="Critical Database Query Time",
                description=f"Average database query time is {db_performance.avg_query_time_ms}ms, exceeding critical threshold of {service.thresholds.db_query_time_critical_ms}ms",
                metric_value=db_performance.avg_query_time_ms,
                threshold_value=service.thresholds.db_query_time_critical_ms,
            )
        elif db_performance.avg_query_time_ms > service.thresholds.db_query_time_warning_ms:
            service.create_alert(
                alert_type="database_query_time",
                severity=AlertSeverity.MEDIUM,
                title="High Database Query Time",
                description=f"Average database query time is {db_performance.avg_query_time_ms}ms, exceeding warning threshold of {service.thresholds.db_query_time_warning_ms}ms",
                metric_value=db_performance.avg_query_time_ms,
                threshold_value=service.thresholds.db_query_time_warning_ms,
            )
        
        # Check slow queries
        if db_performance.slow_queries_count > 10:
            service.create_alert(
                alert_type="slow_queries",
                severity=AlertSeverity.MEDIUM,
                title="High Number of Slow Queries",
                description=f"Detected {db_performance.slow_queries_count} slow queries in the last 15 minutes",
                metric_value=float(db_performance.slow_queries_count),
            )
    finally:
        db.close()


@celery_app.task(name="performance.check_cache_performance")
def check_cache_performance_degradation():
    """Check for cache performance degradation and create alerts"""
    db = SessionLocal()
    try:
        service = PerformanceMonitoringService(db)
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(minutes=15)
        
        cache_performance = service.get_cache_performance(start_time, end_time)
        
        # Check cache hit rate
        if cache_performance.overall_hit_rate < service.thresholds.cache_hit_rate_critical * 100:
            service.create_alert(
                alert_type="cache_hit_rate",
                severity=AlertSeverity.CRITICAL,
                title="Critical Cache Hit Rate",
                description=f"Cache hit rate is {cache_performance.overall_hit_rate}%, below critical threshold of {service.thresholds.cache_hit_rate_critical * 100}%",
                metric_value=cache_performance.overall_hit_rate,
                threshold_value=service.thresholds.cache_hit_rate_critical * 100,
            )
        elif cache_performance.overall_hit_rate < service.thresholds.cache_hit_rate_warning * 100:
            service.create_alert(
                alert_type="cache_hit_rate",
                severity=AlertSeverity.MEDIUM,
                title="Low Cache Hit Rate",
                description=f"Cache hit rate is {cache_performance.overall_hit_rate}%, below warning threshold of {service.thresholds.cache_hit_rate_warning * 100}%",
                metric_value=cache_performance.overall_hit_rate,
                threshold_value=service.thresholds.cache_hit_rate_warning * 100,
            )
    finally:
        db.close()


@celery_app.task(name="performance.check_resource_utilization")
def check_resource_utilization():
    """Check for resource utilization issues and create alerts"""
    db = SessionLocal()
    try:
        service = PerformanceMonitoringService(db)
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(minutes=5)
        
        resource_util = service.get_resource_utilization(start_time, end_time)
        
        # Check CPU usage
        if resource_util.current_cpu_percent > service.thresholds.cpu_usage_critical:
            service.create_alert(
                alert_type="cpu_usage",
                severity=AlertSeverity.CRITICAL,
                title="Critical CPU Usage",
                description=f"CPU usage is {resource_util.current_cpu_percent}%, exceeding critical threshold of {service.thresholds.cpu_usage_critical}%",
                metric_value=resource_util.current_cpu_percent,
                threshold_value=service.thresholds.cpu_usage_critical,
            )
        elif resource_util.current_cpu_percent > service.thresholds.cpu_usage_warning:
            service.create_alert(
                alert_type="cpu_usage",
                severity=AlertSeverity.MEDIUM,
                title="High CPU Usage",
                description=f"CPU usage is {resource_util.current_cpu_percent}%, exceeding warning threshold of {service.thresholds.cpu_usage_warning}%",
                metric_value=resource_util.current_cpu_percent,
                threshold_value=service.thresholds.cpu_usage_warning,
            )
        
        # Check memory usage
        if resource_util.current_memory_percent > service.thresholds.memory_usage_critical:
            service.create_alert(
                alert_type="memory_usage",
                severity=AlertSeverity.CRITICAL,
                title="Critical Memory Usage",
                description=f"Memory usage is {resource_util.current_memory_percent}%, exceeding critical threshold of {service.thresholds.memory_usage_critical}%",
                metric_value=resource_util.current_memory_percent,
                threshold_value=service.thresholds.memory_usage_critical,
            )
        elif resource_util.current_memory_percent > service.thresholds.memory_usage_warning:
            service.create_alert(
                alert_type="memory_usage",
                severity=AlertSeverity.MEDIUM,
                title="High Memory Usage",
                description=f"Memory usage is {resource_util.current_memory_percent}%, exceeding warning threshold of {service.thresholds.memory_usage_warning}%",
                metric_value=resource_util.current_memory_percent,
                threshold_value=service.thresholds.memory_usage_warning,
            )
        
        # Check disk usage
        if resource_util.current_disk_percent > service.thresholds.disk_usage_critical:
            service.create_alert(
                alert_type="disk_usage",
                severity=AlertSeverity.CRITICAL,
                title="Critical Disk Usage",
                description=f"Disk usage is {resource_util.current_disk_percent}%, exceeding critical threshold of {service.thresholds.disk_usage_critical}%",
                metric_value=resource_util.current_disk_percent,
                threshold_value=service.thresholds.disk_usage_critical,
            )
        elif resource_util.current_disk_percent > service.thresholds.disk_usage_warning:
            service.create_alert(
                alert_type="disk_usage",
                severity=AlertSeverity.MEDIUM,
                title="High Disk Usage",
                description=f"Disk usage is {resource_util.current_disk_percent}%, exceeding warning threshold of {service.thresholds.disk_usage_warning}%",
                metric_value=resource_util.current_disk_percent,
                threshold_value=service.thresholds.disk_usage_warning,
            )
    finally:
        db.close()


@celery_app.task(name="performance.cleanup_old_metrics")
def cleanup_old_performance_metrics():
    """Clean up old performance metrics to prevent database bloat"""
    from src.models.performance_monitoring import (
        APIPerformanceMetric,
        DatabaseQueryMetric,
        CacheMetric,
        TaskQueueMetric,
        ResourceUtilizationMetric,
    )
    
    db = SessionLocal()
    try:
        # Keep metrics for 30 days
        cutoff_date = datetime.utcnow() - timedelta(days=30)
        
        db.query(APIPerformanceMetric).filter(
            APIPerformanceMetric.timestamp < cutoff_date
        ).delete(synchronize_session=False)
        
        db.query(DatabaseQueryMetric).filter(
            DatabaseQueryMetric.timestamp < cutoff_date
        ).delete(synchronize_session=False)
        
        db.query(CacheMetric).filter(
            CacheMetric.timestamp < cutoff_date
        ).delete(synchronize_session=False)
        
        db.query(TaskQueueMetric).filter(
            TaskQueueMetric.timestamp < cutoff_date
        ).delete(synchronize_session=False)
        
        db.query(ResourceUtilizationMetric).filter(
            ResourceUtilizationMetric.timestamp < cutoff_date
        ).delete(synchronize_session=False)
        
        db.commit()
    finally:
        db.close()
