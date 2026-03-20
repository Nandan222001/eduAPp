"""
Data integrity verification script.

This script performs comprehensive data integrity checks after migrations
to ensure no data corruption or loss occurred.

Usage:
    python scripts/migration_test/verify_data_integrity.py
    python scripts/migration_test/verify_data_integrity.py --verbose
"""
import argparse
import sys
import logging
from typing import List, Dict, Tuple
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class IntegrityCheckError(Exception):
    """Raised when an integrity check fails."""
    pass


def get_database_connection():
    """Get database connection from environment."""
    from src.config import settings
    engine = create_engine(settings.database_url)
    Session = sessionmaker(bind=engine)
    return Session()


def check_alembic_version(db) -> Tuple[bool, str]:
    """
    Check if alembic_version table exists and has a version.
    
    Returns:
        Tuple of (success, message)
    """
    try:
        result = db.execute(text("SELECT version_num FROM alembic_version"))
        version = result.fetchone()
        
        if version:
            logger.info(f"✓ Alembic version: {version[0]}")
            return True, f"Alembic version: {version[0]}"
        else:
            logger.error("✗ No alembic version found")
            return False, "No alembic version found"
            
    except Exception as e:
        logger.error(f"✗ Failed to check alembic version: {e}")
        return False, str(e)


def check_foreign_key_integrity(db) -> Tuple[bool, List[str]]:
    """
    Check for orphaned records (foreign key violations).
    
    Returns:
        Tuple of (success, list of issues)
    """
    logger.info("Checking foreign key integrity...")
    issues = []
    
    try:
        # Get all foreign key constraints
        result = db.execute(text("""
            SELECT
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
        """))
        
        foreign_keys = result.fetchall()
        
        for fk in foreign_keys:
            table_name = fk[0]
            column_name = fk[1]
            foreign_table = fk[2]
            foreign_column = fk[3]
            
            # Check for orphaned records
            orphan_check = db.execute(text(f"""
                SELECT COUNT(*)
                FROM {table_name} t
                LEFT JOIN {foreign_table} f ON t.{column_name} = f.{foreign_column}
                WHERE t.{column_name} IS NOT NULL
                AND f.{foreign_column} IS NULL
            """))
            
            orphan_count = orphan_check.scalar()
            
            if orphan_count > 0:
                issue = f"Found {orphan_count} orphaned records in {table_name}.{column_name} -> {foreign_table}.{foreign_column}"
                logger.warning(f"⚠ {issue}")
                issues.append(issue)
        
        if not issues:
            logger.info("✓ Foreign key integrity check passed")
            return True, []
        else:
            logger.error(f"✗ Found {len(issues)} foreign key issues")
            return False, issues
            
    except Exception as e:
        logger.error(f"✗ Failed to check foreign key integrity: {e}")
        return False, [str(e)]


def check_not_null_constraints(db) -> Tuple[bool, List[str]]:
    """
    Check for NULL values in NOT NULL columns.
    
    Returns:
        Tuple of (success, list of issues)
    """
    logger.info("Checking NOT NULL constraints...")
    issues = []
    
    try:
        # Get all NOT NULL columns
        result = db.execute(text("""
            SELECT table_name, column_name
            FROM information_schema.columns
            WHERE is_nullable = 'NO'
            AND table_schema = 'public'
            AND table_name NOT LIKE 'pg_%'
        """))
        
        not_null_columns = result.fetchall()
        
        for table_name, column_name in not_null_columns:
            # Check for NULL values (shouldn't exist but checking anyway)
            null_check = db.execute(text(f"""
                SELECT COUNT(*)
                FROM {table_name}
                WHERE {column_name} IS NULL
            """))
            
            null_count = null_check.scalar()
            
            if null_count > 0:
                issue = f"Found {null_count} NULL values in NOT NULL column {table_name}.{column_name}"
                logger.error(f"✗ {issue}")
                issues.append(issue)
        
        if not issues:
            logger.info("✓ NOT NULL constraints check passed")
            return True, []
        else:
            logger.error(f"✗ Found {len(issues)} NOT NULL constraint violations")
            return False, issues
            
    except Exception as e:
        logger.error(f"✗ Failed to check NOT NULL constraints: {e}")
        return False, [str(e)]


def check_unique_constraints(db) -> Tuple[bool, List[str]]:
    """
    Check for duplicate values in UNIQUE columns.
    
    Returns:
        Tuple of (success, list of issues)
    """
    logger.info("Checking UNIQUE constraints...")
    issues = []
    
    try:
        # Get all unique constraints
        result = db.execute(text("""
            SELECT
                tc.table_name,
                kcu.column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.constraint_type = 'UNIQUE'
            AND tc.table_schema = 'public'
        """))
        
        unique_columns = result.fetchall()
        
        for table_name, column_name in unique_columns:
            # Check for duplicates
            dup_check = db.execute(text(f"""
                SELECT {column_name}, COUNT(*)
                FROM {table_name}
                GROUP BY {column_name}
                HAVING COUNT(*) > 1
            """))
            
            duplicates = dup_check.fetchall()
            
            if duplicates:
                issue = f"Found {len(duplicates)} duplicate values in UNIQUE column {table_name}.{column_name}"
                logger.error(f"✗ {issue}")
                issues.append(issue)
        
        if not issues:
            logger.info("✓ UNIQUE constraints check passed")
            return True, []
        else:
            logger.error(f"✗ Found {len(issues)} UNIQUE constraint violations")
            return False, issues
            
    except Exception as e:
        logger.error(f"✗ Failed to check UNIQUE constraints: {e}")
        return False, [str(e)]


def check_critical_tables_exist(db, tables: List[str]) -> Tuple[bool, List[str]]:
    """
    Check if critical tables exist.
    
    Args:
        db: Database session
        tables: List of table names to check
        
    Returns:
        Tuple of (success, list of missing tables)
    """
    logger.info("Checking critical tables...")
    missing = []
    
    for table_name in tables:
        try:
            result = db.execute(text(f"""
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_name = '{table_name}'
                )
            """))
            
            exists = result.scalar()
            
            if not exists:
                logger.error(f"✗ Table missing: {table_name}")
                missing.append(table_name)
            else:
                logger.info(f"✓ Table exists: {table_name}")
                
        except Exception as e:
            logger.error(f"✗ Failed to check table {table_name}: {e}")
            missing.append(table_name)
    
    if not missing:
        logger.info("✓ All critical tables exist")
        return True, []
    else:
        logger.error(f"✗ {len(missing)} critical tables missing")
        return False, missing


def check_record_counts(db, min_counts: Dict[str, int]) -> Tuple[bool, List[str]]:
    """
    Check if tables have expected minimum record counts.
    
    Args:
        db: Database session
        min_counts: Dictionary of {table_name: min_count}
        
    Returns:
        Tuple of (success, list of issues)
    """
    logger.info("Checking record counts...")
    issues = []
    
    for table_name, min_count in min_counts.items():
        try:
            result = db.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
            count = result.scalar()
            
            if count < min_count:
                issue = f"Table {table_name} has {count} records (expected >= {min_count})"
                logger.warning(f"⚠ {issue}")
                issues.append(issue)
            else:
                logger.info(f"✓ Table {table_name}: {count} records")
                
        except Exception as e:
            logger.error(f"✗ Failed to check {table_name}: {e}")
            issues.append(str(e))
    
    if not issues:
        logger.info("✓ Record count checks passed")
        return True, []
    else:
        logger.warning(f"⚠ Found {len(issues)} record count warnings")
        return True, issues  # Warnings, not failures


def check_indexes_exist(db, indexes: List[str]) -> Tuple[bool, List[str]]:
    """
    Check if critical indexes exist.
    
    Args:
        db: Database session
        indexes: List of index names to check
        
    Returns:
        Tuple of (success, list of missing indexes)
    """
    logger.info("Checking indexes...")
    missing = []
    
    for index_name in indexes:
        try:
            result = db.execute(text(f"""
                SELECT EXISTS (
                    SELECT 1 FROM pg_indexes
                    WHERE indexname = '{index_name}'
                )
            """))
            
            exists = result.scalar()
            
            if not exists:
                logger.warning(f"⚠ Index missing: {index_name}")
                missing.append(index_name)
            else:
                logger.info(f"✓ Index exists: {index_name}")
                
        except Exception as e:
            logger.error(f"✗ Failed to check index {index_name}: {e}")
            missing.append(index_name)
    
    if not missing:
        logger.info("✓ All indexes exist")
        return True, []
    else:
        logger.warning(f"⚠ {len(missing)} indexes missing")
        return True, missing  # Missing indexes are warnings, not failures


def run_all_checks(verbose: bool = False) -> bool:
    """
    Run all integrity checks.
    
    Args:
        verbose: Print detailed output
        
    Returns:
        True if all checks pass
    """
    logger.info("="*60)
    logger.info("Starting data integrity verification")
    logger.info("="*60)
    
    db = get_database_connection()
    all_passed = True
    
    try:
        # Critical tables that must exist
        critical_tables = [
            'alembic_version',
            'institutions',
            'users',
            'migration_execution_metrics'
        ]
        
        # Critical indexes
        critical_indexes = [
            'ix_users_email',
            'ix_users_institution_id',
        ]
        
        # Minimum expected record counts (adjust based on your data)
        min_counts = {
            # 'institutions': 1,  # Uncomment if you expect data
        }
        
        # Run checks
        checks = [
            ("Alembic Version", check_alembic_version(db)),
            ("Critical Tables", check_critical_tables_exist(db, critical_tables)),
            ("Foreign Key Integrity", check_foreign_key_integrity(db)),
            ("NOT NULL Constraints", check_not_null_constraints(db)),
            ("UNIQUE Constraints", check_unique_constraints(db)),
            ("Indexes", check_indexes_exist(db, critical_indexes)),
        ]
        
        if min_counts:
            checks.append(("Record Counts", check_record_counts(db, min_counts)))
        
        # Summarize results
        logger.info("\n" + "="*60)
        logger.info("INTEGRITY CHECK SUMMARY")
        logger.info("="*60)
        
        for check_name, (passed, details) in checks:
            status = "✓ PASS" if passed else "✗ FAIL"
            logger.info(f"{status} - {check_name}")
            
            if not passed:
                all_passed = False
                
            if verbose and details:
                if isinstance(details, list):
                    for detail in details:
                        logger.info(f"  - {detail}")
                else:
                    logger.info(f"  - {details}")
        
        logger.info("="*60)
        
        if all_passed:
            logger.info("✅ All integrity checks PASSED")
            return True
        else:
            logger.error("❌ Some integrity checks FAILED")
            return False
            
    except Exception as e:
        logger.error(f"✗ Integrity verification failed: {e}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        db.close()


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Verify database integrity after migrations"
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Show detailed output"
    )
    
    args = parser.parse_args()
    
    success = run_all_checks(verbose=args.verbose)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
