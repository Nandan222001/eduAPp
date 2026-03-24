# MySQL 8.0 Migration Quick Start Guide

This guide provides quick instructions for testing and running Alembic migrations on MySQL 8.0.

## Quick Test Commands

### Windows (PowerShell)

```powershell
# Run comprehensive migration tests
.\scripts\test_mysql_migrations_comprehensive.ps1

# With custom database settings
.\scripts\test_mysql_migrations_comprehensive.ps1 `
    -DatabaseHost "localhost" `
    -DatabasePort "3306" `
    -DatabaseUser "root" `
    -DatabasePassword "your_password" `
    -DatabaseName "test_db"
```

### Linux/Mac (Bash)

```bash
# Make script executable
chmod +x scripts/test_mysql_migrations_comprehensive.sh

# Run comprehensive migration tests
./scripts/test_mysql_migrations_comprehensive.sh

# With custom database settings
DATABASE_HOST=localhost \
DATABASE_PORT=3306 \
DATABASE_USER=root \
DATABASE_PASSWORD=your_password \
DATABASE_NAME=test_db \
./scripts/test_mysql_migrations_comprehensive.sh
```

### Python Direct

```bash
# Set database URL
export MYSQL_TEST_DATABASE_URL="mysql+pymysql://root:password@localhost:3306/test_db?charset=utf8mb4"

# Run test
python scripts/test_mysql_migrations_comprehensive.py
```

## Manual Migration Testing

### 1. Create Clean Database

```bash
# MySQL command line
mysql -u root -p -e "DROP DATABASE IF EXISTS test_db;"
mysql -u root -p -e "CREATE DATABASE test_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 2. Run Migrations

```bash
# Set database URL
export DATABASE_URL="mysql+pymysql://root:password@localhost:3306/test_db?charset=utf8mb4"

# Upgrade to latest
alembic upgrade head

# Check current version
alembic current

# View migration history
alembic history --verbose
```

### 3. Test Downgrade Path

```bash
# Downgrade all migrations
alembic downgrade base

# Verify database is clean
mysql -u root -p test_db -e "SHOW TABLES;"
```

### 4. Test Full Migration Cycle

```bash
# Upgrade again
alembic upgrade head

# Verify all tables created
mysql -u root -p test_db -e "SHOW TABLES;"

# Check table structure
mysql -u root -p test_db -e "DESCRIBE users;"

# Check indexes
mysql -u root -p test_db -e "SHOW INDEX FROM users;"

# Check foreign keys
mysql -u root -p test_db -e "
SELECT 
    TABLE_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'test_db'
AND REFERENCED_TABLE_NAME IS NOT NULL;
"
```

## Test Results

After running the comprehensive test, results are saved to:
```
backups/migration_test/mysql_migration_test_results.json
```

### Results Include:
- Migration success/failure status
- Duration of each test phase
- Number of tables, indexes, and foreign keys created
- MySQL-specific behaviors documented
- MySQL limitations discovered
- Any errors encountered

### Example Results Summary:

```json
{
  "start_time": "2024-01-20T10:00:00",
  "mysql_version": "8.0.35",
  "database_name": "test_db",
  "success": true,
  "duration_seconds": 45.23,
  "tests": [
    {
      "name": "alembic_upgrade_head",
      "success": true,
      "duration_seconds": 20.15,
      "tables_created": 85,
      "indexes_created": 245,
      "foreign_keys_created": 120
    },
    {
      "name": "alembic_downgrade_base",
      "success": true,
      "duration_seconds": 15.08
    },
    {
      "name": "alembic_upgrade_head_second",
      "success": true,
      "duration_seconds": 18.50,
      "tables_created": 85
    }
  ]
}
```

## Common Issues and Solutions

### Issue: Connection Failed

**Error:**
```
Can't connect to MySQL server on 'localhost'
```

**Solution:**
1. Ensure MySQL server is running
2. Check host, port, username, password
3. Verify user has permissions

```bash
# Check MySQL status (Linux)
sudo systemctl status mysql

# Check MySQL status (Windows - check Services)
# Or test connection:
mysql -u root -p -e "SELECT 1"
```

### Issue: Database Doesn't Exist

**Error:**
```
Unknown database 'test_db'
```

**Solution:**
```bash
mysql -u root -p -e "CREATE DATABASE test_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### Issue: Permission Denied

**Error:**
```
Access denied for user 'root'@'localhost'
```

**Solution:**
```bash
# Grant permissions
mysql -u root -p -e "GRANT ALL PRIVILEGES ON test_db.* TO 'root'@'localhost';"
mysql -u root -p -e "FLUSH PRIVILEGES;"
```

### Issue: Character Set Warning

**Error:**
```
Warning: Incorrect string value
```

**Solution:**
Ensure database uses utf8mb4:
```bash
mysql -u root -p -e "
ALTER DATABASE test_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
"
```

## Verifying Migration Success

### Check All Tables Created

```bash
mysql -u root -p test_db -e "
SELECT COUNT(*) as table_count 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'test_db';
"
```

Expected: 80+ tables

### Check Character Set

```bash
mysql -u root -p test_db -e "
SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME
FROM information_schema.SCHEMATA
WHERE SCHEMA_NAME = 'test_db';
"
```

Expected: utf8mb4 / utf8mb4_unicode_ci

### Check Foreign Keys

```bash
mysql -u root -p test_db -e "
SELECT COUNT(*) as fk_count
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'test_db'
AND REFERENCED_TABLE_NAME IS NOT NULL;
"
```

Expected: 100+ foreign keys

### Check Indexes

```bash
mysql -u root -p test_db -e "
SELECT COUNT(*) as index_count
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'test_db';
"
```

Expected: 200+ indexes

## Performance Testing

### Time Individual Migrations

```bash
# Upgrade one step at a time
alembic upgrade +1

# Time it
time alembic upgrade +1
```

### Check Query Performance

```bash
mysql -u root -p test_db -e "
EXPLAIN SELECT * FROM students WHERE institution_id = 1;
"
```

Look for:
- `type: ref` or better (using index)
- `key: idx_students_institution_id` (using correct index)

### Analyze Table Sizes

```bash
mysql -u root -p test_db -e "
SELECT 
    TABLE_NAME,
    ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS size_mb
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'test_db'
ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC
LIMIT 20;
"
```

## Next Steps

After successful migration testing:

1. **Review Results**: Check `mysql_migration_test_results.json`
2. **Document Issues**: Note any MySQL-specific behaviors in README
3. **Performance Test**: Run with sample data to verify performance
4. **Integration Test**: Test with application code
5. **Prepare Production**: Plan production migration strategy

## Production Migration Checklist

- [ ] Backup production database
- [ ] Test migrations on production copy
- [ ] Review all migration files
- [ ] Check for data migrations
- [ ] Verify rollback procedures
- [ ] Plan maintenance window
- [ ] Test application with new schema
- [ ] Monitor performance after migration
- [ ] Have rollback plan ready

## Additional Resources

- [Main Alembic README](README.md) - Complete documentation
- [MySQL Testing Guide](../tests/migration/MYSQL_TESTING_GUIDE.md) - Detailed testing
- [MySQL 8.0 Documentation](https://dev.mysql.com/doc/refman/8.0/en/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)

## Support

For issues:
1. Check test results JSON file
2. Review MySQL-specific considerations in main README
3. Verify MySQL version is 8.0+
4. Check database permissions
5. Review migration logs

---

**Last Updated:** 2024-01-20
