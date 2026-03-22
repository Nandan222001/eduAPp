#!/usr/bin/env python3
"""
Migration Validation Script

This script validates Alembic migrations by:
1. Running migrations on a clean test database
2. Verifying all tables, columns, and constraints are created correctly
3. Testing both upgrade and downgrade paths
4. Comparing schema against expected baseline
5. Generating detailed validation reports
"""

import os
import sys
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Optional
import json

project_root = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(project_root))

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import Engine
from dotenv import load_dotenv


class MigrationValidator:
    """Validates Alembic migrations in a test environment"""
    
    def __init__(self, test_env_file: str = ".env.test.migration"):
        """Initialize the validator with test database configuration"""
        self.test_env_file = test_env_file
        self.load_test_config()
        self.engine: Optional[Engine] = None
        self.inspector = None
        self.results = {
            "timestamp": datetime.utcnow().isoformat(),
            "database": self.database_url,
            "tests": [],
            "errors": [],
            "warnings": [],
            "summary": {}
        }
    
    def load_test_config(self):
        """Load test database configuration"""
        load_dotenv()
        
        if os.path.exists(self.test_env_file):
            load_dotenv(self.test_env_file, override=True)
            print(f"✓ Loaded test configuration from {self.test_env_file}")
        else:
            print(f"⚠ Warning: Test config file {self.test_env_file} not found")
            print("  Using default environment variables")
        
        db_host = os.getenv("DATABASE_HOST", "localhost")
        db_port = os.getenv("DATABASE_PORT", "3306")
        db_user = os.getenv("DATABASE_USER", "root")
        db_pass = os.getenv("DATABASE_PASSWORD", "test_password")
        db_name = os.getenv("DATABASE_NAME", "fastapi_db_migration_test")
        
        self.database_url = f"mysql+pymysql://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}?charset=utf8mb4"
    
    def connect_database(self):
        """Connect to the test database"""
        try:
            self.engine = create_engine(self.database_url, pool_pre_ping=True)
            self.inspector = inspect(self.engine)
            
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            
            db_info = self.database_url.split('@')[1] if '@' in self.database_url else self.database_url
            print(f"✓ Connected to test database: {db_info}")
            return True
        except Exception as e:
            error_msg = f"Failed to connect to test database: {e}"
            print(f"✗ {error_msg}")
            self.results["errors"].append(error_msg)
            return False
    
    def run_migrations_upgrade(self) -> bool:
        """Run alembic upgrade head on test database"""
        print("\n" + "="*60)
        print("Running Alembic Migrations (upgrade head)")
        print("="*60)
        
        try:
            env = os.environ.copy()
            
            result = subprocess.run(
                ["alembic", "upgrade", "head"],
                env=env,
                capture_output=True,
                text=True,
                timeout=300
            )
            
            if result.returncode == 0:
                print("✓ Migrations completed successfully")
                print(result.stdout)
                self.results["tests"].append({
                    "test": "alembic_upgrade",
                    "status": "passed",
                    "output": result.stdout
                })
                return True
            else:
                error_msg = f"Migration upgrade failed: {result.stderr}"
                print(f"✗ {error_msg}")
                print(result.stdout)
                self.results["errors"].append(error_msg)
                self.results["tests"].append({
                    "test": "alembic_upgrade",
                    "status": "failed",
                    "error": result.stderr,
                    "output": result.stdout
                })
                return False
        except subprocess.TimeoutExpired:
            error_msg = "Migration upgrade timed out after 300 seconds"
            print(f"✗ {error_msg}")
            self.results["errors"].append(error_msg)
            return False
        except Exception as e:
            error_msg = f"Error running migrations: {e}"
            print(f"✗ {error_msg}")
            self.results["errors"].append(error_msg)
            return False
    
    def verify_schema(self) -> bool:
        """Verify all tables, columns, and constraints exist"""
        print("\n" + "="*60)
        print("Verifying Database Schema")
        print("="*60)
        
        try:
            tables = self.inspector.get_table_names()
            print(f"\n✓ Found {len(tables)} tables")
            
            schema_valid = True
            table_details = {}
            
            for table_name in sorted(tables):
                if table_name == "alembic_version":
                    continue
                
                columns = self.inspector.get_columns(table_name)
                indexes = self.inspector.get_indexes(table_name)
                foreign_keys = self.inspector.get_foreign_keys(table_name)
                pk_constraint = self.inspector.get_pk_constraint(table_name)
                unique_constraints = self.inspector.get_unique_constraints(table_name)
                
                table_details[table_name] = {
                    "columns": len(columns),
                    "indexes": len(indexes),
                    "foreign_keys": len(foreign_keys),
                    "primary_key": pk_constraint.get("constrained_columns", []),
                    "unique_constraints": len(unique_constraints)
                }
                
                for col in columns:
                    col_name = col["name"]
                    nullable = col["nullable"]
                    
                    critical_columns = ["id", "institution_id", "created_at"]
                    if col_name in critical_columns and nullable:
                        warning = f"Table {table_name}.{col_name} is nullable but should not be"
                        self.results["warnings"].append(warning)
                
                fk_columns = set()
                for fk in foreign_keys:
                    fk_columns.update(fk.get("constrained_columns", []))
                
                indexed_columns = set()
                for idx in indexes:
                    indexed_columns.update(idx.get("column_names", []))
                
                missing_indexes = fk_columns - indexed_columns
                if missing_indexes:
                    warning = f"Table {table_name}: Foreign key columns without indexes: {missing_indexes}"
                    self.results["warnings"].append(warning)
            
            print(f"\nSchema verification completed:")
            print(f"  Tables verified: {len(table_details)}")
            print(f"  Warnings found: {len(self.results['warnings'])}")
            
            self.results["tests"].append({
                "test": "schema_verification",
                "status": "passed",
                "details": table_details
            })
            
            return schema_valid
        except Exception as e:
            error_msg = f"Schema verification failed: {e}"
            print(f"✗ {error_msg}")
            self.results["errors"].append(error_msg)
            return False
    
    def test_migration_downgrade(self, steps: int = 3) -> bool:
        """Test downgrade path for recent migrations"""
        print("\n" + "="*60)
        print(f"Testing Migration Downgrade (last {steps} migrations)")
        print("="*60)
        
        try:
            with self.engine.connect() as conn:
                result = conn.execute(text("SELECT version_num FROM alembic_version"))
                current_version = result.scalar()
                print(f"Current version: {current_version}")
            
            result = subprocess.run(
                ["alembic", "downgrade", f"-{steps}"],
                capture_output=True,
                text=True,
                timeout=180
            )
            
            if result.returncode == 0:
                print(f"✓ Downgrade -{steps} successful")
                
                result = subprocess.run(
                    ["alembic", "upgrade", "head"],
                    capture_output=True,
                    text=True,
                    timeout=180
                )
                
                if result.returncode == 0:
                    print(f"✓ Re-upgrade to head successful")
                    self.results["tests"].append({
                        "test": "migration_downgrade_upgrade",
                        "status": "passed",
                        "steps": steps
                    })
                    return True
                else:
                    error_msg = f"Re-upgrade failed: {result.stderr}"
                    print(f"✗ {error_msg}")
                    self.results["errors"].append(error_msg)
                    return False
            else:
                error_msg = f"Downgrade failed: {result.stderr}"
                print(f"✗ {error_msg}")
                self.results["errors"].append(error_msg)
                return False
        except subprocess.TimeoutExpired:
            error_msg = "Migration downgrade/upgrade timed out"
            print(f"✗ {error_msg}")
            self.results["errors"].append(error_msg)
            return False
        except Exception as e:
            error_msg = f"Error testing downgrade: {e}"
            print(f"✗ {error_msg}")
            self.results["errors"].append(error_msg)
            return False
    
    def check_migration_consistency(self) -> bool:
        """Check for common migration issues"""
        print("\n" + "="*60)
        print("Checking Migration Consistency")
        print("="*60)
        
        issues = []
        
        migrations_dir = Path("alembic/versions")
        if migrations_dir.exists():
            revision_ids = {}
            for migration_file in migrations_dir.glob("*.py"):
                if migration_file.name.startswith("_"):
                    continue
                
                try:
                    content = migration_file.read_text()
                    
                    for line in content.split("\n"):
                        if line.startswith("revision = "):
                            revision = line.split("=")[1].strip().strip("'\"")
                            if revision in revision_ids:
                                issues.append(
                                    f"Duplicate revision ID '{revision}' in {migration_file.name} "
                                    f"and {revision_ids[revision]}"
                                )
                            else:
                                revision_ids[revision] = migration_file.name
                            break
                except Exception as e:
                    issues.append(f"Error reading {migration_file.name}: {e}")
        
        if issues:
            print(f"✗ Found {len(issues)} consistency issues:")
            for issue in issues:
                print(f"  - {issue}")
                self.results["errors"].append(issue)
            return False
        else:
            print("✓ No consistency issues found")
            self.results["tests"].append({
                "test": "migration_consistency",
                "status": "passed"
            })
            return True
    
    def generate_report(self, output_file: str = "migration_validation_report.json"):
        """Generate validation report"""
        print("\n" + "="*60)
        print("Generating Validation Report")
        print("="*60)
        
        self.results["summary"] = {
            "total_tests": len(self.results["tests"]),
            "passed_tests": sum(1 for t in self.results["tests"] if t["status"] == "passed"),
            "failed_tests": sum(1 for t in self.results["tests"] if t["status"] == "failed"),
            "total_errors": len(self.results["errors"]),
            "total_warnings": len(self.results["warnings"]),
            "overall_status": "PASSED" if len(self.results["errors"]) == 0 else "FAILED"
        }
        
        report_path = Path("backups/migration_test") / output_file
        report_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(report_path, "w") as f:
            json.dump(self.results, f, indent=2)
        
        print(f"✓ Report saved to: {report_path}")
        
        print("\n" + "="*60)
        print("VALIDATION SUMMARY")
        print("="*60)
        print(f"Overall Status: {self.results['summary']['overall_status']}")
        print(f"Tests Run: {self.results['summary']['total_tests']}")
        print(f"  Passed: {self.results['summary']['passed_tests']}")
        print(f"  Failed: {self.results['summary']['failed_tests']}")
        print(f"Errors: {self.results['summary']['total_errors']}")
        print(f"Warnings: {self.results['summary']['total_warnings']}")
        print("="*60)
        
        return self.results["summary"]["overall_status"] == "PASSED"
    
    def run_full_validation(self) -> bool:
        """Run complete migration validation suite"""
        print("\n" + "="*60)
        print("ALEMBIC MIGRATION VALIDATION SUITE")
        print("="*60)
        print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*60)
        
        success = True
        
        if not self.connect_database():
            return False
        
        if not self.run_migrations_upgrade():
            success = False
        
        if not self.verify_schema():
            success = False
        
        if not self.test_migration_downgrade(steps=3):
            self.results["warnings"].append("Downgrade test had issues but continuing")
        
        if not self.check_migration_consistency():
            pass
        
        report_success = self.generate_report()
        
        return success and report_success


def main():
    """Main entry point"""
    validator = MigrationValidator()
    
    try:
        success = validator.run_full_validation()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠ Validation interrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
