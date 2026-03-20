"""
Migration utilities for safe database operations.

This module provides utilities for:
- Transaction management in migrations
- Migration duration monitoring
- Rollback testing support
"""
import time
import logging
from contextlib import contextmanager
from typing import Optional, Callable
from alembic import op
from sqlalchemy import text

logger = logging.getLogger(__name__)


@contextmanager
def migration_transaction(migration_name: Optional[str] = None):
    """
    Context manager to wrap migration operations in a transaction.
    
    Usage in migration files:
    
        from alembic.migration_utils import migration_transaction
        
        def upgrade() -> None:
            with migration_transaction("add_user_table"):
                op.create_table(...)
                op.create_index(...)
    
    Args:
        migration_name: Optional name for logging purposes
    """
    conn = op.get_bind()
    start_time = time.time()
    
    try:
        # Begin transaction explicitly
        op.execute('BEGIN')
        logger.info(f"Started migration: {migration_name or 'unnamed'}")
        
        yield conn
        
        # Commit transaction
        op.execute('COMMIT')
        duration = time.time() - start_time
        logger.info(f"Completed migration: {migration_name or 'unnamed'} in {duration:.2f}s")
        
    except Exception as e:
        # Rollback on error
        try:
            op.execute('ROLLBACK')
        except:
            pass
        
        duration = time.time() - start_time
        logger.error(f"Failed migration: {migration_name or 'unnamed'} after {duration:.2f}s - {str(e)}")
        raise


def track_migration_duration(migration_name: str) -> Callable:
    """
    Decorator to track migration execution duration.
    
    Usage:
    
        from alembic.migration_utils import track_migration_duration
        
        @track_migration_duration("040_add_feature")
        def upgrade() -> None:
            op.create_table(...)
    
    Args:
        migration_name: Name of the migration for tracking
    """
    def decorator(func: Callable) -> Callable:
        def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                duration = time.time() - start_time
                
                # Log to database if possible
                try:
                    conn = op.get_bind()
                    conn.execute(text("""
                        INSERT INTO migration_execution_metrics 
                        (migration_name, duration_seconds, status, executed_at)
                        VALUES (:name, :duration, 'success', NOW())
                    """), {
                        'name': migration_name,
                        'duration': duration
                    })
                except Exception as e:
                    # If metrics table doesn't exist, just log
                    logger.warning(f"Could not record migration metrics: {e}")
                
                logger.info(f"Migration {migration_name} completed in {duration:.2f}s")
                return result
                
            except Exception as e:
                duration = time.time() - start_time
                
                # Log failure to database if possible
                try:
                    conn = op.get_bind()
                    conn.execute(text("""
                        INSERT INTO migration_execution_metrics 
                        (migration_name, duration_seconds, status, error_message, executed_at)
                        VALUES (:name, :duration, 'failed', :error, NOW())
                    """), {
                        'name': migration_name,
                        'duration': duration,
                        'error': str(e)
                    })
                except:
                    pass
                
                logger.error(f"Migration {migration_name} failed after {duration:.2f}s: {e}")
                raise
        
        return wrapper
    return decorator


def check_table_exists(table_name: str) -> bool:
    """Check if a table exists in the database."""
    conn = op.get_bind()
    result = conn.execute(text(f"""
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = :table_name
        )
    """), {'table_name': table_name}).scalar()
    return bool(result)


def check_column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table."""
    conn = op.get_bind()
    result = conn.execute(text(f"""
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = :table_name 
            AND column_name = :column_name
        )
    """), {'table_name': table_name, 'column_name': column_name}).scalar()
    return bool(result)


def check_constraint_exists(constraint_name: str) -> bool:
    """Check if a constraint exists in the database."""
    conn = op.get_bind()
    result = conn.execute(text(f"""
        SELECT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = :constraint_name
        )
    """), {'constraint_name': constraint_name}).scalar()
    return bool(result)


def check_index_exists(index_name: str) -> bool:
    """Check if an index exists in the database."""
    conn = op.get_bind()
    result = conn.execute(text(f"""
        SELECT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE indexname = :index_name
        )
    """), {'index_name': index_name}).scalar()
    return bool(result)
