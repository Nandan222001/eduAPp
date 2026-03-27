# Migration 006a Database State Diagnostic Report

**Generated:** ${new Date().toISOString()}

## Overview

This report documents the findings regarding migration 006a status and the `questions_bank` table existence. Since direct database connectivity is currently unavailable, this report is based on code analysis and migration file inspection.

## Migration 006a Analysis

### Migration File Location
- **Path:** `alembic/versions/006a_create_previous_year_papers_tables.py`
- **Revision ID:** `006a`
- **Down Revision:** `006`
- **Create Date:** 2024-01-17 10:00:00.000000

### Tables Created by Migration 006a

Migration 006a creates three tables:

#### 1. `previous_year_papers` Table
- **Purpose:** Store previous year examination papers
- **Key Columns:**
  - `id` (Primary Key)
  - `institution_id` (Foreign Key to institutions)
  - `title`, `description`
  - `board` (ENUM: cbse, icse, state_board, ib, cambridge, other)
  - `year`, `exam_month`
  - `grade_id`, `subject_id` (Foreign Keys)
  - `total_marks`, `duration_minutes`
  - `pdf_file_name`, `pdf_file_size`, `pdf_file_url`, `pdf_s3_key`
  - `ocr_text`, `ocr_processed`, `ocr_processed_at`
  - `tags`
  - `view_count`, `download_count`
  - `is_active`
  - `uploaded_by` (Foreign Key to users)
  - `created_at`, `updated_at`

- **Indexes Created:**
  - `idx_pyp_institution`, `idx_pyp_board`, `idx_pyp_year`
  - `idx_pyp_grade`, `idx_pyp_subject`
  - `idx_pyp_board_year`, `idx_pyp_grade_subject`
  - `idx_pyp_ocr_processed`, `idx_pyp_active`, `idx_pyp_created`

#### 2. `questions_bank` Table ⭐
- **Purpose:** Store individual questions extracted from papers or created independently
- **Key Columns:**
  - `id` (Primary Key)
  - `institution_id` (Foreign Key to institutions)
  - `paper_id` (Foreign Key to previous_year_papers)
  - `question_text`
  - `question_type` (ENUM: multiple_choice, short_answer, long_answer, true_false, fill_in_blank, numerical, match_the_following, assertion_reasoning)
  - `grade_id`, `subject_id`, `chapter_id`, `topic_id` (Foreign Keys)
  - `difficulty_level` (ENUM: very_easy, easy, medium, hard, very_hard)
  - `bloom_taxonomy_level` (ENUM: remember, understand, apply, analyze, evaluate, create)
  - `marks`
  - `answer_text`, `options`, `correct_option`
  - `image_url`
  - `tags`
  - `usage_count`
  - `is_active`, `is_verified`
  - `created_at`, `updated_at`

- **Indexes Created:**
  - `idx_qb_institution`, `idx_qb_paper`
  - `idx_qb_grade`, `idx_qb_subject`, `idx_qb_chapter`, `idx_qb_topic`
  - `idx_qb_question_type`, `idx_qb_difficulty`, `idx_qb_bloom`
  - `idx_qb_grade_subject`, `idx_qb_chapter_topic`
  - `idx_qb_active`, `idx_qb_verified`, `idx_qb_created`

#### 3. `topic_predictions` Table
- **Purpose:** Store AI-based topic predictions for exam preparation
- **Key Columns:**
  - `id` (Primary Key)
  - `institution_id` (Foreign Key to institutions)
  - `board` (ENUM: cbse, icse, state_board, ib, cambridge, other)
  - `grade_id`, `subject_id`, `chapter_id`, `topic_id` (Foreign Keys)
  - `topic_name`
  - `frequency_count`, `appearance_years`
  - `total_marks`
  - `cyclical_pattern_score`, `probability_score`
  - `prediction_year`, `confidence_level`
  - `created_at`, `updated_at`

- **Indexes Created:**
  - `idx_tp_institution`, `idx_tp_board`
  - `idx_tp_grade`, `idx_tp_subject`, `idx_tp_chapter`, `idx_tp_topic`
  - `idx_tp_board_grade_subject`, `idx_tp_probability_score`

### Foreign Key Dependencies

Migration 006a has foreign key dependencies on:
1. `institutions` table (created in migration 005)
2. `users` table (created in earlier migrations)
3. `grades` table (should be created in earlier migrations)
4. `subjects` table (should be created in earlier migrations)
5. `chapters` table (created in migration 006)
6. `topics` table (created in migration 006)

### Downgrade Process

The migration includes a complete downgrade path that:
1. Drops all indexes from `topic_predictions` table
2. Drops `topic_predictions` table
3. Drops all indexes from `questions_bank` table
4. Drops `questions_bank` table
5. Drops all indexes from `previous_year_papers` table
6. Drops `previous_year_papers` table

## Database Connectivity Issues

### Current Error
```
pymysql.err.OperationalError: (1045, "Access denied for user 'mysql'@'localhost' (using password: YES)")
```

### Possible Causes
1. **MySQL Server Not Running:** The MySQL service may not be started
2. **Incorrect Credentials:** The database credentials in `.env` may not match the actual MySQL setup
3. **Database Not Created:** The database `mysql_db` may not exist
4. **Permission Issues:** The user `mysql` may not have the necessary permissions

### Configuration Review

**From `.env.example`:**
- `DATABASE_USER=mysql`
- `DATABASE_PASSWORD=mysql_password`
- `DATABASE_NAME=mysql_db`
- `DATABASE_HOST=localhost`
- `DATABASE_PORT=3306`

**Required Actions:**
1. Verify MySQL server is running
2. Ensure `.env` file exists with correct credentials
3. Verify database `mysql_db` exists
4. Verify user `mysql` has proper permissions

## Commands to Check Database State

### Check Alembic Version
```bash
alembic current
```
**Purpose:** Shows the current migration version recorded in the database

### Check if questions_bank Table Exists (MySQL CLI)
```sql
SHOW TABLES LIKE 'questions_bank';
```
**Expected:** Returns `questions_bank` if the table exists

### Alternative Check (MySQL CLI)
```sql
SELECT COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'mysql_db' 
AND table_name = 'questions_bank';
```
**Expected:** Returns `1` if the table exists, `0` if it doesn't

### Check All Tables Created by Migration 006a
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'mysql_db' 
AND table_name IN ('previous_year_papers', 'questions_bank', 'topic_predictions');
```
**Expected:** Returns all three table names if migration 006a completed successfully

## Recommendations

### Scenario 1: Database Connection Issues (Current State)
**Status:** Cannot determine migration state due to connectivity issues

**Actions Required:**
1. Fix database connectivity by:
   - Starting MySQL service
   - Verifying credentials in `.env` file
   - Creating database if it doesn't exist
   - Granting proper permissions to user
2. Re-run diagnostic commands once connectivity is restored

### Scenario 2: Migration 006a Not Run
**Indicators:**
- `questions_bank` table does not exist
- `alembic_version` table shows version < `006a`

**Actions Required:**
```bash
alembic upgrade 006a
```

### Scenario 3: Migration 006a Partially Completed
**Indicators:**
- Some but not all three tables exist
- `alembic_version` table shows `006a` but tables are missing

**Actions Required:**
1. Rollback to previous version:
   ```bash
   alembic downgrade 006
   ```
2. Re-run migration:
   ```bash
   alembic upgrade 006a
   ```

### Scenario 4: Migration 006a Completed Successfully
**Indicators:**
- All three tables exist: `previous_year_papers`, `questions_bank`, `topic_predictions`
- `alembic_version` table shows `006a` or later

**Status:** ✓ No action needed

### Scenario 5: Tables Exist but Alembic Version Incorrect
**Indicators:**
- All three tables exist
- `alembic_version` table shows version < `006a` or is empty

**Actions Required:**
```bash
alembic stamp 006a
```

## Model References

The following model files reference tables created by migration 006a:

1. **src/models/previous_year_papers.py** - Defines `PreviousYearPaper` model
2. **src/models/academic.py** - May include `QuestionBank` model
3. **src/models/study_planner.py** - May reference questions_bank
4. **src/models/institution.py** - May reference previous year papers

## Next Steps

1. **Resolve Database Connectivity**
   - Check MySQL service status
   - Verify database credentials
   - Ensure database exists

2. **Run Diagnostic Commands**
   - Execute `alembic current` to check version
   - Execute `SHOW TABLES LIKE 'questions_bank'` in MySQL

3. **Document Findings**
   - Record current migration version
   - Confirm which tables exist
   - Identify any missing tables

4. **Take Appropriate Action**
   - Follow recommendations based on scenario identified
   - Re-run migration if necessary
   - Stamp version if tables exist but version is incorrect

## Summary

Migration 006a creates three critical tables for the previous year papers and questions bank functionality:
- `previous_year_papers` - Stores exam paper metadata and PDFs
- `questions_bank` - Stores individual questions with metadata
- `topic_predictions` - Stores AI-based topic predictions

Without database connectivity, we cannot determine:
- Whether these tables currently exist
- What migration version is recorded in the database
- If migration 006a needs to be run or re-run

**Action Required:** Restore database connectivity and run diagnostic commands to determine actual state.
