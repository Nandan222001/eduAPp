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
- [MySQL 8.0 Specific Considerations](#mysql-80-specific-considerations)

> **MySQL Users**: See [MySQL Documentation Index](MYSQL_DOCUMENTATION_INDEX.md) for complete MySQL migration documentation.

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

## MySQL 8.0 Specific Considerations

This project uses MySQL 8.0 as the database backend. Below are important MySQL-specific behaviors, limitations, and best practices discovered during comprehensive testing.

> **Quick Start**: See [MYSQL_MIGRATION_QUICK_START.md](MYSQL_MIGRATION_QUICK_START.md) for quick commands and testing workflows.

### Testing MySQL Migrations

#### Comprehensive Migration Test

Run the comprehensive MySQL migration test to validate all migrations:

```bash
# Set test database URL (optional, uses default if not set)
export MYSQL_TEST_DATABASE_URL="mysql+pymysql://root:password@localhost:3306/test_db?charset=utf8mb4"

# Run comprehensive test
python scripts/test_mysql_migrations_comprehensive.py
```

This test performs:
1. Clean database setup
2. `alembic upgrade head` - Creates all tables, indexes, and constraints
3. `alembic downgrade base` - Tests all downgrade paths
4. `alembic upgrade head` - Verifies full migration cycle
5. MySQL-specific analysis and documentation

Results are saved to `backups/migration_test/mysql_migration_test_results.json`

#### Quick MySQL Migration Test

```bash
# Clean start
mysql -u root -p test_db -e "DROP DATABASE IF EXISTS test_db; CREATE DATABASE test_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run migrations
export DATABASE_URL="mysql+pymysql://root:password@localhost:3306/test_db?charset=utf8mb4"
alembic upgrade head

# Verify tables
mysql -u root -p test_db -e "SHOW TABLES;"

# Test downgrade
alembic downgrade base

# Test upgrade again
alembic upgrade head
```

### MySQL-Specific Behaviors

#### 1. Character Set and Collation

**Behavior**: MySQL 8.0 uses `utf8mb4` character set to support full Unicode including emojis.

```sql
-- Recommended database creation
CREATE DATABASE your_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
```

**Impact**:
- Older `utf8` charset only supports 3-byte UTF-8 (BMP characters)
- `utf8mb4` supports 4-byte UTF-8 (including emojis, some Asian characters)
- Index key length limits differ between charsets

**Migration Consideration**:
- Always specify `charset=utf8mb4` in connection string
- Ensure all TEXT/VARCHAR columns use utf8mb4

#### 2. TEXT/BLOB Column Defaults

**Behavior**: MySQL does not allow default values for TEXT, BLOB, MEDIUMTEXT, LONGTEXT, or JSON columns.

```python
# ✗ This will fail in MySQL
sa.Column('description', sa.Text(), nullable=False, server_default='')

# ✓ Correct approach for MySQL
sa.Column('description', sa.Text(), nullable=True)
# Then handle defaults in application code or use triggers
```

**Impact**:
- Cannot use `server_default` with TEXT/BLOB columns
- Must use application-level defaults or make columns nullable

**Migration Consideration**:
- When adding TEXT columns, make them nullable or populate existing rows first
- Use CHECK constraints or application validation for required text fields

#### 3. ENUM Type Handling

**Behavior**: MySQL has native ENUM type, stored as integers with string labels.

```python
# MySQL ENUM in Alembic
status_enum = sa.Enum('PENDING', 'APPROVED', 'REJECTED', name='status_enum')
op.add_column('table_name', sa.Column('status', status_enum, nullable=False))
```

**Impact**:
- Adding ENUM values requires ALTER TABLE operation
- Removing ENUM values is complex (requires column recreation)
- ENUM ordering matters (affects sorting)

**Migration Best Practices**:
```python
# Adding a new value to existing ENUM
def upgrade():
    # MySQL 8.0 doesn't support IF NOT EXISTS for ENUM values
    op.execute("ALTER TABLE table_name MODIFY COLUMN status ENUM('PENDING', 'APPROVED', 'REJECTED', 'NEW_VALUE')")

def downgrade():
    # Removing ENUM value requires data migration first
    op.execute("UPDATE table_name SET status = 'PENDING' WHERE status = 'NEW_VALUE'")
    op.execute("ALTER TABLE table_name MODIFY COLUMN status ENUM('PENDING', 'APPROVED', 'REJECTED')")
```

#### 4. Index Length Limitations

**Behavior**: MySQL has maximum key length limits:
- InnoDB without `innodb_large_prefix`: 767 bytes
- InnoDB with `innodb_large_prefix`: 3072 bytes
- For utf8mb4: 191 characters (767/4) or 768 characters (3072/4)

```python
# ✗ May exceed key length limit
op.create_index('idx_long_text', 'users', ['long_description'])

# ✓ Use prefix length for long columns
op.execute("CREATE INDEX idx_long_text ON users(long_description(191))")
```

**Impact**:
- Cannot index full length of long VARCHAR or TEXT columns
- Composite indexes count toward total key length

**Migration Consideration**:
- Use prefix indexes for long string columns
- Keep indexed VARCHAR columns under 191 characters when possible
- Consider using generated columns for computed indexes

#### 5. Foreign Key Constraints

**Behavior**: InnoDB enforces foreign key constraints and requires indexes on FK columns.

```python
# MySQL automatically creates index on FK columns if not exists
op.create_foreign_key(
    'fk_student_section',
    'students', 'sections',
    ['section_id'], ['id'],
    ondelete='CASCADE'
)
```

**Impact**:
- Parent table must exist before creating FK
- Referenced column must be indexed (PRIMARY KEY or UNIQUE)
- FK actions (CASCADE, SET NULL) affect performance

**Migration Best Practices**:
- Always create parent tables before child tables
- Explicitly create indexes on FK columns for better control
- Use `ondelete='CASCADE'` for dependent data
- Use `ondelete='SET NULL'` for optional relationships

#### 6. JSON Column Support

**Behavior**: MySQL 8.0 has native JSON column type with validation and querying.

```python
# Native JSON column
sa.Column('metadata', sa.JSON(), nullable=True)

# Querying JSON in MySQL
op.execute("""
    SELECT * FROM table_name 
    WHERE JSON_EXTRACT(metadata, '$.key') = 'value'
""")
```

**Impact**:
- JSON data is validated on insert/update
- JSON functions available for queries
- Performance may be slower than normalized data
- No default values allowed (TEXT/BLOB limitation)

**Migration Consideration**:
- Use generated columns to index JSON paths
```python
# Create generated column for JSON path indexing
op.execute("""
    ALTER TABLE table_name 
    ADD COLUMN metadata_key VARCHAR(255) 
    AS (JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.key'))) STORED
""")
op.create_index('idx_metadata_key', 'table_name', ['metadata_key'])
```

#### 7. Transaction Support

**Behavior**: InnoDB is transactional; DDL statements cause implicit commits.

**Impact**:
- Most DDL operations commit current transaction
- Cannot rollback DDL statements in MySQL
- `CREATE INDEX CONCURRENTLY` not available (PostgreSQL only)

**Migration Best Practices**:
```python
def upgrade():
    # Each DDL statement commits implicitly in MySQL
    # Structure migrations carefully
    
    # For large tables, consider:
    # 1. Create new table
    # 2. Copy data in batches
    # 3. Swap tables
    # 4. Drop old table
    pass
```

#### 8. Case Sensitivity

**Behavior**: MySQL table and column name case sensitivity depends on OS:
- Linux: Case-sensitive filesystem = case-sensitive table names
- Windows/Mac: Case-insensitive
- Column names are always case-insensitive in comparisons

**Impact**:
- Table name `Users` ≠ `users` on Linux
- Column name `UserName` = `username` in queries

**Migration Consideration**:
- Use lowercase table names for cross-platform compatibility
- Be consistent with naming conventions

#### 9. Storage Engine

**Behavior**: InnoDB is the default storage engine in MySQL 8.0.

**Features**:
- ACID compliance
- Foreign key support
- Row-level locking
- Crash recovery
- Clustered indexes (PRIMARY KEY)

**Migration Consideration**:
- Ensure all tables use InnoDB
- PRIMARY KEY affects physical row order
- Choose PRIMARY KEY carefully for performance

### MySQL Limitations and Workarounds

#### 1. No Row-Level Security (RLS)

**Limitation**: MySQL does not have PostgreSQL-style Row-Level Security.

**Workaround**: Application-level filtering
```python
# Apply tenant filter in application code
query = session.query(Student).filter(
    Student.institution_id == current_institution_id
)
```

#### 2. Limited ALTER TABLE Operations

**Limitation**: Some ALTER TABLE operations rebuild the entire table.

**Workaround**: 
- Use online DDL where possible (MySQL 8.0)
- Schedule migrations during maintenance windows
- Consider pt-online-schema-change for large tables

#### 3. No Partial Indexes

**Limitation**: MySQL does not support PostgreSQL-style partial indexes (WHERE clause).

**Workaround**: 
```python
# PostgreSQL: CREATE INDEX idx ON table (col) WHERE active = true
# MySQL: Include condition in queries or use filtered index
# For MySQL 8.0+, use functional indexes
op.execute("""
    CREATE INDEX idx_active_users ON users((CASE WHEN active = 1 THEN id END))
""")
```

#### 4. No EXCLUDE Constraints

**Limitation**: MySQL does not have EXCLUDE constraints for range overlaps.

**Workaround**: 
- Implement in application logic
- Use triggers for complex constraints
- Consider using CHECK constraints (MySQL 8.0.16+)

### Performance Considerations

#### Bulk Insert Performance

```python
# Use bulk insert for better performance
students = [Student(...) for _ in range(1000)]
session.bulk_insert_mappings(Student, [s.__dict__ for s in students])
session.commit()
```

#### Index Usage

```sql
-- Check index usage
EXPLAIN SELECT * FROM students WHERE institution_id = 1;

-- Verify indexes exist
SHOW INDEX FROM students;

-- Check index statistics
SELECT * FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = 'your_db' AND TABLE_NAME = 'students';
```

#### Query Optimization

```python
# Use joins instead of N+1 queries
students = session.query(Student)\
    .join(Section)\
    .join(Grade)\
    .filter(Student.institution_id == inst_id)\
    .all()

# Use select_in loading for relationships
students = session.query(Student)\
    .options(selectinload(Student.attendance_records))\
    .all()
```

### Migration Testing Checklist

- [ ] Run `python scripts/test_mysql_migrations_comprehensive.py`
- [ ] Verify all tables created successfully
- [ ] Check all indexes are in place
- [ ] Verify foreign key constraints
- [ ] Test downgrade path (`alembic downgrade base`)
- [ ] Test upgrade path again (`alembic upgrade head`)
- [ ] Check character set is utf8mb4
- [ ] Review JSON column usage
- [ ] Verify ENUM types are correct
- [ ] Test with sample data (multi-tenant)
- [ ] Check query performance with indexes
- [ ] Verify data isolation works correctly
- [ ] Review test results in `backups/migration_test/`

### Common MySQL Migration Errors

#### Error: "Specified key was too long"

```
Error: Specified key was too long; max key length is 3072 bytes
```

**Solution**:
```python
# Use prefix length for long columns
op.execute("CREATE INDEX idx_name ON table(long_column(191))")

# Or reduce VARCHAR length
op.alter_column('table', 'long_column', type_=sa.String(191))
```

#### Error: "Cannot add foreign key constraint"

```
Error: Cannot add foreign key constraint
```

**Solutions**:
1. Ensure parent table exists
2. Ensure referenced column is indexed
3. Check data types match exactly
4. Verify no orphaned records exist

```python
# Check for orphaned records before adding FK
op.execute("""
    SELECT COUNT(*) FROM child 
    WHERE parent_id NOT IN (SELECT id FROM parent)
""")
```

#### Error: "Invalid default value for TEXT"

```
Error: BLOB/TEXT column 'description' can't have a default value
```

**Solution**:
```python
# Remove server_default for TEXT columns
sa.Column('description', sa.Text(), nullable=True)  # No server_default
```

### Additional Resources

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [MySQL 8.0 Documentation](https://dev.mysql.com/doc/refman/8.0/en/)
- [MySQL 8.0 InnoDB](https://dev.mysql.com/doc/refman/8.0/en/innodb-storage-engine.html)
- [MySQL 8.0 JSON Functions](https://dev.mysql.com/doc/refman/8.0/en/json-functions.html)

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review MySQL-specific considerations above
3. Review validation reports in `backups/migration_test/`
4. Check migration history: `alembic history`
5. Run comprehensive MySQL test: `python scripts/test_mysql_migrations_comprehensive.py`
6. Contact the development team

---

**Last Updated:** 2024-01-20  
**Maintained By:** Development Team
