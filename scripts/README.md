# Scripts

This directory contains utility scripts for managing the application.

## diagnose_migrations.py

Comprehensive diagnostic tool for analyzing Alembic migration health and identifying issues.

**Features:**
- Executes `alembic history` to view the complete migration chain
- Executes `alembic current` to verify database version state
- Scans all migration files for duplicate revision IDs
- Validates Python syntax using AST parsing
- Identifies orphaned migrations without proper down_revision links
- Detects circular dependencies in migration chain
- Checks for gaps and conflicts in migration chain
- Generates a detailed audit report to `migration_audit_report.txt`

**Usage:**
```bash
python scripts/diagnose_migrations.py
```

The script will:
1. Scan all migration files in `alembic/versions/`
2. Parse each migration file to extract metadata (revision, down_revision, etc.)
3. Run comprehensive checks for common migration issues
4. Execute alembic commands to verify database state
5. Generate a detailed report at `migration_audit_report.txt`

**Exit Codes:**
- `0`: All checks passed (warnings may exist)
- `1`: Critical issues found

**Issues Detected:**
- Duplicate revision IDs across multiple files
- Syntax errors in migration files
- Orphaned migrations referencing non-existent parent revisions
- Circular dependencies in migration chain
- Missing upgrade() or downgrade() functions

**Output:**
The script generates `migration_audit_report.txt` containing:
- Summary of issues, warnings, and info messages
- Detailed list of all critical issues
- Complete migration details for each revision
- Visual migration chain graph
- Alembic history output
- Current database version state

**Example:**
```bash
$ python scripts/diagnose_migrations.py
Starting Alembic Migration Diagnostics...
======================================================================

Report generated: /path/to/migration_audit_report.txt

======================================================================
DIAGNOSTIC SUMMARY
======================================================================
Critical Issues: 3
Warnings: 2
Total Migrations: 67
```

## create_admin.py

Creates an admin user for the application.

**Prerequisites:**
- Database migrations must be run first (`alembic upgrade head`)
- Permissions and roles must be seeded (migration 002)

**Usage:**
```bash
python scripts/create_admin.py
```

The script will prompt you for:
- Admin email
- Admin username
- Admin password (minimum 8 characters)
- First name (optional, defaults to "Admin")
- Last name (optional, defaults to "User")

The script will:
1. Create a default institution if it doesn't exist
2. Create an admin user with super admin role
3. Set the user as a superuser with all permissions

**Example:**
```bash
$ python scripts/create_admin.py
Create Admin User Script
============================================================
Enter admin email: admin@example.com
Enter admin username: admin
Enter admin password (min 8 characters): ********
Enter first name (default: Admin): Admin
Enter last name (default: User): User

Creating admin user with:
  Email: admin@example.com
  Username: admin
  Name: Admin User

Proceed? (y/n): y

Using existing institution: Default Institution (ID: 1)

============================================================
Admin user created successfully!
============================================================
Email: admin@example.com
Username: admin
Name: Admin User
Institution: Default Institution
Role: Super Admin
Is Superuser: True
============================================================
```
