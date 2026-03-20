"""
Migration execution monitoring and alerting.

This module provides monitoring capabilities for database migrations,
including duration tracking, failure alerting, and performance metrics.
"""
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class MigrationMetrics:
    """Data class for migration metrics."""
    
    def __init__(
        self,
        migration_name: str,
        duration_seconds: float,
        status: str,
        error_message: Optional[str] = None,
        executed_at: Optional[datetime] = None
    ):
        self.migration_name = migration_name
        self.duration_seconds = duration_seconds
        self.status = status
        self.error_message = error_message
        self.executed_at = executed_at or datetime.utcnow()
    
    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return {
            "migration_name": self.migration_name,
            "duration_seconds": self.duration_seconds,
            "status": self.status,
            "error_message": self.error_message,
            "executed_at": self.executed_at.isoformat() if self.executed_at else None
        }


def get_recent_migrations(db: Session, limit: int = 10) -> List[MigrationMetrics]:
    """
    Get recent migration executions from the metrics table.
    
    Args:
        db: Database session
        limit: Maximum number of records to return
        
    Returns:
        List of MigrationMetrics objects
    """
    try:
        result = db.execute(text("""
            SELECT 
                migration_name,
                duration_seconds,
                status,
                error_message,
                executed_at
            FROM migration_execution_metrics
            ORDER BY executed_at DESC
            LIMIT :limit
        """), {"limit": limit})
        
        migrations = []
        for row in result:
            migrations.append(MigrationMetrics(
                migration_name=row[0],
                duration_seconds=row[1],
                status=row[2],
                error_message=row[3],
                executed_at=row[4]
            ))
        
        return migrations
        
    except Exception as e:
        logger.error(f"Failed to get recent migrations: {e}")
        return []


def get_failed_migrations(db: Session, days: int = 7) -> List[MigrationMetrics]:
    """
    Get failed migrations within the specified time window.
    
    Args:
        db: Database session
        days: Number of days to look back
        
    Returns:
        List of failed MigrationMetrics objects
    """
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        result = db.execute(text("""
            SELECT 
                migration_name,
                duration_seconds,
                status,
                error_message,
                executed_at
            FROM migration_execution_metrics
            WHERE status = 'failed'
            AND executed_at >= :cutoff_date
            ORDER BY executed_at DESC
        """), {"cutoff_date": cutoff_date})
        
        migrations = []
        for row in result:
            migrations.append(MigrationMetrics(
                migration_name=row[0],
                duration_seconds=row[1],
                status=row[2],
                error_message=row[3],
                executed_at=row[4]
            ))
        
        return migrations
        
    except Exception as e:
        logger.error(f"Failed to get failed migrations: {e}")
        return []


def get_slow_migrations(db: Session, threshold_seconds: float = 60.0) -> List[MigrationMetrics]:
    """
    Get migrations that exceeded the duration threshold.
    
    Args:
        db: Database session
        threshold_seconds: Duration threshold in seconds
        
    Returns:
        List of slow MigrationMetrics objects
    """
    try:
        result = db.execute(text("""
            SELECT 
                migration_name,
                duration_seconds,
                status,
                error_message,
                executed_at
            FROM migration_execution_metrics
            WHERE duration_seconds > :threshold
            ORDER BY duration_seconds DESC
            LIMIT 20
        """), {"threshold": threshold_seconds})
        
        migrations = []
        for row in result:
            migrations.append(MigrationMetrics(
                migration_name=row[0],
                duration_seconds=row[1],
                status=row[2],
                error_message=row[3],
                executed_at=row[4]
            ))
        
        return migrations
        
    except Exception as e:
        logger.error(f"Failed to get slow migrations: {e}")
        return []


def get_migration_statistics(db: Session) -> Dict:
    """
    Get overall migration statistics.
    
    Args:
        db: Database session
        
    Returns:
        Dictionary with statistics
    """
    try:
        result = db.execute(text("""
            SELECT 
                COUNT(*) as total_executions,
                COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
                AVG(duration_seconds) as avg_duration,
                MAX(duration_seconds) as max_duration,
                MIN(duration_seconds) as min_duration
            FROM migration_execution_metrics
        """)).fetchone()
        
        if result:
            return {
                "total_executions": result[0],
                "successful": result[1],
                "failed": result[2],
                "success_rate": (result[1] / result[0] * 100) if result[0] > 0 else 0,
                "avg_duration_seconds": float(result[3]) if result[3] else 0,
                "max_duration_seconds": float(result[4]) if result[4] else 0,
                "min_duration_seconds": float(result[5]) if result[5] else 0
            }
        
        return {}
        
    except Exception as e:
        logger.error(f"Failed to get migration statistics: {e}")
        return {}


def check_migration_health(db: Session) -> Dict:
    """
    Check overall migration system health.
    
    Args:
        db: Database session
        
    Returns:
        Dictionary with health status
    """
    health = {
        "status": "healthy",
        "issues": []
    }
    
    try:
        # Check for recent failures
        recent_failures = get_failed_migrations(db, days=1)
        if recent_failures:
            health["status"] = "degraded"
            health["issues"].append(f"{len(recent_failures)} failed migrations in last 24 hours")
        
        # Check for slow migrations
        slow_migrations = get_slow_migrations(db, threshold_seconds=300)
        if slow_migrations:
            health["issues"].append(f"{len(slow_migrations)} migrations exceeded 5 minute threshold")
        
        # Get statistics
        stats = get_migration_statistics(db)
        health["statistics"] = stats
        
        # Check success rate
        if stats.get("success_rate", 100) < 95:
            health["status"] = "unhealthy"
            health["issues"].append(f"Low success rate: {stats['success_rate']:.1f}%")
        
        # Add recent migrations
        health["recent_migrations"] = [
            m.to_dict() for m in get_recent_migrations(db, limit=5)
        ]
        
        return health
        
    except Exception as e:
        logger.error(f"Failed to check migration health: {e}")
        return {
            "status": "unknown",
            "error": str(e)
        }


def alert_on_migration_failure(migration_name: str, error_message: str, duration: float):
    """
    Send alerts when a migration fails.
    
    This function should be integrated with your alerting system
    (PagerDuty, Slack, email, etc.)
    
    Args:
        migration_name: Name of the failed migration
        error_message: Error message
        duration: Duration before failure
    """
    logger.error(f"MIGRATION FAILURE ALERT: {migration_name}")
    logger.error(f"Error: {error_message}")
    logger.error(f"Duration: {duration:.2f}s")
    
    try:
        import sentry_sdk
        sentry_sdk.capture_message(
            f"Migration failed: {migration_name}",
            level="error",
            extras={
                "migration_name": migration_name,
                "error_message": error_message,
                "duration_seconds": duration
            }
        )
    except Exception as e:
        logger.warning(f"Failed to send Sentry alert: {e}")


def alert_on_slow_migration(migration_name: str, duration: float, threshold: float):
    """
    Send alerts when a migration is unusually slow.
    
    Args:
        migration_name: Name of the slow migration
        duration: Actual duration
        threshold: Expected threshold
    """
    logger.warning(f"SLOW MIGRATION ALERT: {migration_name}")
    logger.warning(f"Duration: {duration:.2f}s (threshold: {threshold:.2f}s)")
    
    try:
        import sentry_sdk
        sentry_sdk.capture_message(
            f"Slow migration: {migration_name}",
            level="warning",
            extras={
                "migration_name": migration_name,
                "duration_seconds": duration,
                "threshold_seconds": threshold
            }
        )
    except Exception as e:
        logger.warning(f"Failed to send Sentry alert: {e}")


def export_migration_metrics_to_file(db: Session, output_file: str):
    """
    Export migration metrics to a file for analysis.
    
    Args:
        db: Database session
        output_file: Path to output file
    """
    import json
    
    try:
        migrations = get_recent_migrations(db, limit=100)
        
        data = {
            "exported_at": datetime.utcnow().isoformat(),
            "statistics": get_migration_statistics(db),
            "migrations": [m.to_dict() for m in migrations]
        }
        
        with open(output_file, 'w') as f:
            json.dump(data, f, indent=2)
        
        logger.info(f"Exported migration metrics to {output_file}")
        
    except Exception as e:
        logger.error(f"Failed to export migration metrics: {e}")


def cleanup_old_metrics(db: Session, days: int = 90):
    """
    Clean up old migration metrics to prevent table bloat.
    
    Args:
        db: Database session
        days: Keep metrics newer than this many days
    """
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        result = db.execute(text("""
            DELETE FROM migration_execution_metrics
            WHERE executed_at < :cutoff_date
        """), {"cutoff_date": cutoff_date})
        
        db.commit()
        
        deleted_count = result.rowcount
        logger.info(f"Cleaned up {deleted_count} old migration metrics records")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to cleanup old metrics: {e}")
