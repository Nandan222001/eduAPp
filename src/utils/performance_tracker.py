from datetime import datetime
import time
from typing import Optional
from src.database import SessionLocal
from src.models.performance_monitoring import CacheMetric, TaskQueueMetric


class CachePerformanceTracker:
    """Helper class to track cache operations"""
    
    @staticmethod
    def track_operation(
        cache_key_pattern: str,
        operation: str,
        hit: Optional[bool] = None,
        execution_time_ms: float = 0.0,
        key_size_bytes: int = None,
        value_size_bytes: int = None,
        ttl_seconds: int = None,
        institution_id: int = None,
    ):
        """Track a cache operation"""
        try:
            db = SessionLocal()
            try:
                metric = CacheMetric(
                    cache_key_pattern=cache_key_pattern,
                    operation=operation,
                    hit=hit,
                    execution_time_ms=execution_time_ms,
                    key_size_bytes=key_size_bytes,
                    value_size_bytes=value_size_bytes,
                    ttl_seconds=ttl_seconds,
                    institution_id=institution_id,
                )
                db.add(metric)
                db.commit()
            finally:
                db.close()
        except Exception:
            pass


class TaskQueuePerformanceTracker:
    """Helper class to track Celery task performance"""
    
    @staticmethod
    def track_task(
        task_name: str,
        task_id: str,
        status: str,
        execution_time_ms: float = None,
        queue_wait_time_ms: float = None,
        retries: int = 0,
        worker_name: str = None,
        error_message: str = None,
        institution_id: int = None,
        metadata: dict = None,
    ):
        """Track a Celery task execution"""
        try:
            db = SessionLocal()
            try:
                metric = TaskQueueMetric(
                    task_name=task_name,
                    task_id=task_id,
                    status=status,
                    execution_time_ms=execution_time_ms,
                    queue_wait_time_ms=queue_wait_time_ms,
                    retries=retries,
                    worker_name=worker_name,
                    error_message=error_message,
                    institution_id=institution_id,
                    metadata=metadata,
                )
                db.add(metric)
                db.commit()
            finally:
                db.close()
        except Exception:
            pass


# Decorator to track cache operations
def track_cache_operation(cache_key_pattern: str, operation: str = "get"):
    def decorator(func):
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            hit = None
            value_size = None
            
            try:
                result = await func(*args, **kwargs)
                hit = result is not None
                
                if result and isinstance(result, (str, bytes)):
                    value_size = len(result) if isinstance(result, str) else len(result)
                
                execution_time_ms = (time.time() - start_time) * 1000
                
                CachePerformanceTracker.track_operation(
                    cache_key_pattern=cache_key_pattern,
                    operation=operation,
                    hit=hit,
                    execution_time_ms=execution_time_ms,
                    value_size_bytes=value_size,
                )
                
                return result
            except Exception as e:
                execution_time_ms = (time.time() - start_time) * 1000
                CachePerformanceTracker.track_operation(
                    cache_key_pattern=cache_key_pattern,
                    operation=operation,
                    hit=False,
                    execution_time_ms=execution_time_ms,
                )
                raise
        
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            hit = None
            value_size = None
            
            try:
                result = func(*args, **kwargs)
                hit = result is not None
                
                if result and isinstance(result, (str, bytes)):
                    value_size = len(result) if isinstance(result, str) else len(result)
                
                execution_time_ms = (time.time() - start_time) * 1000
                
                CachePerformanceTracker.track_operation(
                    cache_key_pattern=cache_key_pattern,
                    operation=operation,
                    hit=hit,
                    execution_time_ms=execution_time_ms,
                    value_size_bytes=value_size,
                )
                
                return result
            except Exception as e:
                execution_time_ms = (time.time() - start_time) * 1000
                CachePerformanceTracker.track_operation(
                    cache_key_pattern=cache_key_pattern,
                    operation=operation,
                    hit=False,
                    execution_time_ms=execution_time_ms,
                )
                raise
        
        # Return appropriate wrapper based on whether function is async
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator
