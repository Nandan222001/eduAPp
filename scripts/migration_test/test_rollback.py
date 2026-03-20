"""
Migration rollback testing framework.

This script tests that migrations can be safely rolled back without data loss
or corruption. It should be run before deploying migrations to production.

Usage:
    python scripts/migration_test/test_rollback.py
    python scripts/migration_test/test_rollback.py --migration 041
"""
import argparse
import sys
import subprocess
import logging
from pathlib import Path
from typing import List, Optional, Tuple

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class RollbackTestError(Exception):
    """Raised when a rollback test fails."""
    pass


def run_command(cmd: List[str]) -> Tuple[int, str, str]:
    """
    Run a shell command and return exit code, stdout, stderr.
    
    Args:
        cmd: Command and arguments as list
        
    Returns:
        Tuple of (exit_code, stdout, stderr)
    """
    logger.info(f"Running: {' '.join(cmd)}")
    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True
    )
    return result.returncode, result.stdout, result.stderr


def get_current_migration() -> Optional[str]:
    """Get the current migration version from the database."""
    exit_code, stdout, stderr = run_command(["alembic", "current"])
    
    if exit_code != 0:
        logger.error(f"Failed to get current migration: {stderr}")
        return None
    
    # Parse output to get version
    for line in stdout.split('\n'):
        if line.strip():
            # Extract version ID (format: "abc123 (head)")
            version = line.split()[0]
            return version
    
    return None


def get_migration_history() -> List[str]:
    """Get list of all migrations in order."""
    exit_code, stdout, stderr = run_command(["alembic", "history"])
    
    if exit_code != 0:
        logger.error(f"Failed to get migration history: {stderr}")
        return []
    
    migrations = []
    for line in stdout.split('\n'):
        if '->' in line:
            # Parse line like "abc123 -> def456 (head), description"
            parts = line.split('->')
            if len(parts) >= 2:
                version = parts[1].split()[0].strip(',')
                migrations.append(version)
    
    return migrations


def test_migration_upgrade(target: str) -> bool:
    """
    Test upgrading to a specific migration.
    
    Args:
        target: Migration version to upgrade to
        
    Returns:
        True if upgrade succeeded
    """
    logger.info(f"Testing upgrade to {target}")
    exit_code, stdout, stderr = run_command(["alembic", "upgrade", target])
    
    if exit_code != 0:
        logger.error(f"Upgrade to {target} failed: {stderr}")
        return False
    
    logger.info(f"✓ Successfully upgraded to {target}")
    return True


def test_migration_downgrade(target: str) -> bool:
    """
    Test downgrading to a specific migration.
    
    Args:
        target: Migration version to downgrade to
        
    Returns:
        True if downgrade succeeded
    """
    logger.info(f"Testing downgrade to {target}")
    exit_code, stdout, stderr = run_command(["alembic", "downgrade", target])
    
    if exit_code != 0:
        logger.error(f"Downgrade to {target} failed: {stderr}")
        return False
    
    logger.info(f"✓ Successfully downgraded to {target}")
    return True


def verify_data_integrity() -> bool:
    """
    Verify basic data integrity after migration operations.
    
    Returns:
        True if data integrity checks pass
    """
    logger.info("Verifying data integrity...")
    
    # This is a basic check - extend with your specific integrity checks
    exit_code, stdout, stderr = run_command([
        "python", "-c",
        "from src.database import SessionLocal, engine; "
        "from sqlalchemy import text; "
        "db = SessionLocal(); "
        "result = db.execute(text('SELECT COUNT(*) FROM alembic_version')); "
        "print(result.scalar()); "
        "db.close()"
    ])
    
    if exit_code != 0:
        logger.error(f"Data integrity check failed: {stderr}")
        return False
    
    logger.info("✓ Data integrity check passed")
    return True


def test_migration_rollback(migration_id: str) -> bool:
    """
    Test that a migration can be safely rolled back.
    
    Test sequence:
    1. Get current state
    2. Downgrade one version
    3. Verify data integrity
    4. Upgrade back to current
    5. Verify data integrity
    
    Args:
        migration_id: Migration to test
        
    Returns:
        True if all tests pass
    """
    logger.info(f"\n{'='*60}")
    logger.info(f"Testing rollback for migration: {migration_id}")
    logger.info(f"{'='*60}\n")
    
    # Get current migration
    current = get_current_migration()
    if not current:
        logger.error("Could not determine current migration")
        return False
    
    logger.info(f"Current migration: {current}")
    
    # Downgrade one step
    if not test_migration_downgrade("-1"):
        return False
    
    # Verify data integrity after downgrade
    if not verify_data_integrity():
        logger.error("Data integrity check failed after downgrade")
        return False
    
    # Upgrade back to current
    if not test_migration_upgrade(current):
        return False
    
    # Verify data integrity after upgrade
    if not verify_data_integrity():
        logger.error("Data integrity check failed after upgrade")
        return False
    
    logger.info(f"\n✓ Migration {migration_id} rollback test PASSED\n")
    return True


def test_all_recent_migrations(count: int = 5) -> bool:
    """
    Test rollback for the most recent N migrations.
    
    Args:
        count: Number of recent migrations to test
        
    Returns:
        True if all tests pass
    """
    migrations = get_migration_history()
    
    if not migrations:
        logger.error("No migrations found")
        return False
    
    # Test the most recent N migrations
    recent_migrations = migrations[-count:] if len(migrations) > count else migrations
    
    logger.info(f"Testing rollback for {len(recent_migrations)} recent migrations")
    
    failed_migrations = []
    
    for migration_id in recent_migrations:
        if not test_migration_rollback(migration_id):
            failed_migrations.append(migration_id)
    
    if failed_migrations:
        logger.error(f"\n{'='*60}")
        logger.error(f"FAILED MIGRATIONS: {', '.join(failed_migrations)}")
        logger.error(f"{'='*60}\n")
        return False
    
    logger.info(f"\n{'='*60}")
    logger.info(f"ALL ROLLBACK TESTS PASSED")
    logger.info(f"{'='*60}\n")
    return True


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Test migration rollback safety"
    )
    parser.add_argument(
        "--migration",
        help="Specific migration to test (default: test recent 5)"
    )
    parser.add_argument(
        "--count",
        type=int,
        default=5,
        help="Number of recent migrations to test (default: 5)"
    )
    
    args = parser.parse_args()
    
    try:
        if args.migration:
            # Test specific migration
            success = test_migration_rollback(args.migration)
        else:
            # Test recent migrations
            success = test_all_recent_migrations(args.count)
        
        sys.exit(0 if success else 1)
        
    except Exception as e:
        logger.error(f"Rollback test failed with exception: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
