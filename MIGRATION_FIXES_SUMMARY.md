# MySQL Migration Fixes Summary

## Overview

This document summarizes the fixes applied to Alembic migration files to resolve MySQL "1067 Invalid default value" errors for datetime columns.

## Problem

MySQL 5.7+ enforces strict SQL modes that prevent invalid default values for datetime columns. The original migration files used:
- `sa.DateTime()` without `timezone=False` parameter
- `server_default=sa.text('now()')` which is PostgreSQL syntax
- Missing `ON UPDATE CURRENT_TIMESTAMP` for `updated_at` columns

These caused the "1067 Invalid default value" error when creating tables with datetime columns.

## Solution

All migration files have been updated to use MySQL-compatible syntax:

### Changes Applied

1. **DateTime Declaration**: Changed from `sa.DateTime()` to `sa.DateTime(timezone=False)`
2. **created_at columns**: Changed from `server_default=sa.text('now()')` to `server_default=sa.text('CURRENT_TIMESTAMP')`
3. **updated_at columns**: Changed to `server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')`

## Files Fixed

### Fully Fixed Files

1. **004_create_subscription_billing_tables.py**
   - Fixed `subscriptions` table (all datetime columns)
   - Fixed `payments` table (all datetime columns)
   - Fixed `invoices` table (all datetime columns)
   - Fixed `usage_records` table (all datetime columns)

2. **008_create_examination_tables.py**
   - Fixed `exam_subjects` table
   - Fixed `exam_schedules` table
   - Fixed `exam_marks` table
   - Fixed `exam_results` table
   - Fixed `exam_performance_analytics` table
   - **Partial**: `exams` and `grade_configurations` tables still need fixing

### Files That Need Fixing

The following files still contain `now()` and need to be fixed:

1. **010_create_study_planner_tables.py**
2. **011_create_weakness_detection_tables.py**
3. **013_create_parent_linking_tables.py**
4. **014_create_assignment_rubric_tables.py**
5. **015_add_user_device_table.py**
6. **019_create_career_pathway_tables.py**

## How to Complete the Fixes

### Option 1: Using the fix_all_migrations.py Script

```bash
python fix_all_migrations.py
```

This script will:
- Scan all migration files
- Replace `sa.DateTime()` with `sa.DateTime(timezone=False)`
- Replace `server_default=sa.text('now()')` with `server_default=sa.text('CURRENT_TIMESTAMP')`
- Add `ON UPDATE CURRENT_TIMESTAMP` to `updated_at` columns

### Option 2: Manual Fixing

For each migration file, make the following replacements:

**Find:**
```python
sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()'))
```

**Replace with:**
```python
sa.Column('created_at', sa.DateTime(timezone=False), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'))
```

**Find:**
```python
sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()'))
```

**Replace with:**
```python
sa.Column('updated_at', sa.DateTime(timezone=False), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))
```

**Find:**
```python
sa.Column('any_datetime_column', sa.DateTime(), ...)
```

**Replace with:**
```python
sa.Column('any_datetime_column', sa.DateTime(timezone=False), ...)
```

## Testing the Fixes

After fixing all migration files:

### 1. Setup Database

Ensure MySQL is running and create/configure the database:

```bash
# Using Docker
docker-compose up -d db

# Or create database manually
mysql -u root -p
CREATE DATABASE fastapi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Configure Environment

Create `.env` file with database credentials:

```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=root
DATABASE_NAME=fastapi_db
```

### 3. Run Migrations

```powershell
# Using the provided script
.\run_migrations.ps1

# Or manually
alembic downgrade base
alembic upgrade head
alembic current
```

### 4. Verify Success

Check that:
- ✅ No "1067 Invalid default value" errors appear
- ✅ All tables are created successfully
- ✅ The `subscriptions` table exists with correct schema
- ✅ Datetime columns have `CURRENT_TIMESTAMP` defaults

## Expected Table Schema

After successful migration, the `subscriptions` table should have:

```sql
CREATE TABLE subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    billing_cycle VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    max_users INT NULL,
    max_storage_gb INT NULL,
    features TEXT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NULL,
    trial_end_date DATETIME NULL,
    grace_period_end DATETIME NULL,
    canceled_at DATETIME NULL,
    next_billing_date DATETIME NULL,
    auto_renew BOOLEAN NOT NULL DEFAULT 1,
    external_subscription_id VARCHAR(255) NULL,
    razorpay_subscription_id VARCHAR(255) NULL,
    razorpay_customer_id VARCHAR(255) NULL,
    metadata TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
);
```

## Tools Provided

1. **run_migrations.ps1**: PowerShell script to run migrations with verification
2. **run_migrations.py**: Python script to run migrations with verification
3. **fix_all_migrations.py**: Script to automatically fix all migration files
4. **MIGRATION_SETUP_GUIDE.md**: Detailed setup and testing guide

## Next Steps

1. Complete fixing the remaining migration files (listed above)
2. Run the migrations using the provided scripts
3. Verify all tables are created without errors
4. Test the application to ensure everything works correctly

## Notes

- These fixes are specifically for MySQL compatibility
- The changes do not affect PostgreSQL deployments
- Always backup your database before running migrations
- Test in a development environment first

## References

- MySQL Documentation: [DATETIME Default Values](https://dev.mysql.com/doc/refman/8.0/en/datetime.html)
- SQLAlchemy MySQL Dialect: [MySQL Specific Features](https://docs.sqlalchemy.org/en/14/dialects/mysql.html)
- Alembic Documentation: [Auto Generating Migrations](https://alembic.sqlalchemy.org/en/latest/autogenerate.html)
