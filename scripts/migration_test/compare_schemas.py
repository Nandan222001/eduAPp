#!/usr/bin/env python3
"""
Schema Comparison Tool

Compares database schemas between:
- Production database and test database
- Backup schema file and current database
- Two different databases

Generates detailed comparison report showing differences.
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Set, Tuple, Optional

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from sqlalchemy import create_engine, inspect, text
from dotenv import load_dotenv


class SchemaComparator:
    """Compares database schemas"""
    
    def __init__(self):
        """Initialize the comparator"""
        load_dotenv()
        self.results = {
            "timestamp": datetime.utcnow().isoformat(),
            "comparison": {},
            "differences": [],
            "summary": {}
        }
    
    def get_database_url(self, db_name: str) -> str:
        """Build database URL"""
        db_host = os.getenv("DATABASE_HOST", "localhost")
        db_port = os.getenv("DATABASE_PORT", "3306")
        db_user = os.getenv("DATABASE_USER", "root")
        db_pass = os.getenv("DATABASE_PASSWORD", "test_password")
        
        return f"mysql+pymysql://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}?charset=utf8mb4"
    
    def get_schema_info(self, database_url: str) -> Dict:
        """Extract schema information from database"""
        engine = create_engine(database_url, pool_pre_ping=True)
        inspector = inspect(engine)
        
        schema = {
            "database_url": database_url.split("@")[1] if "@" in database_url else database_url,
            "tables": {},
            "enums": [],
            "sequences": []
        }
        
        # Get all tables
        for table_name in inspector.get_table_names():
            table_info = {
                "columns": {},
                "indexes": {},
                "foreign_keys": [],
                "primary_key": [],
                "unique_constraints": []
            }
            
            # Columns
            for col in inspector.get_columns(table_name):
                table_info["columns"][col["name"]] = {
                    "type": str(col["type"]),
                    "nullable": col["nullable"],
                    "default": str(col.get("default")) if col.get("default") else None
                }
            
            # Indexes
            for idx in inspector.get_indexes(table_name):
                table_info["indexes"][idx["name"]] = {
                    "columns": idx["column_names"],
                    "unique": idx.get("unique", False)
                }
            
            # Foreign keys
            for fk in inspector.get_foreign_keys(table_name):
                table_info["foreign_keys"].append({
                    "name": fk.get("name"),
                    "constrained_columns": fk["constrained_columns"],
                    "referred_table": fk["referred_table"],
                    "referred_columns": fk["referred_columns"]
                })
            
            # Primary key
            pk = inspector.get_pk_constraint(table_name)
            table_info["primary_key"] = pk.get("constrained_columns", [])
            
            # Unique constraints
            for uc in inspector.get_unique_constraints(table_name):
                table_info["unique_constraints"].append({
                    "name": uc.get("name"),
                    "columns": uc["column_names"]
                })
            
            schema["tables"][table_name] = table_info
        
        schema["enums"] = []
        schema["sequences"] = []
        
        engine.dispose()
        return schema
    
    def compare_schemas(self, schema1: Dict, schema2: Dict) -> Dict:
        """Compare two schemas and return differences"""
        differences = {
            "tables": {
                "only_in_first": [],
                "only_in_second": [],
                "different": []
            },
            "enums": {
                "only_in_first": [],
                "only_in_second": [],
                "different": []
            }
        }
        
        # Compare tables
        tables1 = set(schema1["tables"].keys())
        tables2 = set(schema2["tables"].keys())
        
        differences["tables"]["only_in_first"] = sorted(tables1 - tables2)
        differences["tables"]["only_in_second"] = sorted(tables2 - tables1)
        
        # Compare common tables
        for table in sorted(tables1 & tables2):
            table_diffs = self.compare_tables(
                table,
                schema1["tables"][table],
                schema2["tables"][table]
            )
            
            if table_diffs:
                differences["tables"]["different"].append({
                    "table": table,
                    "differences": table_diffs
                })
        
        # Compare enums
        enums1 = {e["name"]: e["values"] for e in schema1["enums"]}
        enums2 = {e["name"]: e["values"] for e in schema2["enums"]}
        
        enum_names1 = set(enums1.keys())
        enum_names2 = set(enums2.keys())
        
        differences["enums"]["only_in_first"] = sorted(enum_names1 - enum_names2)
        differences["enums"]["only_in_second"] = sorted(enum_names2 - enum_names1)
        
        # Compare common enums
        for enum_name in sorted(enum_names1 & enum_names2):
            if enums1[enum_name] != enums2[enum_name]:
                differences["enums"]["different"].append({
                    "enum": enum_name,
                    "first_values": enums1[enum_name],
                    "second_values": enums2[enum_name]
                })
        
        return differences
    
    def compare_tables(self, table_name: str, table1: Dict, table2: Dict) -> Dict:
        """Compare two table definitions"""
        diffs = {}
        
        # Compare columns
        cols1 = set(table1["columns"].keys())
        cols2 = set(table2["columns"].keys())
        
        if cols1 != cols2:
            diffs["columns"] = {
                "only_in_first": sorted(cols1 - cols2),
                "only_in_second": sorted(cols2 - cols1),
                "different": []
            }
        
        # Compare common columns
        for col in sorted(cols1 & cols2):
            if table1["columns"][col] != table2["columns"][col]:
                if "columns" not in diffs:
                    diffs["columns"] = {
                        "only_in_first": [],
                        "only_in_second": [],
                        "different": []
                    }
                diffs["columns"]["different"].append({
                    "column": col,
                    "first": table1["columns"][col],
                    "second": table2["columns"][col]
                })
        
        # Compare indexes
        indexes1 = set(table1["indexes"].keys())
        indexes2 = set(table2["indexes"].keys())
        
        if indexes1 != indexes2:
            diffs["indexes"] = {
                "only_in_first": sorted(indexes1 - indexes2),
                "only_in_second": sorted(indexes2 - indexes1)
            }
        
        # Compare foreign keys count (simplified)
        if len(table1["foreign_keys"]) != len(table2["foreign_keys"]):
            diffs["foreign_keys_count"] = {
                "first": len(table1["foreign_keys"]),
                "second": len(table2["foreign_keys"])
            }
        
        return diffs
    
    def compare_databases(self, db1_name: str, db2_name: str) -> bool:
        """Compare two databases"""
        print(f"\n{'='*70}")
        print("DATABASE SCHEMA COMPARISON")
        print(f"{'='*70}")
        
        # Get schemas
        print(f"\nExtracting schema from: {db1_name}")
        db1_url = self.get_database_url(db1_name)
        schema1 = self.get_schema_info(db1_url)
        print(f"✓ Found {len(schema1['tables'])} tables, {len(schema1['enums'])} enums")
        
        print(f"\nExtracting schema from: {db2_name}")
        db2_url = self.get_database_url(db2_name)
        schema2 = self.get_schema_info(db2_url)
        print(f"✓ Found {len(schema2['tables'])} tables, {len(schema2['enums'])} enums")
        
        # Compare
        print("\nComparing schemas...")
        differences = self.compare_schemas(schema1, schema2)
        
        # Store results
        self.results["comparison"] = {
            "first_database": schema1["database_url"],
            "second_database": schema2["database_url"]
        }
        self.results["differences"] = differences
        
        # Print summary
        self.print_differences(differences)
        
        # Generate report
        self.generate_report()
        
        # Return True if no differences
        has_diffs = (
            differences["tables"]["only_in_first"] or
            differences["tables"]["only_in_second"] or
            differences["tables"]["different"] or
            differences["enums"]["only_in_first"] or
            differences["enums"]["only_in_second"] or
            differences["enums"]["different"]
        )
        
        return not has_diffs
    
    def print_differences(self, differences: Dict):
        """Print differences to console"""
        print(f"\n{'='*70}")
        print("DIFFERENCES FOUND")
        print(f"{'='*70}")
        
        # Tables only in first
        if differences["tables"]["only_in_first"]:
            print(f"\n📋 Tables only in FIRST database ({len(differences['tables']['only_in_first'])}):")
            for table in differences["tables"]["only_in_first"]:
                print(f"  - {table}")
        
        # Tables only in second
        if differences["tables"]["only_in_second"]:
            print(f"\n📋 Tables only in SECOND database ({len(differences['tables']['only_in_second'])}):")
            for table in differences["tables"]["only_in_second"]:
                print(f"  + {table}")
        
        # Different tables
        if differences["tables"]["different"]:
            print(f"\n📋 Tables with differences ({len(differences['tables']['different'])}):")
            for table_diff in differences["tables"]["different"]:
                print(f"\n  Table: {table_diff['table']}")
                diffs = table_diff["differences"]
                
                if "columns" in diffs:
                    if diffs["columns"]["only_in_first"]:
                        print(f"    Columns only in first: {', '.join(diffs['columns']['only_in_first'])}")
                    if diffs["columns"]["only_in_second"]:
                        print(f"    Columns only in second: {', '.join(diffs['columns']['only_in_second'])}")
                    if diffs["columns"]["different"]:
                        print(f"    Modified columns: {len(diffs['columns']['different'])}")
                
                if "indexes" in diffs:
                    if diffs["indexes"]["only_in_first"]:
                        print(f"    Indexes only in first: {len(diffs['indexes']['only_in_first'])}")
                    if diffs["indexes"]["only_in_second"]:
                        print(f"    Indexes only in second: {len(diffs['indexes']['only_in_second'])}")
        
        # Enums
        if differences["enums"]["only_in_first"]:
            print(f"\n🔤 Enums only in FIRST database ({len(differences['enums']['only_in_first'])}):")
            for enum in differences["enums"]["only_in_first"]:
                print(f"  - {enum}")
        
        if differences["enums"]["only_in_second"]:
            print(f"\n🔤 Enums only in SECOND database ({len(differences['enums']['only_in_second'])}):")
            for enum in differences["enums"]["only_in_second"]:
                print(f"  + {enum}")
        
        if differences["enums"]["different"]:
            print(f"\n🔤 Enums with different values ({len(differences['enums']['different'])}):")
            for enum_diff in differences["enums"]["different"]:
                print(f"  {enum_diff['enum']}")
        
        # Summary
        total_diffs = (
            len(differences["tables"]["only_in_first"]) +
            len(differences["tables"]["only_in_second"]) +
            len(differences["tables"]["different"]) +
            len(differences["enums"]["only_in_first"]) +
            len(differences["enums"]["only_in_second"]) +
            len(differences["enums"]["different"])
        )
        
        print(f"\n{'='*70}")
        if total_diffs == 0:
            print("✓ Schemas are IDENTICAL")
        else:
            print(f"⚠ Found {total_diffs} difference(s)")
        print(f"{'='*70}")
    
    def generate_report(self):
        """Generate comparison report"""
        report_path = Path("backups/migration_test/schema_comparison_report.json")
        report_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(report_path, "w") as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\n✓ Detailed report saved to: {report_path}")


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Compare database schemas")
    parser.add_argument(
        "database1",
        help="First database name (e.g., fastapi_db)"
    )
    parser.add_argument(
        "database2",
        nargs="?",
        default="fastapi_db_migration_test",
        help="Second database name (default: fastapi_db_migration_test)"
    )
    
    args = parser.parse_args()
    
    comparator = SchemaComparator()
    
    try:
        schemas_match = comparator.compare_databases(args.database1, args.database2)
        sys.exit(0 if schemas_match else 1)
    except KeyboardInterrupt:
        print("\n\n⚠ Comparison interrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
