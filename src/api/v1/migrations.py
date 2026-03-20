"""
API endpoints for migration monitoring and management.

Provides endpoints for:
- Viewing migration status
- Checking migration health
- Viewing migration metrics
- Exporting migration data
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from src.database import get_db
from src.utils.migration_checker import (
    check_migration_status,
    get_current_alembic_version,
    get_latest_migration_version
)
from src.utils.migration_monitoring import (
    get_recent_migrations,
    get_failed_migrations,
    get_slow_migrations,
    get_migration_statistics,
    check_migration_health,
    export_migration_metrics_to_file,
    cleanup_old_metrics
)

router = APIRouter()


@router.get("/migrations/status")
def get_migration_status_endpoint(db: Session = Depends(get_db)):
    """
    Get current migration status.
    
    Returns:
        - is_up_to_date: Whether database is at latest migration
        - current_version: Current migration version in database
        - latest_version: Latest migration version available
        - message: Status message
    """
    is_up_to_date, message = check_migration_status(db)
    
    return {
        "is_up_to_date": is_up_to_date,
        "current_version": get_current_alembic_version(db),
        "latest_version": get_latest_migration_version(),
        "message": message
    }


@router.get("/migrations/health")
def get_migration_health_endpoint(db: Session = Depends(get_db)):
    """
    Get migration system health status.
    
    Returns comprehensive health information including:
    - Overall status (healthy/degraded/unhealthy)
    - Recent failures
    - Slow migrations
    - Statistics
    - Recent migration history
    """
    return check_migration_health(db)


@router.get("/migrations/recent")
def get_recent_migrations_endpoint(
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Get recent migration executions.
    
    Args:
        limit: Number of migrations to return (1-100)
        
    Returns:
        List of recent migrations with execution details
    """
    migrations = get_recent_migrations(db, limit=limit)
    return {
        "count": len(migrations),
        "migrations": [m.to_dict() for m in migrations]
    }


@router.get("/migrations/failed")
def get_failed_migrations_endpoint(
    days: int = Query(7, ge=1, le=90),
    db: Session = Depends(get_db)
):
    """
    Get failed migrations within specified time window.
    
    Args:
        days: Number of days to look back (1-90)
        
    Returns:
        List of failed migrations with error details
    """
    migrations = get_failed_migrations(db, days=days)
    return {
        "count": len(migrations),
        "time_window_days": days,
        "migrations": [m.to_dict() for m in migrations]
    }


@router.get("/migrations/slow")
def get_slow_migrations_endpoint(
    threshold_seconds: float = Query(60.0, ge=1.0),
    db: Session = Depends(get_db)
):
    """
    Get migrations that exceeded duration threshold.
    
    Args:
        threshold_seconds: Duration threshold in seconds
        
    Returns:
        List of slow migrations
    """
    migrations = get_slow_migrations(db, threshold_seconds=threshold_seconds)
    return {
        "count": len(migrations),
        "threshold_seconds": threshold_seconds,
        "migrations": [m.to_dict() for m in migrations]
    }


@router.get("/migrations/statistics")
def get_migration_statistics_endpoint(db: Session = Depends(get_db)):
    """
    Get overall migration execution statistics.
    
    Returns:
        Statistics including total executions, success rate, average duration, etc.
    """
    return get_migration_statistics(db)


@router.post("/migrations/export")
def export_migration_metrics_endpoint(
    output_file: str = Query("migration_metrics.json"),
    db: Session = Depends(get_db)
):
    """
    Export migration metrics to a file.
    
    Args:
        output_file: Path to output file
        
    Returns:
        Success message with file path
    """
    try:
        export_migration_metrics_to_file(db, output_file)
        return {
            "success": True,
            "message": f"Migration metrics exported to {output_file}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/migrations/cleanup")
def cleanup_old_metrics_endpoint(
    days: int = Query(90, ge=30),
    db: Session = Depends(get_db)
):
    """
    Clean up old migration metrics records.
    
    Args:
        days: Keep records newer than this many days (minimum 30)
        
    Returns:
        Success message
    """
    try:
        cleanup_old_metrics(db, days=days)
        return {
            "success": True,
            "message": f"Cleaned up migration metrics older than {days} days"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
