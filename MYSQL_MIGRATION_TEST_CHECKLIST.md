# MySQL 8.0 Migration Test Checklist

Use this checklist when running comprehensive MySQL migration tests.

## Pre-Test Setup

### 1. Environment Verification
- [ ] MySQL 8.0+ is installed and running
- [ ] Python 3.9+ is installed
- [ ] All Python dependencies are installed (`pip install -r requirements.txt`)
- [ ] Test database exists or can be created

### 2. Database Configuration
- [ ] MySQL server is accessible
- [ ] Database user has required permissions (CREATE, DROP, ALTER, INSERT, DELETE)
- [ ] Test database name is available (will be cleaned)
- [ ] Connection credentials are ready

### 3. Environment Variables (Optional)
```bash
# Option 1: Set full database URL
export MYSQL_TEST_DATABASE_URL="mysql+pymysql://root:password@localhost:3306/test_db?charset=utf8mb4"

# Option 2: Set individual components (for script wrappers)
export DATABASE_HOST=localhost
export DATABASE_PORT=3306
export DATABASE_USER=root
export DATABASE_PASSWORD=password
export DATABASE_NAME=test_db
```

## Running Tests

### Option A: Use Shell Script (Recommended)

#### Windows PowerShell
```powershell
.\scripts\test_mysql_migrations_comprehensive.ps1 `
    -DatabaseHost "localhost" `
    -DatabasePort "3306" `
    -DatabaseUser "root" `
    -DatabasePassword "your_password" `
    -DatabaseName "test_mysql_migration"
```

#### Linux/Mac Bash
```bash
chmod +x scripts/test_mysql_migrations_comprehensive.sh

DATABASE_HOST=localhost \
DATABASE_PORT=3306 \
DATABASE_USER=root \
DATABASE_PASSWORD=your_password \
DATABASE_NAME=test_mysql_migration \
./scripts/test_mysql_migrations_comprehensive.sh
```

### Option B: Direct Python Execution
```bash
export MYSQL_TEST_DATABASE_URL="mysql+pymysql://root:password@localhost:3306/test_db?charset=utf8mb4"
python scripts/test_mysql_migrations_comprehensive.py
```

## During Test Execution

### Expected Output
- [ ] Connection confirmation with MySQL version
- [ ] Database cleaning progress
- [ ] Test 1: Alembic upgrade head (should take ~20-60 seconds)
  - [ ] Tables created count (80+)
  - [ ] Indexes created count (200+)
  - [ ] Foreign keys created count (100+)
- [ ] Test 2: Alembic downgrade base (should take ~15-45 seconds)
  - [ ] All tables dropped
- [ ] Test 3: Alembic upgrade head again (should take ~20-60 seconds)
  - [ ] Same number of tables created
- [ ] MySQL analysis output
  - [ ] Character set verification
  - [ ] Storage engine check
  - [ ] Column type analysis
- [ ] Test summary
- [ ] File save confirmation

### Monitor For
- [ ] No connection errors
- [ ] No migration errors
- [ ] No foreign key violations
- [ ] No index creation failures
- [ ] Character set is utf8mb4

## Post-Test Verification

### 1. Check Test Results
```bash
# Verify tests passed
cat backups/migration_test/mysql_migration_test_report.md | head -20

# Or check JSON
jq '.success' backups/migration_test/mysql_migration_test_results.json
# Should output: true
```

### 2. Verify Test Output Files
- [ ] `backups/migration_test/mysql_migration_test_results.json` exists
- [ ] `backups/migration_test/mysql_migration_test_report.md` exists
- [ ] Both files have recent timestamps

### 3. Review Test Report
```bash
# View full report
cat backups/migration_test/mysql_migration_test_report.md

# Or in JSON
jq '.' backups/migration_test/mysql_migration_test_results.json
```

### 4. Check Key Metrics

#### Tables Created
```bash
jq '.tests[0].tables_created' backups/migration_test/mysql_migration_test_results.json
```
Expected: 80+

#### Indexes Created
```bash
jq '.tests[0].indexes_created' backups/migration_test/mysql_migration_test_results.json
```
Expected: 200+

#### Foreign Keys Created
```bash
jq '.tests[0].foreign_keys_created' backups/migration_test/mysql_migration_test_results.json
```
Expected: 100+

#### Test Duration
```bash
jq '.duration_seconds' backups/migration_test/mysql_migration_test_results.json
```
Expected: 60-180 seconds (1-3 minutes)

### 5. Review MySQL Behaviors
```bash
jq '.mysql_behaviors[] | {category, behavior}' backups/migration_test/mysql_migration_test_results.json
```

Expected behaviors documented:
- [ ] Character Set (utf8mb4)
- [ ] TEXT/BLOB Columns
- [ ] ENUM Columns
- [ ] Index Lengths
- [ ] Foreign Keys
- [ ] JSON Support
- [ ] Storage Engine

### 6. Review MySQL Limitations
```bash
jq '.mysql_limitations[] | {issue, impact, solution}' backups/migration_test/mysql_migration_test_results.json
```

Expected limitations documented:
- [ ] No Row-Level Security
- [ ] Limited ALTER TABLE operations
- [ ] Other MySQL-specific limitations

## Troubleshooting

### Test Failed

#### Check Error Messages
```bash
jq '.tests[] | select(.success == false) | .errors' backups/migration_test/mysql_migration_test_results.json
```

#### Common Issues

**Connection Failed**
- [ ] Verify MySQL is running: `systemctl status mysql` (Linux) or check Services (Windows)
- [ ] Test connection: `mysql -u root -p -e "SELECT 1"`
- [ ] Check firewall settings
- [ ] Verify credentials

**Permission Denied**
- [ ] Grant permissions: `GRANT ALL PRIVILEGES ON test_db.* TO 'root'@'localhost';`
- [ ] Flush privileges: `FLUSH PRIVILEGES;`

**Database Doesn't Exist**
- [ ] Create database: `CREATE DATABASE test_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`

**Migration Errors**
- [ ] Check alembic version: `alembic current`
- [ ] Verify migration files exist: `ls alembic/versions/`
- [ ] Check for syntax errors in migrations
- [ ] Review specific error in test output

**Character Set Issues**
- [ ] Verify database charset: `SHOW CREATE DATABASE test_db;`
- [ ] Ensure utf8mb4 in connection string: `?charset=utf8mb4`

### No Output Files

**Check Directory Exists**
```bash
ls -la backups/migration_test/
```

**Create if Missing**
```bash
mkdir -p backups/migration_test
```

**Check Permissions**
```bash
# Linux/Mac
chmod 755 backups/migration_test/

# Windows
# Right-click folder -> Properties -> Security -> Check write permissions
```

## Success Criteria

All items should be checked:
- [ ] Test execution completed without errors
- [ ] All three test phases passed (upgrade, downgrade, upgrade)
- [ ] 80+ tables created
- [ ] 200+ indexes created
- [ ] 100+ foreign keys created
- [ ] Character set is utf8mb4
- [ ] No critical errors in output
- [ ] JSON report file exists and is valid
- [ ] Markdown report file exists and is readable
- [ ] MySQL behaviors documented (7+ behaviors)
- [ ] MySQL limitations documented (if any)

## Next Steps After Successful Tests

### 1. Review Documentation
- [ ] Read `alembic/MYSQL_MIGRATION_QUICK_START.md`
- [ ] Review `alembic/README.md` MySQL section
- [ ] Understand documented behaviors and limitations

### 2. Integration Testing
- [ ] Test with application code
- [ ] Verify multi-tenant data isolation
- [ ] Test API endpoints with new schema
- [ ] Run existing test suites

### 3. Performance Testing
- [ ] Load test database with sample data
- [ ] Verify query performance
- [ ] Check index usage with EXPLAIN
- [ ] Monitor resource usage

### 4. CI/CD Integration
- [ ] Add test to CI/CD pipeline
- [ ] Configure automatic test execution
- [ ] Set up test result artifact collection
- [ ] Configure pass/fail gates

### 5. Production Planning
- [ ] Review test results with team
- [ ] Plan migration schedule
- [ ] Prepare rollback procedures
- [ ] Create production migration checklist
- [ ] Schedule maintenance window
- [ ] Prepare monitoring and alerts

## Documentation Reference

For more information:
- **Quick Start**: `alembic/MYSQL_MIGRATION_QUICK_START.md`
- **Complete Guide**: `alembic/README.md` (MySQL section)
- **Testing Summary**: `alembic/MYSQL_MIGRATION_TESTING_SUMMARY.md`
- **Documentation Index**: `alembic/MYSQL_DOCUMENTATION_INDEX.md`

## Test Results Archive

Consider archiving test results:
```bash
# Archive by date
DATE=$(date +%Y-%m-%d)
mkdir -p backups/migration_test/archive/$DATE
cp backups/migration_test/mysql_migration_test_results.json backups/migration_test/archive/$DATE/
cp backups/migration_test/mysql_migration_test_report.md backups/migration_test/archive/$DATE/
```

## Sign-off

After successful test completion:

**Tested By**: ___________________________  
**Date**: ___________________________  
**MySQL Version**: ___________________________  
**Test Duration**: ___________________________ seconds  
**Overall Result**: ☐ PASS   ☐ FAIL  

**Notes**:
___________________________________________
___________________________________________
___________________________________________

---

**Checklist Version**: 1.0  
**Last Updated**: 2024-01-20
