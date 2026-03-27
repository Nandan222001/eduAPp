# Migration 006a Diagnostic Flowchart

## Overview

This document provides a visual flowchart to guide you through checking and resolving migration 006a status.

---

## Main Diagnostic Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    START: Check Migration 006a                  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Can connect to DB?   │
                    └───────────┬───────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                   NO                      YES
                    │                       │
                    ▼                       ▼
        ┌───────────────────┐   ┌──────────────────────┐
        │ FIX CONNECTIVITY  │   │  Run: alembic current│
        │   See Section A   │   └──────────┬───────────┘
        └───────────────────┘              │
                                           ▼
                            ┌──────────────────────────┐
                            │  Command successful?     │
                            └──────────┬───────────────┘
                                       │
                        ┌──────────────┴──────────────┐
                        │                             │
                       NO                            YES
                        │                             │
                        ▼                             ▼
            ┌─────────────────────┐      ┌───────────────────────┐
            │  Use SQL Method     │      │  Check Version Output │
            │  See Section B      │      │    See Section C      │
            └─────────────────────┘      └───────────────────────┘
```

---

## Section A: Fix Database Connectivity

```
┌─────────────────────────────────────────────────────────────────┐
│                    Database Connection Issues                    │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ Is MySQL running?     │
                    └───────────┬───────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                   NO                      YES
                    │                       │
                    ▼                       ▼
        ┌───────────────────┐   ┌──────────────────────┐
        │  Start MySQL      │   │  Does database exist?│
        │  Service          │   │  SHOW DATABASES;     │
        └───────────────────┘   └──────────┬───────────┘
                                           │
                        ┌──────────────────┴──────────────┐
                        │                                 │
                       NO                                YES
                        │                                 │
                        ▼                                 ▼
            ┌─────────────────────┐      ┌───────────────────────┐
            │  CREATE DATABASE    │      │  Are credentials OK?  │
            │  mysql_db;          │      │  Test login           │
            └─────────────────────┘      └───────────┬───────────┘
                                                     │
                                    ┌────────────────┴────────────────┐
                                    │                                 │
                                   NO                                YES
                                    │                                 │
                                    ▼                                 ▼
                        ┌─────────────────────┐      ┌──────────────────────┐
                        │  Update .env file   │      │  GRANT permissions   │
                        │  with correct creds │      │  to user if needed   │
                        └─────────────────────┘      └──────────────────────┘
                                                                │
                                                                ▼
                                                    ┌──────────────────────┐
                                                    │  Retry alembic       │
                                                    │  current             │
                                                    └──────────────────────┘
```

**Commands:**
```powershell
# Check MySQL service
Get-Service | Where-Object { $_.Name -like '*mysql*' }

# Start MySQL if stopped
Start-Service MySQL

# Connect to MySQL
mysql -u root -p

# Create database if needed
CREATE DATABASE IF NOT EXISTS mysql_db;

# Grant permissions
GRANT ALL PRIVILEGES ON mysql_db.* TO 'mysql'@'localhost';
FLUSH PRIVILEGES;
```

---

## Section B: SQL Diagnostic Method

```
┌─────────────────────────────────────────────────────────────────┐
│                      SQL Diagnostic Path                         │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
                ┌───────────────────────────────┐
                │  Run check_migration_006a.sql │
                │  mysql ... < script.sql       │
                └───────────────┬───────────────┘
                                │
                                ▼
                ┌───────────────────────────────┐
                │  Review Output Report         │
                └───────────────┬───────────────┘
                                │
                                ▼
                ┌───────────────────────────────┐
                │  How many tables exist?       │
                └───────────────┬───────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
       0 TABLES             1-2 TABLES              3 TABLES
        │                       │                       │
        ▼                       ▼                       ▼
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ Migration    │    │ Partial          │    │ Check version    │
│ Not Run      │    │ Migration        │    │ in DB            │
│ See D1       │    │ See D2           │    │ See D3           │
└──────────────┘    └──────────────────┘    └──────────────────┘
```

**Command:**
```bash
mysql -h localhost -u mysql -p mysql_db < check_migration_006a.sql > results.txt
```

---

## Section C: Version Check Analysis

```
┌─────────────────────────────────────────────────────────────────┐
│                    Alembic Version Analysis                      │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  What's the version?  │
                    └───────────┬───────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
    VERSION < 006a         VERSION = 006a         VERSION > 006a
        │                       │                       │
        ▼                       ▼                       ▼
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ Need to      │    │ Check tables     │    │ Migration        │
│ Upgrade      │    │ exist            │    │ Complete         │
│ See D1       │    │ See D3           │    │ ✓ DONE           │
└──────────────┘    └──────────────────┘    └──────────────────┘
```

---

## Section D: Action Paths

### D1: Migration Not Run (Version < 006a or No Tables)

```
┌─────────────────────────────────────────────────────────────────┐
│                    SCENARIO: Migration Not Run                   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Run Migration        │
                    │  alembic upgrade 006a │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Verify Success       │
                    │  alembic current      │
                    └───────────┬───────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
              SUCCESS                    FAILURE
                    │                       │
                    ▼                       ▼
        ┌───────────────────┐   ┌──────────────────────┐
        │  Check tables     │   │  Review error logs   │
        │  All 3 should     │   │  Fix issues          │
        │  exist now        │   │  Retry               │
        └───────────────────┘   └──────────────────────┘
                │
                ▼
        ┌───────────────────┐
        │  ✓ COMPLETE       │
        └───────────────────┘
```

**Commands:**
```bash
# Upgrade to 006a
alembic upgrade 006a

# Verify
alembic current

# Check tables
mysql -u mysql -p mysql_db -e "SHOW TABLES LIKE '%year%'; SHOW TABLES LIKE '%question%'; SHOW TABLES LIKE '%topic%';"
```

---

### D2: Partial Migration (Some Tables Exist)

```
┌─────────────────────────────────────────────────────────────────┐
│                  SCENARIO: Partial Migration                     │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Rollback to 006      │
                    │  alembic downgrade 006│
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Verify Rollback      │
                    │  Tables should be gone│
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Re-apply Migration   │
                    │  alembic upgrade 006a │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Verify Success       │
                    │  All 3 tables exist   │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  ✓ COMPLETE           │
                    └───────────────────────┘
```

**Commands:**
```bash
# Rollback
alembic downgrade 006

# Verify tables are gone
mysql -u mysql -p mysql_db -e "SHOW TABLES;"

# Re-apply migration
alembic upgrade 006a

# Verify success
alembic current
```

---

### D3: Tables Exist but Version Mismatch

```
┌─────────────────────────────────────────────────────────────────┐
│               SCENARIO: Version Mismatch                         │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Verify All 3 Tables  │
                    │  Actually Exist       │
                    └───────────┬───────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                  ALL 3                   NOT ALL
                    │                       │
                    ▼                       ▼
        ┌───────────────────┐   ┌──────────────────────┐
        │  Stamp Database   │   │  Use D2 Path         │
        │  alembic stamp    │   │  (Partial Migration) │
        │  006a             │   └──────────────────────┘
        └───────────┬───────┘
                    │
                    ▼
        ┌───────────────────┐
        │  Verify Version   │
        │  alembic current  │
        └───────────┬───────┘
                    │
                    ▼
        ┌───────────────────┐
        │  ✓ COMPLETE       │
        └───────────────────┘
```

**Commands:**
```bash
# Verify all tables exist
mysql -u mysql -p mysql_db -e "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'mysql_db' 
AND table_name IN ('previous_year_papers', 'questions_bank', 'topic_predictions');
"

# If all 3 exist, stamp the version
alembic stamp 006a

# Verify
alembic current
```

---

## Quick Reference Decision Tree

```
START
  │
  ├─ Can connect? ──NO──> Fix connectivity (Section A)
  │                           │
  │                           └──> Retry from START
  │
  └─ YES
      │
      ├─ alembic current works? ──NO──> Use SQL method (Section B)
      │                                      │
      │                                      └──> Go to Action Paths (Section D)
      │
      └─ YES
          │
          ├─ Version >= 006a? ──YES──> Check tables exist
          │                                 │
          │                                 ├─ All 3? ──YES──> ✓ DONE
          │                                 │
          │                                 └─ Some? ──> Use D3 or D2
          │
          └─ NO (Version < 006a)
              │
              ├─ Tables exist?
              │    │
              │    ├─ None? ──> Use D1 (upgrade 006a)
              │    │
              │    ├─ Some? ──> Use D2 (downgrade + upgrade)
              │    │
              │    └─ All 3? ──> Use D3 (stamp 006a)
              │
              └──> Follow appropriate path
```

---

## Summary of Actions

| Scenario | Tables | Version | Action | Path |
|----------|--------|---------|--------|------|
| Fresh | 0 | None | `alembic upgrade 006a` | D1 |
| Not run | 0 | < 006a | `alembic upgrade 006a` | D1 |
| Partial | 1-2 | Any | Downgrade + Upgrade | D2 |
| Mismatch | 3 | < 006a | `alembic stamp 006a` | D3 |
| Complete | 3 | >= 006a | None needed | ✓ |
| Error | ? | ? | Fix connectivity | A |

---

## Tools Available

1. **check_migration_006a.sql** - Comprehensive SQL report
2. **check_migration_006a_status.py** - Python diagnostic script
3. **run_migration_006a_diagnostic.ps1** - Interactive PowerShell guide
4. **MIGRATION_006A_DIAGNOSTIC_REPORT.md** - Full documentation

Choose the tool that best fits your situation and technical environment.

---

## End Result

After following the appropriate path, you should have:

✓ Database connectivity working  
✓ Migration version = 006a or later  
✓ `previous_year_papers` table exists  
✓ `questions_bank` table exists  
✓ `topic_predictions` table exists  
✓ All tables have proper structure and indexes  

---
