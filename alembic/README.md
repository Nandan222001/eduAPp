# Alembic Database Migrations

This directory contains database migration scripts managed by [Alembic](https://alembic.sqlalchemy.org/).

## Table of Contents

- [Overview](#overview)
- [Migration Testing Environment](#migration-testing-environment)
- [Quick Start](#quick-start)
- [Creating Migrations](#creating-migrations)
- [Testing Migrations](#testing-migrations)
- [Migration Best Practices](#migration-best-practices)
- [Troubleshooting](#troubleshooting)
- [CI/CD Integration](#cicd-integration)

## Overview

Alembic is used to manage database schema changes in a version-controlled, systematic way. Each migration represents a specific change to the database schema and can be applied (upgrade) or reverted (downgrade).

### Directory Structure

```
alembic/
├── versions/           # Migration scripts
├── env.py             # Alembic environment configuration
├── script.py.mako     # Template for new migrations
└── README.md          # This file
```

## Migration Testing Environment

A comprehensive testing environment has been set up to validate migrations before applying them to production.

### Components

1. **Test Database Setup** - Creates an isolated test database
2. **Schema Backup** - Backs up production schema for comparison
3. **Migration Validation** - Validates migrations automatically
4. **Pre-commit Hooks** - Validates migrations before committing
5. **Test Reports** - Generates detailed validation reports

### Setup Test Environment

#### On Windows (PowerShell)

```powershell
# 1. Set up test database
.\scripts\migration_test\setup_test_db.ps1

# 2. Backup production schema
.\scripts\migration_test\backup_production_schema.ps1

# 3. Install pre-commit hooks (optional)
.\scripts\migration_test\install_hooks.ps1
```

#### On Linux/Mac

```bash
# 1. Set up test database
chmod +x scripts/migration_test/setup_test_db.sh
./scripts/migration_test/setup_test_db.sh

# 2. Backup production schema
chmod +x scripts/migration_test/backup_production_schema.sh
./scripts/migration_test/backup_production_schema.sh

# 3. Install pre-commit hooks (optional)
chmod +x scripts/migration_test/install_hooks.sh
./scripts/migration_test/install_hooks.sh
```

### Test Database Configuration

After running the setup script, a `.env.test.migration` file will be created with test database credentials:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=fastapi_db_migration_test
```

## Quick Start

### View Migration History

```bash
# Show all migrations
alembic history

# Show current version
alembic current

# Show pending migrations
alembic heads
```

### Apply Migrations

```bash
# Upgrade to latest version
alembic upgrade head

# Upgrade by 1 version
alembic upgrade +1

# Upgrade to specific revision
alembic upgrade abc123
```

### Revert Migrations

```bash
# Downgrade by 1 version
alembic downgrade -1

# Downgrade to specific revision
alembic downgrade abc123

# Downgrade all migrations
alembic downgrade base
```

## Creating Migrations

### Auto-generate Migration

Alembic can automatically detect changes in your SQLAlchemy models:

```bash
# Generate migration from model changes
alembic revision --autogenerate -m "descriptive message"
```

### Manual Migration

For complex changes or data migrations:

```bash
# Create empty migration
alembic revision -m "descriptive message"
```

### Migration File Structure

```python
"""descriptive message

Revision ID: abc123
Revises: xyz789
Create Date: 2024-01-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'abc123'
down_revision = 'xyz789'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Add your upgrade logic here
    op.create_table(
        'example_table',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade() -> None:
    # Add your downgrade logic here
    op.drop_table('example_table')
```

## Testing Migrations

### Full Migration Validation

Run comprehensive validation on the test database:

```bash
# Validate all migrations
python scripts/migration_test/validate_migrations.py
```

This will:
- Create a clean test database
- Run all migrations (upgrade to head)
- Verify all tables, columns, and constraints
- Test downgrade/upgrade paths
- Generate validation report

### Test Recent Migrations

Test the last N migrations individually:

```bash
# Test last 5 migrations
python scripts/migration_test/test_recent_migrations.py -n 5
```

This tests each migration by:
- Downgrading to the previous version
- Upgrading to the target version
- Verifying schema changes
- Testing downgrade path

### Validation Reports

Reports are saved to `backups/migration_test/`:

- `migration_validation_report.json` - Full validation results
- `recent_migrations_test_report.json` - Recent migrations test results

### Pre-commit Hook

The pre-commit hook automatically validates migrations before committing:

- Checks migration file syntax
- Validates required functions (upgrade/downgrade)
- Checks for duplicate revision IDs
- Runs quick validation (optional)

To skip the hook for a commit:

```bash
git commit --no-verify
```

To skip migration test only:

```bash
# Linux/Mac
SKIP_MIGRATION_TEST=1 git commit

# Windows PowerShell
$env:SKIP_MIGRATION_TEST=1; git commit
```

## Migration Best Practices

### 1. Always Test Migrations

- Test on a copy of production data when possible
- Test both upgrade and downgrade paths
- Verify data integrity after migrations

### 2. Use Transactions Wisely

PostgreSQL DDL is transactional, so migrations run in a transaction by default. For operations that can't run in a transaction:

```python
def upgrade():
    # For operations that need to run outside a transaction
    op.execute('CREATE INDEX CONCURRENTLY ...')
```

### 3. Handle Existing Data

When adding NOT NULL columns:

```python
def upgrade():
    # Add column as nullable first
    op.add_column('users', sa.Column('new_field', sa.String(50), nullable=True))
    
    # Update existing data
    op.execute("UPDATE users SET new_field = 'default_value' WHERE new_field IS NULL")
    
    # Then make it NOT NULL
    op.alter_column('users', 'new_field', nullable=False)
```

### 4. Use Idempotent Migrations

Check if objects exist before creating/dropping:

```python
def upgrade():
    conn = op.get_bind()
    
    # Check if table exists
    result = conn.execute(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'my_table')"
    ).scalar()
    
    if not result:
        op.create_table('my_table', ...)
```

### 5. Create Indexes for Foreign Keys

Always create indexes on foreign key columns for better performance:

```python
def upgrade():
    op.create_table(
        'child_table',
        sa.Column('parent_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['parent_id'], ['parent_table.id'])
    )
    
    # Add index for foreign key
    op.create_index('idx_child_parent', 'child_table', ['parent_id'])
```

### 6. Use Enums Carefully

For PostgreSQL enums, handle creation and modification carefully:

```python
def upgrade():
    conn = op.get_bind()
    
    # Check if enum exists
    result = conn.execute(
        "SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'my_enum')"
    ).scalar()
    
    if not result:
        op.execute("CREATE TYPE my_enum AS ENUM ('value1', 'value2')")
```

To add a value to an existing enum:

```python
def upgrade():
    op.execute("ALTER TYPE my_enum ADD VALUE IF NOT EXISTS 'new_value'")
```

### 7. Document Complex Migrations

Add clear docstrings and comments:

```python
"""Add user verification system

Revision ID: abc123
Revises: xyz789
Create Date: 2024-01-20 10:00:00.000000

This migration adds:
- verification_tokens table for email/phone verification
- verified_at column to users table
- indexes for token lookups

Data migration:
- Sets verified_at to created_at for existing users
"""
```

### 8. Separate Schema and Data Migrations

For clarity, keep schema changes and data migrations in separate files when possible.

### 9. Version Your Migration Revisions

Use meaningful revision IDs:

```bash
# Use sequential numbers for easier tracking
alembic revision -m "001_create_initial_schema"
alembic revision -m "002_add_user_verification"
```

### 10. Test Downgrade Paths

Always implement and test downgrade functions:

```python
def downgrade():
    # Reverse all changes made in upgrade()
    op.drop_index('idx_child_parent', 'child_table')
    op.drop_table('child_table')
```

## Troubleshooting

### Migration Conflicts

If you have multiple heads (branch conflict):

```bash
# Show all heads
alembic heads

# Merge heads
alembic merge -m "merge heads" head1 head2
```

### Stuck at Wrong Revision

If the database revision doesn't match the code:

```bash
# Check current revision
alembic current

# Stamp database to correct revision (use with caution!)
alembic stamp head
```

### Migration Fails Mid-way

If a migration fails partway through:

1. Check the error message
2. Fix the migration file
3. Downgrade to the previous working revision
4. Re-run the upgrade

```bash
# Downgrade to previous version
alembic downgrade -1

# Fix the migration file
# ...

# Try upgrade again
alembic upgrade +1
```

### Duplicate Revision IDs

If you see duplicate revision ID errors:

```bash
# Find duplicates
grep -r "revision = " alembic/versions/*.py | sort

# Fix by updating the duplicate revision ID
# Then run:
alembic upgrade head
```

### Schema Drift

If your database schema drifts from migrations:

```bash
# Run schema validation
python scripts/migration_test/validate_migrations.py

# Compare against baseline
python scripts/migration_test/compare_schemas.py
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Validate Migrations

on: [pull_request]

jobs:
  validate-migrations:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
      
      - name: Set up test database
        run: |
          chmod +x scripts/migration_test/setup_test_db.sh
          ./scripts/migration_test/setup_test_db.sh
      
      - name: Run migration validation
        run: |
          python scripts/migration_test/validate_migrations.py
      
      - name: Test recent migrations
        run: |
          python scripts/migration_test/test_recent_migrations.py -n 3
      
      - name: Upload reports
        if: always()
        uses: actions/upload-artifact@v2
        with:
          name: migration-reports
          path: backups/migration_test/*.json
```

### Running in Docker

```bash
# Build test environment
docker-compose -f docker-compose.test.yml up -d postgres

# Run migrations
docker-compose -f docker-compose.test.yml run --rm app alembic upgrade head

# Run validation
docker-compose -f docker-compose.test.yml run --rm app \
  python scripts/migration_test/validate_migrations.py
```

## Additional Resources

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review validation reports in `backups/migration_test/`
3. Check migration history: `alembic history`
4. Contact the development team

---

**Last Updated:** 2024-01-20  
**Maintained By:** Development Team
