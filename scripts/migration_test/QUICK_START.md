# Migration Testing - Quick Start Guide

This guide will get you started with the migration testing environment in 5 minutes.

## Prerequisites

- PostgreSQL server running
- Python 3.9+ installed
- Database credentials configured in `.env`

## Setup (First Time Only)

### Windows (PowerShell)

```powershell
# 1. Set up test database
.\scripts\migration_test\setup_test_db.ps1

# 2. Backup production schema (optional)
.\scripts\migration_test\backup_production_schema.ps1

# 3. Install pre-commit hooks (optional)
.\scripts\migration_test\install_hooks.ps1
```

### Linux/Mac

```bash
# 1. Set up test database
chmod +x scripts/migration_test/*.sh
./scripts/migration_test/setup_test_db.sh

# 2. Backup production schema (optional)
./scripts/migration_test/backup_production_schema.sh

# 3. Install pre-commit hooks (optional)
./scripts/migration_test/install_hooks.sh
```

## Daily Usage

### Test All Migrations

```bash
# Windows
.\scripts\migration_test\run_all_tests.ps1

# Linux/Mac
./scripts/migration_test/run_all_tests.sh
```

### Test Specific Migrations

```bash
# Test last 5 migrations
python scripts/migration_test/test_recent_migrations.py -n 5

# Full validation
python scripts/migration_test/validate_migrations.py

# Compare schemas
python scripts/migration_test/compare_schemas.py fastapi_db fastapi_db_migration_test
```

## Creating New Migrations

```bash
# 1. Create migration
alembic revision --autogenerate -m "descriptive message"

# 2. Review generated migration file
# Edit alembic/versions/XXX_descriptive_message.py

# 3. Test migration
python scripts/migration_test/validate_migrations.py

# 4. Commit
git add alembic/versions/XXX_descriptive_message.py
git commit -m "Add migration: descriptive message"
# Pre-commit hook will run automatically
```

## Common Commands

### View Migration Status

```bash
# Current version
alembic current

# Migration history
alembic history

# Show pending migrations
alembic heads
```

### Apply Migrations

```bash
# Upgrade to latest
alembic upgrade head

# Upgrade one step
alembic upgrade +1

# Downgrade one step
alembic downgrade -1
```

### Test Database Management

```bash
# Recreate test database
# Windows
.\scripts\migration_test\setup_test_db.ps1

# Linux/Mac
./scripts/migration_test/setup_test_db.sh

# Clean up test database
psql -U postgres -c "DROP DATABASE IF EXISTS fastapi_db_migration_test;"
```

## Viewing Reports

After running tests, check the reports in `backups/migration_test/`:

- `migration_validation_report.json` - Full validation results
- `recent_migrations_test_report.json` - Recent migrations test results
- `schema_comparison_report.json` - Schema differences
- `test_suite_summary.txt` - Overall summary

## Troubleshooting

### "Cannot connect to database"

Check your PostgreSQL connection:
```bash
psql -U postgres -h localhost -c "SELECT 1"
```

Verify `.env` file has correct credentials:
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
```

### "Migration failed"

1. Check error message in console output
2. Review migration file syntax
3. Test upgrade/downgrade manually:
   ```bash
   alembic upgrade +1
   alembic downgrade -1
   ```

### "Test database already exists"

The setup script automatically drops and recreates the test database. If you encounter issues:

```bash
# Manually drop and recreate
psql -U postgres -c "DROP DATABASE IF EXISTS fastapi_db_migration_test;"
./scripts/migration_test/setup_test_db.sh  # or .ps1 on Windows
```

### "Pre-commit hook blocking commit"

To skip the hook:
```bash
git commit --no-verify
```

To skip only migration tests:
```bash
# Linux/Mac
SKIP_MIGRATION_TEST=1 git commit

# Windows PowerShell
$env:SKIP_MIGRATION_TEST=1; git commit
```

## Best Practices

1. **Always test migrations** before committing
2. **Test both upgrade and downgrade** paths
3. **Use descriptive migration messages**
4. **Review auto-generated migrations** - they may need manual adjustments
5. **Keep migrations idempotent** - check if objects exist before creating
6. **Test with production-like data** when possible

## CI/CD Integration

The test suite is designed to run in CI/CD pipelines. Example for GitHub Actions:

```yaml
- name: Run migration tests
  run: |
    chmod +x scripts/migration_test/run_all_tests.sh
    ./scripts/migration_test/run_all_tests.sh
```

## Getting Help

- Check `alembic/README.md` for detailed documentation
- Review test reports in `backups/migration_test/`
- Check Alembic docs: https://alembic.sqlalchemy.org/

## Next Steps

- Read the full documentation in `alembic/README.md`
- Explore example migrations in `alembic/versions/`
- Set up CI/CD integration
- Configure production schema backups
