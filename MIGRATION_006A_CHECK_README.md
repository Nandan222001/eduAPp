# Migration 006a Database State Check

## Overview

This documentation provides comprehensive tools and instructions to check whether migration 006a has been successfully applied to the database, specifically verifying the existence of the `questions_bank` table and related tables.

## Files Created

1. **MIGRATION_006A_DIAGNOSTIC_REPORT.md** - Comprehensive analysis document
   - Detailed breakdown of migration 006a
   - All tables and schemas created by the migration
   - Foreign key dependencies
   - Troubleshooting guide
   - Recommendations based on different scenarios

2. **check_migration_006a.sql** - SQL diagnostic script
   - Comprehensive SQL script to check migration state
   - Can be run directly in MySQL command line or GUI tools
   - Provides detailed report on tables, indexes, and foreign keys
   - Includes summary and recommendations

3. **check_migration_006a_status.py** - Python diagnostic script
   - Standalone Python script to check database state
   - Connects directly to MySQL using pymysql
   - Provides formatted console output with clear status indicators
   - Requires pymysql to be installed

4. **run_migration_006a_diagnostic.ps1** - PowerShell guide script
   - Interactive PowerShell script
   - Provides step-by-step instructions for all diagnostic methods
   - Includes troubleshooting tips
   - Shows database configuration from .env file

## Quick Start

### Method 1: Using Alembic (Fastest)

```bash
alembic current
```

**Expected Output:**
- `006a` or later = Migration complete ✓
- `006` or earlier = Migration needs to be run
- Error = Database connectivity issue

### Method 2: Using SQL Script (Most Comprehensive)

```bash
mysql -h localhost -u mysql -p mysql_db < check_migration_006a.sql
```

This will generate a detailed report showing:
- Current migration version
- All tables from migration 006a
- Table structures and indexes
- Row counts
- Summary and recommendations

### Method 3: Using PowerShell Guide

```powershell
.\run_migration_006a_diagnostic.ps1
```

This interactive script will:
- Read your database configuration
- Show all available diagnostic methods
- Provide troubleshooting steps
- Guide you through the process

### Method 4: Simple MySQL Query

Connect to MySQL and run:

```sql
SHOW TABLES LIKE 'questions_bank';
```

If the table name appears, the table exists.

## What Migration 006a Creates

Migration 006a creates three tables:

### 1. previous_year_papers
Stores previous year examination papers with metadata, PDF information, and OCR text.

### 2. questions_bank ⭐
Stores individual questions extracted from papers or created independently, with:
- Question text and type
- Difficulty level and Bloom's taxonomy level
- Answer options and correct answers
- Linking to subjects, chapters, and topics

### 3. topic_predictions
Stores AI-based predictions for which topics are likely to appear in upcoming exams.

## Troubleshooting Database Connection

If you're getting connection errors:

### Check MySQL Service
```powershell
Get-Service | Where-Object { $_.Name -like '*mysql*' }
```

### Verify Database Exists
```sql
SHOW DATABASES LIKE 'mysql_db';
```

### Check Credentials
Verify in `.env` file:
```
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=mysql
DATABASE_PASSWORD=mysql_password
DATABASE_NAME=mysql_db
```

### Grant Permissions (if needed)
```sql
GRANT ALL PRIVILEGES ON mysql_db.* TO 'mysql'@'localhost';
FLUSH PRIVILEGES;
```

## Decision Tree

```
Do you have database connectivity?
│
├─ NO → Fix connectivity first (see Troubleshooting section)
│
└─ YES → Can you run alembic current?
    │
    ├─ NO → Use SQL script method (check_migration_006a.sql)
    │
    └─ YES → Check version output
        │
        ├─ Version >= 006a → Migration complete ✓
        │
        ├─ Version < 006a → Run: alembic upgrade 006a
        │
        └─ Error/No version → Check if tables exist manually
            │
            ├─ All 3 tables exist → Run: alembic stamp 006a
            │
            ├─ Some tables exist → Run: alembic downgrade 006
            │                       Then: alembic upgrade 006a
            │
            └─ No tables exist → Run: alembic upgrade 006a
```

## Common Scenarios

### Scenario 1: Fresh Database
**Status:** No migrations run yet

**Action:**
```bash
alembic upgrade head
```

### Scenario 2: Migration 006a Not Run
**Status:** Version shows 006 or earlier

**Action:**
```bash
alembic upgrade 006a
```

### Scenario 3: Migration Partially Applied
**Status:** Some but not all tables exist

**Action:**
```bash
alembic downgrade 006
alembic upgrade 006a
```

### Scenario 4: Tables Exist, Version Wrong
**Status:** All tables exist but version doesn't reflect this

**Action:**
```bash
alembic stamp 006a
```

### Scenario 5: Everything Correct
**Status:** All tables exist, version is 006a or later

**Action:** None needed ✓

## Verification Checklist

After running diagnostics, verify:

- [ ] Database connectivity is working
- [ ] Current migration version is known
- [ ] `previous_year_papers` table status is confirmed
- [ ] `questions_bank` table status is confirmed
- [ ] `topic_predictions` table status is confirmed
- [ ] Action plan is determined based on findings

## Next Steps After Check

Once you've determined the current state:

1. **Document your findings** in a summary document
2. **Take the recommended action** (upgrade, downgrade+upgrade, stamp, or none)
3. **Verify the action was successful** by re-running diagnostics
4. **Update any dependent systems** that rely on these tables

## Support

For additional help:
- Review `MIGRATION_006A_DIAGNOSTIC_REPORT.md` for detailed analysis
- Check alembic logs in the `logs` directory (if configured)
- Review migration file at `alembic/versions/006a_create_previous_year_papers_tables.py`

## Summary

The diagnostic tools provided offer multiple ways to check the status of migration 006a:
- **Alembic command** - Fastest way to check version
- **SQL script** - Most comprehensive database state report
- **Python script** - Automated checking with formatted output
- **PowerShell guide** - Interactive step-by-step assistance

Choose the method that best fits your environment and needs.
