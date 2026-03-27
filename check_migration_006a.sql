-- =====================================================================
-- Migration 006a Database State Diagnostic SQL Script
-- =====================================================================
-- This script checks the current state of migration 006a
-- Run this script in MySQL to check if migration 006a has been applied
-- =====================================================================

-- Display script header
SELECT '========================================' AS '';
SELECT 'Migration 006a Diagnostic Check' AS '';
SELECT '========================================' AS '';
SELECT NOW() AS 'Timestamp';
SELECT '' AS '';

-- =====================================================================
-- CHECK 1: Verify Database Exists
-- =====================================================================
SELECT '----------------------------------------' AS '';
SELECT 'CHECK 1: Database Existence' AS '';
SELECT '----------------------------------------' AS '';

SELECT 
    SCHEMA_NAME AS 'Database Name',
    DEFAULT_CHARACTER_SET_NAME AS 'Charset',
    DEFAULT_COLLATION_NAME AS 'Collation'
FROM information_schema.SCHEMATA 
WHERE SCHEMA_NAME = 'mysql_db';

SELECT '' AS '';

-- =====================================================================
-- CHECK 2: Check Alembic Version
-- =====================================================================
SELECT '----------------------------------------' AS '';
SELECT 'CHECK 2: Current Migration Version' AS '';
SELECT '----------------------------------------' AS '';

-- Check if alembic_version table exists
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ alembic_version table exists'
        ELSE '✗ alembic_version table does not exist'
    END AS 'Alembic Table Status'
FROM information_schema.tables 
WHERE table_schema = 'mysql_db' 
AND table_name = 'alembic_version';

-- Get current version if table exists
SELECT 
    COALESCE(
        (SELECT version_num FROM alembic_version LIMIT 1),
        'NO VERSION RECORDED'
    ) AS 'Current Migration Version';

SELECT '' AS '';

-- =====================================================================
-- CHECK 3: Check Tables Created by Migration 006a
-- =====================================================================
SELECT '----------------------------------------' AS '';
SELECT 'CHECK 3: Tables from Migration 006a' AS '';
SELECT '----------------------------------------' AS '';

-- Check previous_year_papers table
SELECT 
    'previous_year_papers' AS 'Table Name',
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ EXISTS'
        ELSE '✗ DOES NOT EXIST'
    END AS 'Status'
FROM information_schema.tables 
WHERE table_schema = 'mysql_db' 
AND table_name = 'previous_year_papers';

-- Check questions_bank table
SELECT 
    'questions_bank' AS 'Table Name',
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ EXISTS'
        ELSE '✗ DOES NOT EXIST'
    END AS 'Status'
FROM information_schema.tables 
WHERE table_schema = 'mysql_db' 
AND table_name = 'questions_bank';

-- Check topic_predictions table
SELECT 
    'topic_predictions' AS 'Table Name',
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ EXISTS'
        ELSE '✗ DOES NOT EXIST'
    END AS 'Status'
FROM information_schema.tables 
WHERE table_schema = 'mysql_db' 
AND table_name = 'topic_predictions';

SELECT '' AS '';

-- =====================================================================
-- CHECK 4: Detailed Table Information (if tables exist)
-- =====================================================================
SELECT '----------------------------------------' AS '';
SELECT 'CHECK 4: Table Details' AS '';
SELECT '----------------------------------------' AS '';

-- Show tables that match migration 006a tables
SELECT 
    table_name AS 'Table Name',
    table_rows AS 'Approximate Row Count',
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)',
    create_time AS 'Created At',
    update_time AS 'Last Updated'
FROM information_schema.tables
WHERE table_schema = 'mysql_db'
AND table_name IN ('previous_year_papers', 'questions_bank', 'topic_predictions')
ORDER BY table_name;

SELECT '' AS '';

-- =====================================================================
-- CHECK 5: questions_bank Table Structure (if exists)
-- =====================================================================
SELECT '----------------------------------------' AS '';
SELECT 'CHECK 5: questions_bank Table Structure' AS '';
SELECT '----------------------------------------' AS '';

-- Only execute if table exists
SELECT 
    column_name AS 'Column Name',
    column_type AS 'Type',
    is_nullable AS 'Nullable',
    column_key AS 'Key',
    column_default AS 'Default',
    extra AS 'Extra'
FROM information_schema.columns
WHERE table_schema = 'mysql_db'
AND table_name = 'questions_bank'
ORDER BY ordinal_position;

SELECT '' AS '';

-- =====================================================================
-- CHECK 6: Indexes on questions_bank (if exists)
-- =====================================================================
SELECT '----------------------------------------' AS '';
SELECT 'CHECK 6: questions_bank Indexes' AS '';
SELECT '----------------------------------------' AS '';

SELECT 
    index_name AS 'Index Name',
    GROUP_CONCAT(column_name ORDER BY seq_in_index) AS 'Columns',
    CASE non_unique 
        WHEN 0 THEN 'UNIQUE'
        ELSE 'NON-UNIQUE'
    END AS 'Type'
FROM information_schema.statistics
WHERE table_schema = 'mysql_db'
AND table_name = 'questions_bank'
GROUP BY index_name, non_unique
ORDER BY index_name;

SELECT '' AS '';

-- =====================================================================
-- CHECK 7: Foreign Keys on questions_bank (if exists)
-- =====================================================================
SELECT '----------------------------------------' AS '';
SELECT 'CHECK 7: questions_bank Foreign Keys' AS '';
SELECT '----------------------------------------' AS '';

SELECT 
    constraint_name AS 'Constraint Name',
    column_name AS 'Column',
    referenced_table_name AS 'References Table',
    referenced_column_name AS 'References Column'
FROM information_schema.key_column_usage
WHERE table_schema = 'mysql_db'
AND table_name = 'questions_bank'
AND referenced_table_name IS NOT NULL
ORDER BY ordinal_position;

SELECT '' AS '';

-- =====================================================================
-- CHECK 8: Row Counts (if tables exist)
-- =====================================================================
SELECT '----------------------------------------' AS '';
SELECT 'CHECK 8: Data Row Counts' AS '';
SELECT '----------------------------------------' AS '';

-- Get exact row counts for each table
SELECT 'previous_year_papers' AS 'Table Name', COUNT(*) AS 'Row Count' 
FROM previous_year_papers
UNION ALL
SELECT 'questions_bank', COUNT(*) 
FROM questions_bank
UNION ALL
SELECT 'topic_predictions', COUNT(*) 
FROM topic_predictions;

SELECT '' AS '';

-- =====================================================================
-- SUMMARY AND RECOMMENDATION
-- =====================================================================
SELECT '========================================' AS '';
SELECT 'SUMMARY AND RECOMMENDATION' AS '';
SELECT '========================================' AS '';

-- Determine migration status
SELECT 
    CASE 
        WHEN (
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = 'mysql_db' 
            AND table_name IN ('previous_year_papers', 'questions_bank', 'topic_predictions')
        ) = 3 THEN '✓ MIGRATION 006a APPEARS COMPLETE'
        WHEN (
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = 'mysql_db' 
            AND table_name IN ('previous_year_papers', 'questions_bank', 'topic_predictions')
        ) = 0 THEN '✗ MIGRATION 006a NOT RUN - All tables missing'
        ELSE '⚠ MIGRATION 006a PARTIALLY COMPLETE - Some tables missing'
    END AS 'Migration Status';

-- Show which tables exist
SELECT 
    'Tables Found:' AS '',
    GROUP_CONCAT(table_name SEPARATOR ', ') AS 'Existing Tables'
FROM information_schema.tables 
WHERE table_schema = 'mysql_db' 
AND table_name IN ('previous_year_papers', 'questions_bank', 'topic_predictions');

-- Show which tables are missing
SELECT 
    'Missing Tables:' AS '',
    CASE 
        WHEN (
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = 'mysql_db' 
            AND table_name IN ('previous_year_papers', 'questions_bank', 'topic_predictions')
        ) = 3 THEN 'None - All tables exist'
        ELSE (
            SELECT GROUP_CONCAT(t.table_name SEPARATOR ', ')
            FROM (
                SELECT 'previous_year_papers' AS table_name
                UNION ALL SELECT 'questions_bank'
                UNION ALL SELECT 'topic_predictions'
            ) t
            WHERE NOT EXISTS (
                SELECT 1 
                FROM information_schema.tables 
                WHERE table_schema = 'mysql_db' 
                AND table_name = t.table_name
            )
        )
    END AS 'Missing Tables';

SELECT '' AS '';

-- Recommendation
SELECT 
    CASE 
        WHEN (
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = 'mysql_db' 
            AND table_name IN ('previous_year_papers', 'questions_bank', 'topic_predictions')
        ) = 3 THEN 
            'RECOMMENDATION: No action needed - Migration 006a is complete'
        WHEN (
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = 'mysql_db' 
            AND table_name IN ('previous_year_papers', 'questions_bank', 'topic_predictions')
        ) = 0 THEN 
            'RECOMMENDATION: Run "alembic upgrade 006a" to apply migration'
        ELSE 
            'RECOMMENDATION: Run "alembic downgrade 006" then "alembic upgrade 006a" to fix partial migration'
    END AS 'Recommended Action';

SELECT '========================================' AS '';
SELECT 'END OF DIAGNOSTIC CHECK' AS '';
SELECT '========================================' AS '';
