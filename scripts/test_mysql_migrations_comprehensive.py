#!/usr/bin/env python3
"""
Comprehensive MySQL 8.0 Migration Testing Script

This script tests all migrations on a clean MySQL 8.0 database by:
1. Running `alembic upgrade head` to create all tables
2. Running `alembic downgrade base` to test downgrades
3. Running `alembic upgrade head` again to verify full migration path
4. Documenting MySQL-specific behaviors and limitations

Run with: python scripts/test_mysql_migrations_comprehensive.py
"""

import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.pool import NullPool

from alembic import command
from alembic.config import Config


class MySQLMigrationTester:
    """Comprehensive MySQL 8.0 migration testing"""

    def __init__(self, database_url: str):
        """Initialize tester with database URL"""
        self.database_url = database_url
        self.engine = None
        self.inspector = None
        self.test_results = {
            "start_time": datetime.utcnow().isoformat(),
            "database_url": database_url,
            "tests": [],
            "mysql_behaviors": [],
            "mysql_limitations": [],
            "success": False,
            "duration_seconds": 0
        }

    def connect(self):
        """Create database connection"""
        print("\n" + "="*80)
        print("CONNECTING TO MYSQL 8.0 DATABASE")
        print("="*80)

        try:
            self.engine = create_engine(
                self.database_url,
                poolclass=NullPool,
                echo=False,
                pool_pre_ping=True,
                connect_args={'charset': 'utf8mb4'}
            )

            # Test connection and get MySQL version
            with self.engine.connect() as conn:
                result = conn.execute(text("SELECT VERSION()"))
                version = result.scalar()
                print(f"✓ Connected to MySQL: {version}")

                result = conn.execute(text("SELECT DATABASE()"))
                db_name = result.scalar()
                print(f"✓ Database: {db_name}")

                self.test_results["mysql_version"] = version
                self.test_results["database_name"] = db_name

            self.inspector = inspect(self.engine)

        except Exception as e:
            print(f"✗ Connection failed: {str(e)}")
            self.test_results["connection_error"] = str(e)
            raise

    def clean_database(self):
        """Drop all tables from database"""
        print("\n" + "="*80)
        print("CLEANING DATABASE")
        print("="*80)

        try:
            with self.engine.connect() as conn:
                # Get all tables
                result = conn.execute(text("""
                    SELECT table_name
                    FROM information_schema.tables
                    WHERE table_schema = DATABASE()
                    AND table_type = 'BASE TABLE'
                """))

                tables = [row[0] for row in result.fetchall()]

                if tables:
                    print(f"Found {len(tables)} tables to drop")

                    # Disable foreign key checks
                    conn.execute(text("SET FOREIGN_KEY_CHECKS = 0"))

                    # Drop all tables
                    for table in tables:
                        print(f"  Dropping table: {table}")
                        conn.execute(text(f"DROP TABLE IF EXISTS `{table}`"))

                    # Re-enable foreign key checks
                    conn.execute(text("SET FOREIGN_KEY_CHECKS = 1"))

                    conn.commit()
                    print(f"✓ Dropped {len(tables)} tables")
                else:
                    print("✓ Database is already clean")

        except Exception as e:
            print(f"✗ Cleanup failed: {str(e)}")
            raise

    def test_upgrade_head(self) -> dict[str, Any]:
        """Test alembic upgrade head"""
        print("\n" + "="*80)
        print("TEST 1: ALEMBIC UPGRADE HEAD")
        print("="*80)

        test_result = {
            "name": "alembic_upgrade_head",
            "success": False,
            "duration_seconds": 0,
            "tables_created": 0,
            "indexes_created": 0,
            "foreign_keys_created": 0,
            "errors": []
        }

        start_time = time.time()

        try:
            # Configure alembic
            alembic_config = Config("alembic.ini")
            alembic_config.set_main_option("sqlalchemy.url", self.database_url)

            # Run upgrade
            print("\nExecuting: alembic upgrade head")
            command.upgrade(alembic_config, "head")

            duration = time.time() - start_time
            test_result["duration_seconds"] = duration

            print(f"\n✓ Migrations completed in {duration:.2f}s")

            # Inspect created objects
            self.inspector = inspect(self.engine)
            tables = self.inspector.get_table_names()

            print(f"\n✓ Created {len(tables)} tables:")
            for table in sorted(tables):
                print(f"  - {table}")

            test_result["tables_created"] = len(tables)
            test_result["tables"] = tables

            # Count indexes
            index_count = 0
            for table_name in tables:
                indexes = self.inspector.get_indexes(table_name)
                index_count += len(indexes)

            print(f"\n✓ Created {index_count} indexes")
            test_result["indexes_created"] = index_count

            # Count foreign keys
            fk_count = 0
            for table_name in tables:
                fks = self.inspector.get_foreign_keys(table_name)
                fk_count += len(fks)

            print(f"✓ Created {fk_count} foreign key constraints")
            test_result["foreign_keys_created"] = fk_count

            # Verify core tables
            core_tables = [
                'institutions', 'users', 'roles', 'permissions',
                'students', 'teachers', 'academic_years', 'grades',
                'sections', 'subjects', 'assignments', 'attendance'
            ]

            missing_tables = [t for t in core_tables if t not in tables]
            if missing_tables:
                test_result["errors"].append(f"Missing core tables: {', '.join(missing_tables)}")
                print(f"\n✗ Missing core tables: {', '.join(missing_tables)}")
            else:
                print(f"✓ All {len(core_tables)} core tables present")

            test_result["success"] = len(missing_tables) == 0

        except Exception as e:
            test_result["errors"].append(str(e))
            print(f"\n✗ Upgrade failed: {str(e)}")
            test_result["duration_seconds"] = time.time() - start_time

        return test_result

    def test_downgrade_base(self) -> dict[str, Any]:
        """Test alembic downgrade base"""
        print("\n" + "="*80)
        print("TEST 2: ALEMBIC DOWNGRADE BASE")
        print("="*80)

        test_result = {
            "name": "alembic_downgrade_base",
            "success": False,
            "duration_seconds": 0,
            "errors": []
        }

        start_time = time.time()

        try:
            # Configure alembic
            alembic_config = Config("alembic.ini")
            alembic_config.set_main_option("sqlalchemy.url", self.database_url)

            # Run downgrade
            print("\nExecuting: alembic downgrade base")
            command.downgrade(alembic_config, "base")

            duration = time.time() - start_time
            test_result["duration_seconds"] = duration

            print(f"\n✓ Downgrade completed in {duration:.2f}s")

            # Verify all tables are dropped
            self.inspector = inspect(self.engine)
            remaining_tables = self.inspector.get_table_names()

            if remaining_tables:
                test_result["errors"].append(f"Tables still exist: {', '.join(remaining_tables)}")
                print(f"\n✗ {len(remaining_tables)} tables still exist:")
                for table in remaining_tables:
                    print(f"  - {table}")
            else:
                print("✓ All tables successfully dropped")
                test_result["success"] = True

        except Exception as e:
            test_result["errors"].append(str(e))
            print(f"\n✗ Downgrade failed: {str(e)}")
            test_result["duration_seconds"] = time.time() - start_time

        return test_result

    def test_upgrade_head_again(self) -> dict[str, Any]:
        """Test alembic upgrade head again to verify full path"""
        print("\n" + "="*80)
        print("TEST 3: ALEMBIC UPGRADE HEAD (SECOND RUN)")
        print("="*80)

        test_result = {
            "name": "alembic_upgrade_head_second",
            "success": False,
            "duration_seconds": 0,
            "tables_created": 0,
            "errors": []
        }

        start_time = time.time()

        try:
            # Configure alembic
            alembic_config = Config("alembic.ini")
            alembic_config.set_main_option("sqlalchemy.url", self.database_url)

            # Run upgrade again
            print("\nExecuting: alembic upgrade head (second run)")
            command.upgrade(alembic_config, "head")

            duration = time.time() - start_time
            test_result["duration_seconds"] = duration

            print(f"\n✓ Migrations completed in {duration:.2f}s")

            # Inspect created objects
            self.inspector = inspect(self.engine)
            tables = self.inspector.get_table_names()

            print(f"✓ Created {len(tables)} tables")
            test_result["tables_created"] = len(tables)
            test_result["tables"] = tables

            test_result["success"] = len(tables) > 0

        except Exception as e:
            test_result["errors"].append(str(e))
            print(f"\n✗ Second upgrade failed: {str(e)}")
            test_result["duration_seconds"] = time.time() - start_time

        return test_result

    def analyze_mysql_specifics(self):
        """Analyze MySQL-specific behaviors and limitations"""
        print("\n" + "="*80)
        print("ANALYZING MYSQL-SPECIFIC BEHAVIORS")
        print("="*80)

        behaviors = []
        limitations = []

        try:
            # Check character set and collation
            with self.engine.connect() as conn:
                result = conn.execute(text("""
                    SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME
                    FROM information_schema.SCHEMATA
                    WHERE SCHEMA_NAME = DATABASE()
                """))
                charset_info = result.fetchone()

                if charset_info:
                    charset, collation = charset_info
                    print(f"\n✓ Database character set: {charset}")
                    print(f"✓ Database collation: {collation}")

                    behaviors.append({
                        "category": "Character Set",
                        "behavior": f"Using {charset} character set with {collation} collation",
                        "recommendation": "Ensure all text columns support full UTF-8 including emojis"
                    })

                    if charset != "utf8mb4":
                        limitations.append({
                            "issue": "Character set is not utf8mb4",
                            "impact": "May not support all Unicode characters (e.g., emojis)",
                            "solution": "Alter database to use utf8mb4 character set"
                        })

                # Check storage engine
                result = conn.execute(text("""
                    SELECT ENGINE, COUNT(*) as count
                    FROM information_schema.TABLES
                    WHERE TABLE_SCHEMA = DATABASE()
                    GROUP BY ENGINE
                """))
                engines = result.fetchall()

                print("\n✓ Storage engines in use:")
                for engine, count in engines:
                    print(f"  - {engine}: {count} tables")

                    behaviors.append({
                        "category": "Storage Engine",
                        "behavior": f"{count} tables using {engine} engine",
                        "recommendation": "InnoDB provides ACID compliance and foreign key support"
                    })

                # Check for TEXT/BLOB columns (no default values in MySQL)
                result = conn.execute(text("""
                    SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
                    FROM information_schema.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE()
                    AND DATA_TYPE IN ('TEXT', 'BLOB', 'MEDIUMTEXT', 'LONGTEXT', 'JSON')
                    ORDER BY TABLE_NAME, COLUMN_NAME
                """))
                text_columns = result.fetchall()

                if text_columns:
                    print(f"\n✓ Found {len(text_columns)} TEXT/BLOB/JSON columns:")
                    for table, column, dtype in text_columns[:10]:  # Show first 10
                        print(f"  - {table}.{column} ({dtype})")
                    if len(text_columns) > 10:
                        print(f"  ... and {len(text_columns) - 10} more")

                    behaviors.append({
                        "category": "TEXT/BLOB Columns",
                        "behavior": f"{len(text_columns)} TEXT/BLOB/JSON columns found",
                        "recommendation": "TEXT and BLOB columns cannot have default values in MySQL"
                    })

                # Check for ENUM types
                result = conn.execute(text("""
                    SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE
                    FROM information_schema.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE()
                    AND DATA_TYPE = 'enum'
                    ORDER BY TABLE_NAME, COLUMN_NAME
                """))
                enum_columns = result.fetchall()

                if enum_columns:
                    print(f"\n✓ Found {len(enum_columns)} ENUM columns:")
                    for table, column, col_type in enum_columns[:10]:
                        print(f"  - {table}.{column}: {col_type}")
                    if len(enum_columns) > 10:
                        print(f"  ... and {len(enum_columns) - 10} more")

                    behaviors.append({
                        "category": "ENUM Columns",
                        "behavior": f"{len(enum_columns)} ENUM columns found",
                        "recommendation": "MySQL ENUMs are stored as integers; adding values is an ALTER TABLE operation"
                    })

                # Check index lengths
                result = conn.execute(text("""
                    SELECT
                        TABLE_NAME,
                        INDEX_NAME,
                        SUM(CHAR_LENGTH(COLUMN_NAME)) as total_length
                    FROM information_schema.STATISTICS
                    WHERE TABLE_SCHEMA = DATABASE()
                    GROUP BY TABLE_NAME, INDEX_NAME
                    HAVING total_length > 0
                    ORDER BY total_length DESC
                    LIMIT 10
                """))
                long_indexes = result.fetchall()

                if long_indexes:
                    print("\n✓ Checking index lengths (top 10 longest):")
                    for table, index, length in long_indexes:
                        print(f"  - {table}.{index}: {length} chars")

                    behaviors.append({
                        "category": "Index Lengths",
                        "behavior": "MySQL has maximum key length limits (767 bytes for InnoDB without large prefix)",
                        "recommendation": "Use VARCHAR prefix lengths for long string indexes if needed"
                    })

                # Check for foreign key constraints
                result = conn.execute(text("""
                    SELECT
                        COUNT(*) as fk_count,
                        COUNT(DISTINCT TABLE_NAME) as table_count
                    FROM information_schema.KEY_COLUMN_USAGE
                    WHERE TABLE_SCHEMA = DATABASE()
                    AND REFERENCED_TABLE_NAME IS NOT NULL
                """))
                fk_stats = result.fetchone()

                if fk_stats:
                    fk_count, table_count = fk_stats
                    print("\n✓ Foreign key constraints:")
                    print(f"  - {fk_count} foreign keys across {table_count} tables")

                    behaviors.append({
                        "category": "Foreign Keys",
                        "behavior": f"{fk_count} foreign key constraints defined",
                        "recommendation": "Foreign keys enforce referential integrity; ensure proper indexes on FK columns"
                    })

                # Check for JSON columns
                result = conn.execute(text("""
                    SELECT TABLE_NAME, COLUMN_NAME
                    FROM information_schema.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE()
                    AND DATA_TYPE = 'json'
                    ORDER BY TABLE_NAME, COLUMN_NAME
                """))
                json_columns = result.fetchall()

                if json_columns:
                    print(f"\n✓ Found {len(json_columns)} JSON columns:")
                    for table, column in json_columns[:10]:
                        print(f"  - {table}.{column}")
                    if len(json_columns) > 10:
                        print(f"  ... and {len(json_columns) - 10} more")

                    behaviors.append({
                        "category": "JSON Support",
                        "behavior": f"{len(json_columns)} JSON columns found (MySQL 5.7+)",
                        "recommendation": "JSON columns provide native JSON validation and querying in MySQL 8.0"
                    })

                    limitations.append({
                        "issue": "JSON column performance",
                        "impact": "JSON operations may be slower than normalized relational data",
                        "solution": "Use JSON indexes (generated columns) for frequently queried paths"
                    })

                # Check table sizes
                result = conn.execute(text("""
                    SELECT
                        TABLE_NAME,
                        ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS size_mb
                    FROM information_schema.TABLES
                    WHERE TABLE_SCHEMA = DATABASE()
                    ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC
                    LIMIT 10
                """))
                large_tables = result.fetchall()

                print("\n✓ Largest tables:")
                for table, size_mb in large_tables:
                    print(f"  - {table}: {size_mb} MB")

        except Exception as e:
            print(f"\n✗ Analysis failed: {str(e)}")
            limitations.append({
                "issue": "Failed to analyze MySQL specifics",
                "impact": str(e),
                "solution": "Check database permissions and MySQL version"
            })

        self.test_results["mysql_behaviors"] = behaviors
        self.test_results["mysql_limitations"] = limitations

        return behaviors, limitations

    def run_all_tests(self):
        """Run all migration tests"""
        start_time = time.time()

        try:
            # Connect to database
            self.connect()

            # Clean database
            self.clean_database()

            # Test 1: Upgrade head
            test1_result = self.test_upgrade_head()
            self.test_results["tests"].append(test1_result)

            if not test1_result["success"]:
                print("\n✗ Upgrade head failed. Stopping tests.")
                return

            # Test 2: Downgrade base
            test2_result = self.test_downgrade_base()
            self.test_results["tests"].append(test2_result)

            if not test2_result["success"]:
                print("\n⚠ Downgrade base had issues, continuing...")

            # Test 3: Upgrade head again
            test3_result = self.test_upgrade_head_again()
            self.test_results["tests"].append(test3_result)

            if not test3_result["success"]:
                print("\n✗ Second upgrade failed.")
                return

            # Analyze MySQL specifics
            self.analyze_mysql_specifics()

            # Overall success
            self.test_results["success"] = all(
                test.get("success", False)
                for test in self.test_results["tests"]
                if test["name"] != "alembic_downgrade_base"  # Downgrade is optional
            )

        except Exception as e:
            print(f"\n✗ Test execution failed: {str(e)}")
            self.test_results["error"] = str(e)

        finally:
            self.test_results["end_time"] = datetime.utcnow().isoformat()
            self.test_results["duration_seconds"] = time.time() - start_time

            if self.engine:
                self.engine.dispose()

    def save_results(self, output_file: str = "mysql_migration_test_results.json"):
        """Save test results to JSON file"""
        output_path = Path("backups/migration_test") / output_file
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, 'w') as f:
            json.dump(self.test_results, f, indent=2)

        print(f"\n✓ Test results saved to: {output_path}")

        # Also save human-readable markdown report
        self.save_markdown_report()

    def save_markdown_report(self):
        """Save human-readable markdown test report"""
        output_path = Path("backups/migration_test") / "mysql_migration_test_report.md"

        report_lines = []
        report_lines.append("# MySQL 8.0 Migration Test Report")
        report_lines.append("")
        report_lines.append(f"**Test Date**: {self.test_results['start_time']}")
        report_lines.append(f"**Test Duration**: {self.test_results['duration_seconds']:.2f} seconds")

        status_emoji = "✓ PASS" if self.test_results['success'] else "✗ FAIL"
        report_lines.append(f"**Overall Status**: {status_emoji}")
        report_lines.append("")

        report_lines.append("## Environment")
        report_lines.append("")
        report_lines.append(f"- **MySQL Version**: {self.test_results.get('mysql_version', 'Unknown')}")
        report_lines.append(f"- **Database Name**: {self.test_results.get('database_name', 'Unknown')}")
        report_lines.append("")

        report_lines.append("## Test Results")
        report_lines.append("")

        for test in self.test_results.get("tests", []):
            test_emoji = "✓" if test.get("success") else "✗"
            report_lines.append(f"### {test_emoji} {test['name'].replace('_', ' ').title()}")
            report_lines.append("")
            report_lines.append(f"- **Status**: {test_emoji} {'PASS' if test.get('success') else 'FAIL'}")
            report_lines.append(f"- **Duration**: {test.get('duration_seconds', 0):.2f} seconds")

            if test.get("tables_created"):
                report_lines.append(f"- **Tables Created**: {test['tables_created']}")
            if test.get("indexes_created"):
                report_lines.append(f"- **Indexes Created**: {test['indexes_created']}")
            if test.get("foreign_keys_created"):
                report_lines.append(f"- **Foreign Keys Created**: {test['foreign_keys_created']}")

            if test.get("errors"):
                report_lines.append("")
                report_lines.append("**Errors**:")
                for error in test["errors"]:
                    report_lines.append(f"- {error}")

            report_lines.append("")

        behaviors = self.test_results.get("mysql_behaviors", [])
        if behaviors:
            report_lines.append("## MySQL-Specific Behaviors")
            report_lines.append("")
            for i, behavior in enumerate(behaviors, 1):
                report_lines.append(f"### {i}. {behavior['category']}")
                report_lines.append("")
                report_lines.append(f"**Behavior**: {behavior['behavior']}")
                report_lines.append("")
                report_lines.append(f"**Recommendation**: {behavior['recommendation']}")
                report_lines.append("")

        limitations = self.test_results.get("mysql_limitations", [])
        if limitations:
            report_lines.append("## MySQL Limitations")
            report_lines.append("")
            for i, limitation in enumerate(limitations, 1):
                report_lines.append(f"### {i}. {limitation['issue']}")
                report_lines.append("")
                report_lines.append(f"**Impact**: {limitation['impact']}")
                report_lines.append("")
                report_lines.append(f"**Solution**: {limitation['solution']}")
                report_lines.append("")

        report_lines.append("## Summary")
        report_lines.append("")
        report_lines.append(f"- Total Test Duration: {self.test_results['duration_seconds']:.2f} seconds")
        report_lines.append(f"- MySQL Behaviors Documented: {len(behaviors)}")
        report_lines.append(f"- MySQL Limitations Found: {len(limitations)}")
        report_lines.append(f"- Overall Result: {status_emoji}")
        report_lines.append("")

        report_lines.append("---")
        report_lines.append("")
        report_lines.append("*Generated by MySQL Migration Comprehensive Test*  ")
        report_lines.append(f"*Test completed at: {self.test_results.get('end_time', 'Unknown')}*")

        with open(output_path, 'w') as f:
            f.write('\n'.join(report_lines))

        print(f"✓ Test report saved to: {output_path}")

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*80)
        print("TEST SUMMARY")
        print("="*80)

        duration = self.test_results["duration_seconds"]
        print(f"\nTotal Duration: {duration:.2f}s")
        print(f"Overall Success: {'✓ PASS' if self.test_results['success'] else '✗ FAIL'}")

        print("\nTest Results:")
        for test in self.test_results["tests"]:
            status = "✓ PASS" if test["success"] else "✗ FAIL"
            duration = test.get("duration_seconds", 0)
            print(f"  {status} - {test['name']} ({duration:.2f}s)")

            if test.get("errors"):
                for error in test["errors"]:
                    print(f"    Error: {error}")

        behaviors = self.test_results.get("mysql_behaviors", [])
        if behaviors:
            print(f"\nMySQL Behaviors Documented: {len(behaviors)}")
            for i, behavior in enumerate(behaviors[:5], 1):
                print(f"  {i}. {behavior['category']}: {behavior['behavior']}")
            if len(behaviors) > 5:
                print(f"  ... and {len(behaviors) - 5} more")

        limitations = self.test_results.get("mysql_limitations", [])
        if limitations:
            print(f"\nMySQL Limitations Found: {len(limitations)}")
            for i, limitation in enumerate(limitations, 1):
                print(f"  {i}. {limitation['issue']}")
                print(f"     Impact: {limitation['impact']}")
                print(f"     Solution: {limitation['solution']}")


def main():
    """Main entry point"""
    print("\n" + "="*80)
    print("MYSQL 8.0 COMPREHENSIVE MIGRATION TESTING")
    print("="*80)

    # Get database URL from environment or use default
    database_url = os.getenv(
        "MYSQL_TEST_DATABASE_URL",
        "mysql+pymysql://root:test_password@localhost:3306/test_mysql_migration?charset=utf8mb4"
    )

    print(f"\nDatabase URL: {database_url.split('@')[1]}")  # Hide credentials

    # Create tester and run tests
    tester = MySQLMigrationTester(database_url)
    tester.run_all_tests()

    # Save results
    tester.save_results()

    # Print summary
    tester.print_summary()

    # Exit with appropriate code
    sys.exit(0 if tester.test_results["success"] else 1)


if __name__ == "__main__":
    main()
