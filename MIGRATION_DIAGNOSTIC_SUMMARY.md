# Migration Diagnostic Tool

## Overview
A comprehensive diagnostic script (`scripts/diagnose_migrations.py`) has been implemented to identify and report on Alembic migration issues.

## Features Implemented

### 1. Alembic Command Execution
- **`alembic history`**: Retrieves and logs the complete migration chain
- **`alembic current`**: Verifies the current database version state
- Both commands handle errors gracefully (e.g., no database connection, alembic not installed)

### 2. Migration File Scanning
- Scans all Python files in `alembic/versions/` directory
- Parses each migration file to extract:
  - Revision ID
  - Down revision (parent migration)
  - Branch labels
  - Dependencies (depends_on)
  - Presence of upgrade() and downgrade() functions

### 3. Syntax Validation
- Uses Python AST (Abstract Syntax Tree) parsing to validate syntax
- Detects and reports syntax errors in migration files
- Continues processing even if individual files have errors

### 4. Duplicate Revision Detection
- Identifies multiple migration files with the same revision ID
- Reports all files containing duplicate revisions
- Critical issue that prevents proper migration chain execution

### 5. Orphaned Migration Detection
- Identifies migrations that reference non-existent parent revisions
- Detects migrations with broken down_revision links
- Reports missing parent migration IDs

### 6. Circular Dependency Detection
- Uses depth-first search (DFS) algorithm to detect cycles
- Identifies circular references in the migration chain
- Reports the complete cycle path for debugging

### 7. Migration Chain Integrity
- Validates the overall structure of the migration chain
- Identifies multiple root migrations (separate branches)
- Detects multiple leaf nodes (parallel migration endpoints)
- Finds unreachable migrations not connected to main chain

### 8. Migration Graph Visualization
- Generates text-based visual representation of migration chain
- Shows parent-child relationships
- Highlights disconnected migrations
- Helps understand the migration flow

### 9. Comprehensive Reporting
- Generates detailed report in `migration_audit_report.txt`
- Categorizes findings into:
  - **Critical Issues**: Must be fixed (duplicate IDs, orphaned migrations, etc.)
  - **Warnings**: Should be reviewed (multiple roots, missing functions, etc.)
  - **Information**: General status messages
- Includes:
  - Executive summary with counts
  - Detailed issue descriptions
  - Complete migration metadata for each file
  - Visual migration chain graph
  - Alembic command outputs

### 10. Console Output
- Displays summary to console during execution
- Shows first 10 critical issues
- Shows first 5 warnings
- Indicates report file location
- Returns exit code 1 if critical issues found, 0 otherwise

## Usage

### Running the Script
```bash
python scripts/diagnose_migrations.py
```

### Output Files
- **`migration_audit_report.txt`**: Complete diagnostic report (added to .gitignore)

### Exit Codes
- `0`: All checks passed (warnings may exist)
- `1`: Critical issues found that need fixing

## Integration

### Documentation
- Updated `scripts/README.md` with comprehensive usage instructions
- Added examples and feature descriptions
- Documented expected output format

### Git Configuration
- Added `migration_audit_report.txt` to `.gitignore`
- Ensures diagnostic reports are not committed to repository

## Issues Detected

The diagnostic script can identify:

1. **Duplicate Revision IDs**
   - Multiple files using same revision identifier
   - Prevents proper migration execution
   
2. **Syntax Errors**
   - Python syntax errors in migration files
   - Invalid code that won't execute
   
3. **Orphaned Migrations**
   - Migrations referencing non-existent parent revisions
   - Broken migration chain links
   
4. **Circular Dependencies**
   - Cycles in the migration chain
   - Prevents proper migration ordering
   
5. **Missing Functions**
   - Migrations without upgrade() or downgrade() functions
   - May cause runtime errors
   
6. **Chain Gaps**
   - Multiple root migrations (separate branches)
   - Multiple leaf nodes (parallel endpoints)
   - Unreachable migrations

## Technical Implementation

### Key Components

1. **MigrationDiagnostics Class**
   - Main orchestrator for all diagnostic operations
   - Manages state and logging
   - Coordinates all checks

2. **File Parsing**
   - Regular expressions for metadata extraction
   - AST parsing for syntax validation
   - Robust error handling

3. **Graph Algorithms**
   - DFS for cycle detection
   - Chain traversal for integrity checking
   - Reachability analysis

4. **Report Generation**
   - Structured output format
   - Multiple severity levels
   - Comprehensive detail sections

### Error Handling
- Graceful handling of missing alembic installation
- Continues processing despite individual file errors
- Reports all errors without stopping execution
- Handles missing database connections

## Example Output

```
Starting Alembic Migration Diagnostics...
======================================================================

Report generated: /path/to/migration_audit_report.txt

======================================================================
DIAGNOSTIC SUMMARY
======================================================================
Critical Issues: 5
Warnings: 3
Total Migrations: 67

Critical Issues Found:
  - [ISSUE] Duplicate revision ID '001' found in files: 001_create_multi_tenant_schema.py, 001_add_dashboard_widgets.py
  - [ISSUE] Duplicate revision ID '014' found in files: 014_add_institution_logo.py, 014_create_assignment_rubric_tables.py
  - [ISSUE] Duplicate revision ID '015' found in files: 015_add_user_device_table.py, 015_add_ml_training_config.py
  - [ISSUE] Duplicate revision ID '018' found in files: 018_add_impersonation_debugging_tables.py, 018_create_plagiarism_detection_tables.py
  - [ISSUE] Orphaned migration '001_dashboard_widgets' in 001_add_dashboard_widgets.py: references non-existent down_revision '005'

======================================================================
```

## Next Steps

After running the diagnostic script:

1. Review `migration_audit_report.txt` for detailed findings
2. Fix critical issues (duplicates, orphaned migrations)
3. Resolve any syntax errors
4. Address warnings as needed
5. Re-run diagnostic to verify fixes
6. Update migration files to resolve conflicts
7. Test migration chain with `alembic upgrade head`

## Maintenance

- Run diagnostic script before major releases
- Include in CI/CD pipeline for automated checking
- Review report after adding new migrations
- Keep migration chain clean and linear when possible
