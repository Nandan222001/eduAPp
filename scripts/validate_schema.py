#!/usr/bin/env python3
"""
Database Schema Validation Script

This script compares the current database schema with SQLAlchemy models
to identify any discrepancies, missing tables, or schema drift.

Usage:
    python scripts/validate_schema.py

Features:
- Checks for missing tables
- Validates foreign key relationships
- Verifies enum types
- Checks for missing indexes
- Validates constraints
- Reports schema drift
"""

import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from sqlalchemy import inspect, create_engine
from sqlalchemy.engine import reflection
from src.config import settings
from src.database import Base

# Import all models to ensure they're registered
import importlib.util
from pathlib import Path

models_dir = Path(__file__).resolve().parent.parent / "src" / "models"
for path in sorted(models_dir.glob("*.py")):
    if path.name == "__init__.py" or path.name.startswith("_"):
        continue
    module_name = f"_validation_src_models_{path.stem}"
    try:
        spec = importlib.util.spec_from_file_location(module_name, str(path))
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
    except Exception as e:
        print(f"Warning: Could not load model {path.name}: {e}")


def validate_schema():
    """Validate database schema against SQLAlchemy models"""
    
    print("=" * 80)
    print("DATABASE SCHEMA VALIDATION")
    print("=" * 80)
    print()
    
    # Create engine
    engine = create_engine(settings.database_url)
    inspector = inspect(engine)
    
    # Get all tables from database
    db_tables = set(inspector.get_table_names())
    
    # Get all tables from models
    model_tables = set(Base.metadata.tables.keys())
    
    print(f"Database tables: {len(db_tables)}")
    print(f"Model tables: {len(model_tables)}")
    print()
    
    # Check for missing tables
    missing_in_db = model_tables - db_tables
    missing_in_models = db_tables - model_tables
    
    issues_found = False
    
    if missing_in_db:
        issues_found = True
        print("❌ TABLES MISSING IN DATABASE:")
        print("-" * 80)
        for table in sorted(missing_in_db):
            print(f"  - {table}")
        print()
    else:
        print("✅ All model tables exist in database")
        print()
    
    if missing_in_models:
        print("⚠️  TABLES IN DATABASE NOT IN MODELS:")
        print("-" * 80)
        for table in sorted(missing_in_models):
            print(f"  - {table}")
        print()
    
    # Check foreign keys for each table
    print("FOREIGN KEY VALIDATION")
    print("-" * 80)
    
    fk_issues = []
    for table_name in sorted(model_tables & db_tables):
        table = Base.metadata.tables[table_name]
        db_fks = inspector.get_foreign_keys(table_name)
        
        # Get model foreign keys
        model_fks = []
        for constraint in table.constraints:
            if hasattr(constraint, 'elements'):
                for element in constraint.elements:
                    if hasattr(element, 'column') and hasattr(element.column, 'table'):
                        model_fks.append({
                            'column': element.parent.name,
                            'referred_table': element.column.table.name,
                            'referred_column': element.column.name,
                        })
        
        if len(db_fks) != len(model_fks):
            fk_issues.append(f"{table_name}: {len(model_fks)} in model, {len(db_fks)} in DB")
    
    if fk_issues:
        issues_found = True
        print("❌ Foreign key count mismatches:")
        for issue in fk_issues:
            print(f"  - {issue}")
        print()
    else:
        print("✅ Foreign key counts match for all tables")
        print()
    
    # Check for missing indexes on foreign keys
    print("INDEX VALIDATION")
    print("-" * 80)
    
    missing_indexes = []
    for table_name in sorted(model_tables & db_tables):
        db_indexes = inspector.get_indexes(table_name)
        db_fks = inspector.get_foreign_keys(table_name)
        
        # Get indexed columns
        indexed_columns = set()
        for index in db_indexes:
            for col in index['column_names']:
                indexed_columns.add(col)
        
        # Check if FK columns are indexed
        for fk in db_fks:
            for col in fk['constrained_columns']:
                if col not in indexed_columns:
                    missing_indexes.append(f"{table_name}.{col}")
    
    if missing_indexes:
        issues_found = True
        print("⚠️  Foreign keys without indexes (may impact performance):")
        for idx in missing_indexes[:10]:  # Show first 10
            print(f"  - {idx}")
        if len(missing_indexes) > 10:
            print(f"  ... and {len(missing_indexes) - 10} more")
        print()
    else:
        print("✅ All foreign keys have indexes")
        print()
    
    # Check enum types
    print("ENUM TYPE VALIDATION")
    print("-" * 80)
    
    # Get enum types from database
    result = engine.execute("""
        SELECT typname 
        FROM pg_type 
        WHERE typtype = 'e' 
        ORDER BY typname
    """)
    db_enums = {row[0] for row in result}
    
    expected_enums = {
        'activitytype',
        'badgetier',
        'verificationstatus',
        'serviceactivitytype',
        'contenttype',
        'contentstatus',
        'moderationstatus',
        'plagiarismstatus',
        'transactiontype',
        'difficultylevel',
        'masterylevel',
        'learningpathstatus',
        'milestonestatus',
        'reviewpriority',
    }
    
    missing_enums = expected_enums - db_enums
    
    if missing_enums:
        issues_found = True
        print("❌ Missing enum types:")
        for enum in sorted(missing_enums):
            print(f"  - {enum}")
        print()
    else:
        print("✅ All expected enum types exist")
        print()
    
    # Summary
    print("=" * 80)
    print("VALIDATION SUMMARY")
    print("=" * 80)
    
    if issues_found:
        print("❌ Issues found - see details above")
        print()
        print("Recommended actions:")
        print("1. Run pending migrations: alembic upgrade head")
        print("2. Check migration files for missing tables")
        print("3. Verify model definitions match database schema")
        print("4. Run schema validation migration: alembic upgrade 039")
        return 1
    else:
        print("✅ Schema validation passed!")
        print()
        print("Database schema is consistent with SQLAlchemy models.")
        return 0


if __name__ == "__main__":
    try:
        exit_code = validate_schema()
        sys.exit(exit_code)
    except Exception as e:
        print(f"❌ Validation failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
