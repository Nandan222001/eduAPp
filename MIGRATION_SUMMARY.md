# PostgreSQL to MySQL Migration Summary

## Overview
This document summarizes the changes made to convert PostgreSQL-specific SQL syntax to MySQL-compatible syntax across the codebase.

## Files Modified

### 1. src/repositories/database_maintenance_repository.py
**Changes:**
- Replaced `pg_stat_user_tables` with `information_schema.TABLES`
- Replaced `pg_stat_user_indexes` with `information_schema.STATISTICS`
- Replaced `pg_tables` with `information_schema.TABLES`
- Replaced `pg_stat_activity` with `information_schema.PROCESSLIST`
- Replaced `pg_size_pretty()` and `pg_relation_size()` with MySQL size calculations using `DATA_LENGTH` and `INDEX_LENGTH`
- Replaced `pg_database_size()` with aggregate calculations from `information_schema.TABLES`
- Replaced `EXTRACT(EPOCH FROM ...)` with `TIME` column from `PROCESSLIST`
- Replaced PostgreSQL-specific bloat estimation queries with simplified MySQL queries
- Removed `get_autovacuum_progress()` functionality (PostgreSQL-specific)
- Changed `pg_stat_statements_reset()` to `FLUSH STATUS` for MySQL
- Replaced array aggregation (`array_agg`) with `GROUP_CONCAT` for duplicate index detection

### 2. src/repositories/study_material_repository.py
**Changes:**
- Replaced PostgreSQL array overlap operator (`overlap`) with MySQL JSON array checking using loops
- Changed `unnest()` function to MySQL JSON extraction using:
  - `JSON_EXTRACT()` with path expressions
  - `JSON_UNQUOTE()` for value extraction
  - Cross join with index table for array iteration
  - `JSON_LENGTH()` for array size checking
- Updated autocomplete suggestions query to use MySQL JSON functions instead of `unnest()`

### 3. src/services/database_maintenance_service.py
**Changes:**
- Updated `run_vacuum_analyze()` to reference MySQL's `OPTIMIZE TABLE` instead of `VACUUM ANALYZE`
- Modified `get_database_stats()` to use MySQL system tables:
  - Replaced PostgreSQL system catalogs with `information_schema` tables
  - Updated size calculations using `DATA_LENGTH + INDEX_LENGTH`
  - Modified connection tracking to use `information_schema.PROCESSLIST`
  - Removed cache hit ratio calculations (PostgreSQL-specific)
  - Simplified transaction statistics (MySQL doesn't track the same way)
- Updated `get_partition_info()` to query MySQL partitions
- Changed `enable_pg_stat_statements()` to enable MySQL Performance Schema
- Modified `drop_unused_index()` to use MySQL `DROP INDEX` syntax

## SQL Syntax Conversions

### Array Operations
**PostgreSQL:**
```sql
unnest(array_column)
array_agg(column)
tags.overlap(filter_tags)
```

**MySQL:**
```sql
-- Unnest equivalent using JSON
JSON_EXTRACT(tags, CONCAT('$[', idx.n, ']'))
JSON_LENGTH(tags)

-- Array aggregation
GROUP_CONCAT(column)

-- Array contains check (manual loop instead of overlap)
FOR tag IN filter_tags:
    tags.contains(tag)
```

### JSONB Operators
**PostgreSQL:**
```sql
column->>'key'           -- Text extraction
column->'key'            -- JSON extraction
column @> '{"key":"val"}'  -- Contains
column ? 'key'           -- Has key
```

**MySQL:**
```sql
JSON_UNQUOTE(JSON_EXTRACT(column, '$.key'))  -- Text extraction
JSON_EXTRACT(column, '$.key')                -- JSON extraction
JSON_CONTAINS(column, '{"key":"val"}')       -- Contains
JSON_SEARCH(column, 'one', 'key')            -- Search for key
```

### System Catalogs
**PostgreSQL:**
```sql
pg_stat_user_tables
pg_stat_user_indexes
pg_tables
pg_stat_activity
pg_size_pretty()
pg_relation_size()
pg_database_size()
```

**MySQL:**
```sql
information_schema.TABLES
information_schema.STATISTICS
information_schema.TABLES
information_schema.PROCESSLIST
CONCAT(ROUND(size / 1024 / 1024, 2), ' MB')
DATA_LENGTH or INDEX_LENGTH
SUM(DATA_LENGTH + INDEX_LENGTH)
```

### Window Functions
Note: Window functions (ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD, OVER) are supported in MySQL 8.0+, so no changes were needed for these. If targeting MySQL 5.7 or earlier, these would need to be rewritten using variables or subqueries.

### Full-Text Search
No full-text search queries using PostgreSQL's `to_tsvector`, `to_tsquery`, or `@@` operator were found in the scanned files. If these exist elsewhere, they should be converted to:

**PostgreSQL:**
```sql
to_tsvector('english', column) @@ to_tsquery('search terms')
```

**MySQL:**
```sql
MATCH(column) AGAINST('search terms' IN NATURAL LANGUAGE MODE)
-- or
MATCH(column) AGAINST('+search +terms' IN BOOLEAN MODE)
```

## Files Not Requiring Changes

The following files were identified in the initial scan but did not contain actual PostgreSQL-specific SQL syntax:
- src/services/youtube_live_service.py (no SQL)
- src/services/study_buddy_service.py (no PostgreSQL-specific SQL)
- src/services/recommendation_service.py (no PostgreSQL-specific SQL)
- src/services/question_variation_service.py (no SQL)
- src/services/printful_service.py (no SQL)
- src/services/plagiarism_detection_service.py (no SQL)
- src/services/homework_scanner_service.py (no SQL)
- src/services/email_domain_service.py (no SQL)
- src/services/doubt_tagging_service.py (no PostgreSQL-specific SQL)
- src/services/content_plagiarism_service.py (no SQL)
- src/services/chat_moderation_service.py (no SQL)
- src/services/branding_service.py (no SQL)
- src/services/bloom_taxonomy_classifier.py (no SQL)
- src/services/recommendation_config.py (no SQL, just configuration)

## Testing Recommendations

After implementing these changes, the following should be tested:

1. **Database Maintenance Queries:**
   - Table statistics retrieval
   - Index statistics and recommendations
   - Table size calculations
   - Long-running query detection
   - Duplicate index detection

2. **Study Material Repository:**
   - Tag-based filtering and search
   - Autocomplete suggestions with tags
   - Material hierarchy queries

3. **JSON Operations:**
   - Tag extraction and filtering
   - JSON array operations
   - Metadata queries

4. **Performance:**
   - Query execution times
   - Index usage
   - Connection pooling

## Migration Checklist

- [x] Update PostgreSQL system catalog queries to MySQL information_schema
- [x] Convert JSONB operators to MySQL JSON functions
- [x] Replace array operations (unnest, array_agg, overlap) with MySQL equivalents
- [x] Update size calculation functions
- [x] Convert database maintenance queries
- [ ] Test all updated queries with actual MySQL database
- [ ] Update database migration scripts if needed
- [ ] Update documentation with MySQL requirements
- [ ] Verify indexes are created for JSON columns used in queries
- [ ] Performance test JSON operations vs original JSONB operations

## Notes

1. MySQL JSON support requires MySQL 5.7.8+ for JSON data type and MySQL 8.0.17+ for multi-valued indexes on JSON arrays
2. Some PostgreSQL features don't have direct MySQL equivalents (e.g., autovacuum progress tracking)
3. Performance characteristics may differ between PostgreSQL JSONB and MySQL JSON
4. Consider adding appropriate indexes on JSON columns for better query performance
5. Window functions are available in MySQL 8.0+; if using MySQL 5.7, additional refactoring would be needed
