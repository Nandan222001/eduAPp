# Migration Test Suite

A comprehensive testing environment for Alembic database migrations.

## Overview

This test suite provides automated validation and testing of database migrations to ensure:

- Migrations can be applied successfully
- Schema changes are correct
- Upgrade and downgrade paths work
- No duplicate or conflicting migrations
- Schema consistency across environments

## Directory Structure

```
scripts/migration_test/
├── README.md                           # This file
├── QUICK_START.md                      # Quick start guide
├── setup_test_db.sh                    # Set up test database (Bash)
├── setup_test_db.ps1                   # Set up test database (PowerShell)
├── backup_production_schema.sh         # Backup production schema (Bash)
├── backup_production_schema.ps1        # Backup production schema (PowerShell)
├── validate_migrations.py              # Main migration validator
├── test_recent_migrations.py           # Test recent migrations individually
├── compare_schemas.py                  # Compare database schemas
├── run_all_tests.sh                    # Run all tests (Bash)
├── run_all_tests.ps1                   # Run all tests (PowerShell)
├── pre-commit-migration-check          # Git pre-commit hook
├── install_hooks.sh                    # Install git hooks (Bash)
└── install_hooks.ps1                   # Install git hooks (PowerShell)
```

## Components

### 1. Test Database Setup

**Scripts:** `setup_test_db.sh`, `setup_test_db.ps1`

Creates an isolated test database for migration testing:
- Drops existing test database if it exists
- Creates fresh test database
- Configures permissions
- Generates `.env.test.migration` configuration file

**Usage:**
```bash
# Linux/Mac
./scripts/migration_test/setup_test_db.sh

# Windows
.\scripts\migration_test\setup_test_db.ps1
```

**Environment Variables:**
- `TEST_DATABASE_NAME` - Test database name (default: `fastapi_db_migration_test`)
- `DATABASE_HOST` - PostgreSQL host (default: `localhost`)
- `DATABASE_PORT` - PostgreSQL port (default: `5432`)
- `DATABASE_USER` - PostgreSQL user (default: `postgres`)
- `DATABASE_PASSWORD` - PostgreSQL password (default: `postgres`)

### 2. Production Schema Backup

**Scripts:** `backup_production_schema.sh`, `backup_production_schema.ps1`

Backs up the production database schema using `pg_dump --schema-only`:
- Creates timestamped schema backup
- Maintains latest schema link
- Provides schema statistics
- Stores backups in `backups/migration_test/`

**Usage:**
```bash
# Linux/Mac
./scripts/migration_test/backup_production_schema.sh

# Windows
.\scripts\migration_test\backup_production_schema.ps1
```

**Output:**
- `backups/migration_test/schema_<database>_<timestamp>.sql`
- `backups/migration_test/schema_latest.sql` (symlink/copy)

### 3. Migration Validator

**Script:** `validate_migrations.py`

Comprehensive migration validation:
- Connects to test database
- Runs `alembic upgrade head`
- Verifies all tables, columns, and constraints
- Tests downgrade/upgrade paths
- Checks migration consistency
- Generates detailed JSON report

**Usage:**
```bash
python scripts/migration_test/validate_migrations.py
```

**Features:**
- ✅ Verifies all migrations apply successfully
- ✅ Checks schema structure (tables, columns, indexes)
- ✅ Validates foreign key indexes
- ✅ Tests migration downgrades
- ✅ Detects duplicate revision IDs
- ✅ Generates detailed reports

**Output:**
- Console output with colored status
- `backups/migration_test/migration_validation_report.json`

### 4. Recent Migrations Tester

**Script:** `test_recent_migrations.py`

Tests recent migrations individually:
- Identifies last N migrations
- For each migration:
  - Downgrades to previous version
  - Upgrades to target version
  - Verifies schema changes
  - Tests downgrade path
- Generates detailed test report

**Usage:**
```bash
# Test last 5 migrations (default)
python scripts/migration_test/test_recent_migrations.py

# Test last 10 migrations
python scripts/migration_test/test_recent_migrations.py -n 10
```

**Output:**
- `backups/migration_test/recent_migrations_test_report.json`

### 5. Schema Comparator

**Script:** `compare_schemas.py`

Compares schemas between two databases:
- Extracts complete schema information
- Compares tables, columns, indexes
- Compares enums and sequences
- Identifies differences
- Generates comparison report

**Usage:**
```bash
# Compare production and test database
python scripts/migration_test/compare_schemas.py fastapi_db fastapi_db_migration_test

# Compare two arbitrary databases
python scripts/migration_test/compare_schemas.py db1 db2
```

**Output:**
- Console output with differences
- `backups/migration_test/schema_comparison_report.json`

### 6. Comprehensive Test Runner

**Scripts:** `run_all_tests.sh`, `run_all_tests.ps1`

Runs all tests in sequence:
1. Set up test database
2. Backup production schema
3. Full migration validation
4. Recent migrations test
5. Schema comparison

**Usage:**
```bash
# Linux/Mac
./scripts/migration_test/run_all_tests.sh

# Windows
.\scripts\migration_test\run_all_tests.ps1
```

**Output:**
- Colored console output
- Individual test reports
- `backups/migration_test/test_suite_summary.txt`

### 7. Pre-commit Hook

**Script:** `pre-commit-migration-check`

Git pre-commit hook that validates migrations:
- Checks migration file syntax
- Validates required functions (upgrade/downgrade)
- Verifies revision IDs
- Checks for duplicates
- Optionally runs quick validation

**Installation:**
```bash
# Linux/Mac
./scripts/migration_test/install_hooks.sh

# Windows
.\scripts\migration_test\install_hooks.ps1
```

**Skipping:**
```bash
# Skip hook entirely
git commit --no-verify

# Skip migration test only
SKIP_MIGRATION_TEST=1 git commit  # Linux/Mac
$env:SKIP_MIGRATION_TEST=1; git commit  # Windows
```

## Test Reports

All tests generate detailed JSON reports in `backups/migration_test/`:

### migration_validation_report.json

```json
{
  "timestamp": "2024-01-20T10:00:00",
  "database": "localhost:5432/fastapi_db_migration_test",
  "tests": [
    {
      "test": "alembic_upgrade",
      "status": "passed",
      "output": "..."
    }
  ],
  "errors": [],
  "warnings": [],
  "summary": {
    "total_tests": 4,
    "passed_tests": 4,
    "failed_tests": 0,
    "total_errors": 0,
    "total_warnings": 2,
    "overall_status": "PASSED"
  }
}
```

### recent_migrations_test_report.json

```json
{
  "timestamp": "2024-01-20T10:00:00",
  "migrations_tested": [
    {
      "revision": "040",
      "description": "schema drift detection",
      "tests": [
        {"step": "downgrade", "status": "passed"},
        {"step": "upgrade", "status": "passed"}
      ],
      "schema_changes": {
        "tables_added": [],
        "tables_modified": []
      },
      "errors": []
    }
  ],
  "summary": {
    "total_migrations_tested": 5,
    "passed": 5,
    "failed": 0
  }
}
```

### schema_comparison_report.json

```json
{
  "timestamp": "2024-01-20T10:00:00",
  "comparison": {
    "first_database": "localhost:5432/fastapi_db",
    "second_database": "localhost:5432/fastapi_db_migration_test"
  },
  "differences": {
    "tables": {
      "only_in_first": [],
      "only_in_second": [],
      "different": []
    },
    "enums": {
      "only_in_first": [],
      "only_in_second": []
    }
  }
}
```

## Workflow

### Daily Development

1. Create migration:
   ```bash
   alembic revision --autogenerate -m "add user verification"
   ```

2. Test migration:
   ```bash
   python scripts/migration_test/validate_migrations.py
   ```

3. Commit (pre-commit hook runs automatically):
   ```bash
   git add alembic/versions/XXX_add_user_verification.py
   git commit -m "Add user verification migration"
   ```

### Before Production Deployment

1. Run comprehensive test suite:
   ```bash
   ./scripts/migration_test/run_all_tests.sh  # or .ps1
   ```

2. Review all reports in `backups/migration_test/`

3. Backup production schema:
   ```bash
   ./scripts/migration_test/backup_production_schema.sh
   ```

4. Test on production-like data (if available)

5. Apply migrations to production:
   ```bash
   alembic upgrade head
   ```

### CI/CD Pipeline

Example GitHub Actions workflow (see `.github/workflows/migration-tests.yml.example`):

```yaml
- name: Run migration tests
  run: |
    chmod +x scripts/migration_test/run_all_tests.sh
    ./scripts/migration_test/run_all_tests.sh
```

## Configuration

### Test Database Configuration

After running `setup_test_db.sh/ps1`, a `.env.test.migration` file is created:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=fastapi_db_migration_test
```

### Environment Variables

All scripts support environment variable overrides:

- `DATABASE_HOST` - PostgreSQL host
- `DATABASE_PORT` - PostgreSQL port
- `DATABASE_USER` - PostgreSQL user
- `DATABASE_PASSWORD` - PostgreSQL password
- `DATABASE_NAME` - Database name (for production backups)
- `TEST_DATABASE_NAME` - Test database name

## Troubleshooting

### "Cannot connect to PostgreSQL"

1. Check if PostgreSQL is running:
   ```bash
   psql -U postgres -c "SELECT 1"
   ```

2. Verify credentials in `.env`

3. Check PostgreSQL is accepting connections on the specified port

### "Migration failed"

1. Review the error message in console output
2. Check the migration file syntax
3. Test manually:
   ```bash
   alembic upgrade +1
   alembic downgrade -1
   ```

### "Test database already exists"

The scripts automatically drop and recreate the database. If issues persist:

```bash
# Manually drop
psql -U postgres -c "DROP DATABASE IF EXISTS fastapi_db_migration_test;"

# Recreate
./scripts/migration_test/setup_test_db.sh
```

### "Schema comparison shows differences"

This may be expected if:
- Production has manual changes
- Different migration paths were used
- Schema drift has occurred

Review the comparison report to understand differences.

## Best Practices

1. **Test Early, Test Often**
   - Test migrations as soon as they're created
   - Run full test suite before merging PRs

2. **Use Descriptive Names**
   - Clear migration messages
   - Follow naming convention: `NNN_descriptive_name.py`

3. **Review Auto-generated Migrations**
   - Alembic's autogenerate is helpful but not perfect
   - Always review and edit generated migrations

4. **Test Both Paths**
   - Always implement downgrade functions
   - Test both upgrade and downgrade

5. **Keep Backups**
   - Regular production schema backups
   - Store backups before major deployments

6. **Use Pre-commit Hooks**
   - Catch issues early
   - Ensure consistency

7. **Monitor in CI/CD**
   - Run tests on every PR
   - Block merges if tests fail

8. **Document Complex Migrations**
   - Add comments explaining logic
   - Document data migrations

## Advanced Usage

### Custom Test Scenarios

Extend the validators by adding custom checks:

```python
# In validate_migrations.py

def custom_validation(self):
    """Add custom validation logic"""
    # Your validation code here
    pass
```

### Integration with Other Tools

- **Sentry:** Monitor migration failures
- **Slack:** Send notifications on test results
- **DataDog:** Track migration performance

### Production Schema Versioning

Keep historical schema versions:

```bash
# Create dated backup
./scripts/migration_test/backup_production_schema.sh

# Archive contains: schema_fastapi_db_YYYYMMDD_HHMMSS.sql
```

## Support

- Check the main documentation: `alembic/README.md`
- Quick start guide: `scripts/migration_test/QUICK_START.md`
- Review test reports in `backups/migration_test/`
- Check Alembic docs: https://alembic.sqlalchemy.org/

## Contributing

When adding new test scripts:

1. Follow existing naming conventions
2. Add both Bash and PowerShell versions
3. Update this README
4. Add examples to QUICK_START.md
5. Update the GitHub Actions workflow example

---

**Version:** 1.0.0  
**Last Updated:** 2024-01-20  
**Maintained By:** Development Team
