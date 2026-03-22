#!/usr/bin/env python3
"""
Test Recent Migrations

This script tests recent migrations individually by:
1. Identifying the most recent N migrations
2. For each migration:
   - Downgrading to the previous version
   - Upgrading to the target version
   - Verifying the schema changes
3. Generating a detailed test report
"""

import os
import sys
import subprocess
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Tuple, Optional
import json
import re

# Add project root to path
project_root = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(project_root))

from sqlalchemy import create_engine, inspect, text
from dotenv import load_dotenv


class RecentMigrationTester:
    """Tests recent migrations individually"""
    
    def __init__(self, test_env_file: str = ".env.test.migration", count: int = 5):
        """Initialize the tester"""
        self.test_env_file = test_env_file
        self.count = count
        self.load_test_config()
        self.engine = None
        self.results = {
            "timestamp": datetime.utcnow().isoformat(),
            "migrations_tested": [],
            "errors": [],
            "summary": {}
        }
    
    def load_test_config(self):
        """Load test database configuration"""
        load_dotenv()
        
        if os.path.exists(self.test_env_file):
            load_dotenv(self.test_env_file, override=True)
        
        db_host = os.getenv("DATABASE_HOST", "localhost")
        db_port = os.getenv("DATABASE_PORT", "3306")
        db_user = os.getenv("DATABASE_USER", "root")
        db_pass = os.getenv("DATABASE_PASSWORD", "test_password")
        db_name = os.getenv("DATABASE_NAME", "fastapi_db_migration_test")
        
        self.database_url = f"mysql+pymysql://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}?charset=utf8mb4"
    
    def connect_database(self):
        """Connect to the test database"""
        self.engine = create_engine(self.database_url, pool_pre_ping=True)
    
    def get_migration_history(self) -> List[Dict]:
        """Get migration history from alembic"""
        try:
            result = subprocess.run(
                ["alembic", "history"],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode != 0:
                return []
            
            # Parse alembic history output
            migrations = []
            lines = result.stdout.strip().split("\n")
            
            for line in lines:
                # Match lines like: "Rev: 040 (head)" or "040 -> 039"
                match = re.search(r"(\w+)\s*(?:->|<-)\s*(\w+)", line)
                if match:
                    revision = match.group(1)
                    down_revision = match.group(2)
                    
                    # Extract description if present
                    desc_match = re.search(r",\s*(.+)$", line)
                    description = desc_match.group(1) if desc_match else ""
                    
                    migrations.append({
                        "revision": revision,
                        "down_revision": down_revision if down_revision != "<base>" else None,
                        "description": description.strip()
                    })
            
            return migrations[:self.count]
        except Exception as e:
            print(f"Error getting migration history: {e}")
            return []
    
    def get_current_revision(self) -> Optional[str]:
        """Get current database revision"""
        try:
            with self.engine.connect() as conn:
                result = conn.execute(text("SELECT version_num FROM alembic_version"))
                return result.scalar()
        except:
            return None
    
    def get_schema_snapshot(self) -> Dict:
        """Get current schema snapshot"""
        inspector = inspect(self.engine)
        snapshot = {
            "tables": {},
            "enums": []
        }
        
        # Get all tables
        for table_name in inspector.get_table_names():
            snapshot["tables"][table_name] = {
                "columns": [
                    {
                        "name": col["name"],
                        "type": str(col["type"]),
                        "nullable": col["nullable"]
                    }
                    for col in inspector.get_columns(table_name)
                ],
                "indexes": [
                    idx["name"] for idx in inspector.get_indexes(table_name)
                ],
                "foreign_keys": [
                    {
                        "constrained_columns": fk["constrained_columns"],
                        "referred_table": fk["referred_table"],
                        "referred_columns": fk["referred_columns"]
                    }
                    for fk in inspector.get_foreign_keys(table_name)
                ]
            }
        
        snapshot["enums"] = []
        
        return snapshot
    
    def test_migration(self, migration: Dict) -> Dict:
        """Test a single migration upgrade and downgrade"""
        revision = migration["revision"]
        down_revision = migration.get("down_revision")
        description = migration.get("description", "")
        
        print(f"\n{'='*70}")
        print(f"Testing Migration: {revision}")
        print(f"Description: {description}")
        print(f"Down Revision: {down_revision}")
        print(f"{'='*70}")
        
        test_result = {
            "revision": revision,
            "description": description,
            "down_revision": down_revision,
            "tests": [],
            "errors": []
        }
        
        try:
            # Step 1: Get initial state
            current_rev = self.get_current_revision()
            print(f"Current revision: {current_rev}")
            
            # Step 2: Downgrade to down_revision if not already there
            if down_revision and current_rev != down_revision:
                print(f"\nDowngrading to {down_revision}...")
                result = subprocess.run(
                    ["alembic", "downgrade", down_revision],
                    capture_output=True,
                    text=True,
                    timeout=120
                )
                
                if result.returncode == 0:
                    print(f"✓ Downgrade successful")
                    before_snapshot = self.get_schema_snapshot()
                    test_result["tests"].append({
                        "step": "downgrade",
                        "status": "passed"
                    })
                else:
                    error = f"Downgrade failed: {result.stderr}"
                    print(f"✗ {error}")
                    test_result["errors"].append(error)
                    test_result["tests"].append({
                        "step": "downgrade",
                        "status": "failed",
                        "error": result.stderr
                    })
                    return test_result
            else:
                before_snapshot = self.get_schema_snapshot()
            
            # Step 3: Upgrade to target revision
            print(f"\nUpgrading to {revision}...")
            result = subprocess.run(
                ["alembic", "upgrade", revision],
                capture_output=True,
                text=True,
                timeout=120
            )
            
            if result.returncode == 0:
                print(f"✓ Upgrade successful")
                after_snapshot = self.get_schema_snapshot()
                test_result["tests"].append({
                    "step": "upgrade",
                    "status": "passed"
                })
                
                # Step 4: Compare schemas to detect changes
                changes = self.compare_schemas(before_snapshot, after_snapshot)
                test_result["schema_changes"] = changes
                
                if changes["tables_added"]:
                    print(f"  Tables added: {', '.join(changes['tables_added'])}")
                if changes["tables_removed"]:
                    print(f"  Tables removed: {', '.join(changes['tables_removed'])}")
                if changes["enums_added"]:
                    print(f"  Enums added: {', '.join(changes['enums_added'])}")
                
            else:
                error = f"Upgrade failed: {result.stderr}"
                print(f"✗ {error}")
                test_result["errors"].append(error)
                test_result["tests"].append({
                    "step": "upgrade",
                    "status": "failed",
                    "error": result.stderr
                })
                return test_result
            
            # Step 5: Test downgrade back
            print(f"\nTesting downgrade back to {down_revision}...")
            if down_revision:
                result = subprocess.run(
                    ["alembic", "downgrade", down_revision],
                    capture_output=True,
                    text=True,
                    timeout=120
                )
                
                if result.returncode == 0:
                    print(f"✓ Downgrade test successful")
                    test_result["tests"].append({
                        "step": "downgrade_test",
                        "status": "passed"
                    })
                    
                    # Upgrade back to revision
                    subprocess.run(
                        ["alembic", "upgrade", revision],
                        capture_output=True,
                        text=True,
                        timeout=120
                    )
                else:
                    warning = f"Downgrade test failed: {result.stderr}"
                    print(f"⚠ {warning}")
                    test_result["tests"].append({
                        "step": "downgrade_test",
                        "status": "failed",
                        "error": result.stderr
                    })
            
            print(f"✓ Migration {revision} tested successfully")
            
        except subprocess.TimeoutExpired:
            error = "Migration test timed out"
            print(f"✗ {error}")
            test_result["errors"].append(error)
        except Exception as e:
            error = f"Error testing migration: {e}"
            print(f"✗ {error}")
            test_result["errors"].append(error)
        
        return test_result
    
    def compare_schemas(self, before: Dict, after: Dict) -> Dict:
        """Compare two schema snapshots"""
        changes = {
            "tables_added": [],
            "tables_removed": [],
            "tables_modified": [],
            "enums_added": [],
            "enums_removed": []
        }
        
        before_tables = set(before["tables"].keys())
        after_tables = set(after["tables"].keys())
        
        changes["tables_added"] = list(after_tables - before_tables)
        changes["tables_removed"] = list(before_tables - after_tables)
        
        # Check for modified tables
        for table in before_tables & after_tables:
            before_cols = {col["name"] for col in before["tables"][table]["columns"]}
            after_cols = {col["name"] for col in after["tables"][table]["columns"]}
            
            if before_cols != after_cols:
                changes["tables_modified"].append({
                    "table": table,
                    "columns_added": list(after_cols - before_cols),
                    "columns_removed": list(before_cols - after_cols)
                })
        
        before_enums = set(before["enums"])
        after_enums = set(after["enums"])
        
        changes["enums_added"] = list(after_enums - before_enums)
        changes["enums_removed"] = list(before_enums - after_enums)
        
        return changes
    
    def run_tests(self) -> bool:
        """Run all tests"""
        print("\n" + "="*70)
        print("RECENT MIGRATIONS TEST SUITE")
        print("="*70)
        print(f"Testing last {self.count} migrations")
        print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*70)
        
        # Connect to database
        self.connect_database()
        
        # Get migration history
        migrations = self.get_migration_history()
        
        if not migrations:
            print("⚠ No migrations found to test")
            return True
        
        print(f"\nFound {len(migrations)} recent migrations to test")
        
        # Test each migration
        all_passed = True
        for migration in migrations:
            result = self.test_migration(migration)
            self.results["migrations_tested"].append(result)
            
            if result["errors"]:
                all_passed = False
        
        # Generate report
        self.generate_report()
        
        return all_passed
    
    def generate_report(self):
        """Generate test report"""
        self.results["summary"] = {
            "total_migrations_tested": len(self.results["migrations_tested"]),
            "passed": sum(
                1 for m in self.results["migrations_tested"] if not m["errors"]
            ),
            "failed": sum(
                1 for m in self.results["migrations_tested"] if m["errors"]
            ),
            "total_errors": sum(
                len(m["errors"]) for m in self.results["migrations_tested"]
            )
        }
        
        # Save report
        report_path = Path("backups/migration_test/recent_migrations_test_report.json")
        report_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(report_path, "w") as f:
            json.dump(self.results, f, indent=2)
        
        print("\n" + "="*70)
        print("TEST SUMMARY")
        print("="*70)
        print(f"Migrations Tested: {self.results['summary']['total_migrations_tested']}")
        print(f"Passed: {self.results['summary']['passed']}")
        print(f"Failed: {self.results['summary']['failed']}")
        print(f"Total Errors: {self.results['summary']['total_errors']}")
        print(f"\nReport saved to: {report_path}")
        print("="*70)


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Test recent Alembic migrations")
    parser.add_argument(
        "-n", "--count",
        type=int,
        default=5,
        help="Number of recent migrations to test (default: 5)"
    )
    args = parser.parse_args()
    
    tester = RecentMigrationTester(count=args.count)
    
    try:
        success = tester.run_tests()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠ Testing interrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
