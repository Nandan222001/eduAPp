#!/usr/bin/env python
"""
MySQL Migration Testing Script

This script runs alembic migrations to test the fixed MySQL schema.
It performs the following steps:
1. Checks current migration status
2. Downgrades to base (if migrations exist)
3. Upgrades to head (applies all migrations)
4. Verifies tables were created successfully
"""

import sys
import subprocess
import os
from pathlib import Path

# ANSI color codes for terminal output
class Colors:
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    RESET = '\033[0m'
    BOLD = '\033[1m'


def print_color(message, color):
    """Print colored message to terminal."""
    print(f"{color}{message}{Colors.RESET}")


def run_command(command, description, allow_failure=False):
    """Run a shell command and handle errors."""
    print_color(f"\n{description}", Colors.GREEN)
    print(f"Running: {command}")
    
    result = subprocess.run(
        command,
        shell=True,
        capture_output=True,
        text=True
    )
    
    if result.stdout:
        print(result.stdout)
    
    if result.returncode != 0:
        if result.stderr:
            print(result.stderr)
        
        if allow_failure:
            print_color(
                f"Warning: Command failed but continuing...",
                Colors.YELLOW
            )
            return False
        else:
            print_color(f"ERROR: Command failed!", Colors.RED)
            sys.exit(1)
    
    return True


def check_env_file():
    """Check if .env file exists."""
    if not Path(".env").exists():
        print_color("ERROR: .env file not found!", Colors.RED)
        print_color("\nPlease create a .env file with your database credentials.", Colors.YELLOW)
        print_color("\nExample .env file:", Colors.YELLOW)
        print("DATABASE_HOST=localhost")
        print("DATABASE_PORT=3306")
        print("DATABASE_USER=root")
        print("DATABASE_PASSWORD=root")
        print("DATABASE_NAME=fastapi_db")
        print("DATABASE_CHARSET=utf8mb4")
        print("DATABASE_CONNECT_TIMEOUT=10")
        sys.exit(1)


def verify_tables():
    """Verify that tables were created successfully."""
    print_color("\nVerifying tables were created...", Colors.GREEN)
    
    try:
        from sqlalchemy import create_engine, text, inspect
        from src.config import settings
        
        engine = create_engine(settings.database_url)
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        print(f"\n{Colors.BOLD}Total tables created: {len(tables)}{Colors.RESET}")
        print("\nTables:")
        for table in sorted(tables):
            print(f"  - {table}")
        
        # Check for subscriptions table specifically
        if 'subscriptions' in tables:
            print_color("\n✓ subscriptions table exists", Colors.GREEN)
            
            # Get column details
            columns = inspector.get_columns('subscriptions')
            print("\nSubscriptions table columns:")
            for col in columns:
                nullable = 'NULL' if col['nullable'] else 'NOT NULL'
                default = f"DEFAULT {col.get('default', 'None')}" if col.get('default') else ''
                print(f"  - {col['name']}: {col['type']} {nullable} {default}")
            
            # Check datetime columns have proper defaults
            datetime_cols = ['created_at', 'updated_at', 'start_date']
            for col in columns:
                if col['name'] in datetime_cols:
                    if col['name'] in ['created_at', 'updated_at']:
                        if col.get('default') and 'CURRENT_TIMESTAMP' in str(col['default']):
                            print_color(f"  ✓ {col['name']} has CURRENT_TIMESTAMP default", Colors.GREEN)
                        else:
                            print_color(f"  ✗ {col['name']} missing CURRENT_TIMESTAMP default", Colors.RED)
        else:
            print_color("\n✗ subscriptions table NOT found!", Colors.RED)
            return False
        
        return True
        
    except Exception as e:
        print_color(f"\nError verifying tables: {e}", Colors.RED)
        return False


def main():
    """Main execution function."""
    print_color("=== MySQL Migration Testing Script ===", Colors.CYAN)
    
    # Check environment
    check_env_file()
    
    # Step 1: Check current status
    run_command(
        "alembic current",
        "Step 1: Checking current migration status...",
        allow_failure=True
    )
    
    # Step 2: Downgrade to base
    run_command(
        "alembic downgrade base",
        "Step 2: Downgrading to base (if migrations exist)...",
        allow_failure=True
    )
    
    # Step 3: Upgrade to head
    success = run_command(
        "alembic upgrade head",
        "Step 3: Upgrading to head (applying all migrations)...",
        allow_failure=False
    )
    
    # Step 4: Verify migration status
    run_command(
        "alembic current",
        "Step 4: Verifying migration status...",
        allow_failure=False
    )
    
    # Step 5: Verify tables
    if verify_tables():
        print_color("\n=== SUCCESS: All migrations applied successfully! ===", Colors.GREEN)
        print_color("The subscriptions table and all other tables were created without errors.", Colors.GREEN)
        return 0
    else:
        print_color("\n=== FAILURE: Migration verification failed ===", Colors.RED)
        return 1


if __name__ == "__main__":
    sys.exit(main())
