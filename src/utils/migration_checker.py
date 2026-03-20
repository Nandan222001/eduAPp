"""
Migration version checker for application startup.

This module checks if the database is at the latest migration version
and warns if migrations are pending.
"""
import logging
from typing import Optional, Tuple
from sqlalchemy import text, Engine
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class MigrationVersionError(Exception):
    """Raised when there's an issue checking migration versions."""
    pass


def get_current_alembic_version(db: Session) -> Optional[str]:
    """
    Get the current alembic version from the database.
    
    Args:
        db: Database session
        
    Returns:
        Current version string or None if not found
    """
    try:
        result = db.execute(text("SELECT version_num FROM alembic_version"))
        row = result.fetchone()
        return row[0] if row else None
    except Exception as e:
        logger.error(f"Failed to get current alembic version: {e}")
        return None


def get_latest_migration_version() -> Optional[str]:
    """
    Get the latest migration version from migration files.
    
    Returns:
        Latest version string or None if not found
    """
    try:
        from alembic.config import Config
        from alembic.script import ScriptDirectory
        
        # Load alembic config
        alembic_cfg = Config("alembic.ini")
        script = ScriptDirectory.from_config(alembic_cfg)
        
        # Get head revision
        head = script.get_current_head()
        return head
        
    except Exception as e:
        logger.error(f"Failed to get latest migration version: {e}")
        return None


def check_migration_status(db: Session) -> Tuple[bool, str]:
    """
    Check if the database is at the latest migration version.
    
    Args:
        db: Database session
        
    Returns:
        Tuple of (is_up_to_date, message)
    """
    try:
        current_version = get_current_alembic_version(db)
        latest_version = get_latest_migration_version()
        
        if current_version is None:
            return False, "No alembic version found in database. Database may not be initialized."
        
        if latest_version is None:
            return False, "Could not determine latest migration version from files."
        
        if current_version != latest_version:
            return False, f"Database is not at latest migration. Current: {current_version}, Latest: {latest_version}"
        
        return True, f"Database is at latest migration version: {current_version}"
        
    except Exception as e:
        logger.error(f"Error checking migration status: {e}")
        return False, f"Error checking migration status: {str(e)}"


def warn_if_migrations_pending(db: Session, fail_on_pending: bool = False) -> None:
    """
    Check for pending migrations and log a warning or raise an error.
    
    Args:
        db: Database session
        fail_on_pending: If True, raise an exception instead of just warning
        
    Raises:
        MigrationVersionError: If fail_on_pending is True and migrations are pending
    """
    is_up_to_date, message = check_migration_status(db)
    
    if not is_up_to_date:
        if fail_on_pending:
            logger.error(f"MIGRATION ERROR: {message}")
            raise MigrationVersionError(message)
        else:
            logger.warning(f"MIGRATION WARNING: {message}")
            logger.warning("Please run 'alembic upgrade head' to apply pending migrations.")
    else:
        logger.info(message)


def get_migration_health_check() -> dict:
    """
    Get migration health check information for health endpoints.
    
    Returns:
        Dictionary with migration status information
    """
    from src.database import SessionLocal
    
    db = SessionLocal()
    try:
        is_up_to_date, message = check_migration_status(db)
        
        return {
            "migrations_up_to_date": is_up_to_date,
            "current_version": get_current_alembic_version(db),
            "latest_version": get_latest_migration_version(),
            "message": message
        }
    except Exception as e:
        return {
            "migrations_up_to_date": False,
            "error": str(e),
            "message": "Failed to check migration status"
        }
    finally:
        db.close()
