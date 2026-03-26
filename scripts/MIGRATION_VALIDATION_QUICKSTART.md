# Migration Validation - Quick Start Guide

## 🚀 Quick Commands

```bash
# Validate all migrations
make validate-migrations

# Validate with detailed output
make validate-migrations-verbose

# Direct execution
poetry run python scripts/validate_migrations.py

# Validate specific file
poetry run python scripts/validate_migrations.py --file alembic/versions/001_create_multi_tenant_schema.py

# Run as part of quality checks
make quality
```

## ✅ Correct Boolean Column Patterns

### Server Default (Database-level)
```python
sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1'))
sa.Column('is_verified', sa.Boolean(), nullable=False, server_default=sa.text('0'))
```

### Application Default (ORM-level)
```python
sa.Column('is_active', sa.Boolean(), nullable=False, default=True)
sa.Column('is_verified', sa.Boolean(), nullable=False, default=False)
```

### Best Practice (Both)
```python
sa.Column('is_active', sa.Boolean(), nullable=False, 
          default=True, server_default=sa.text('1'))
```

## ❌ Incorrect Patterns (Will Be Caught)

```python
# String literals
sa.Column('is_active', sa.Boolean(), server_default='true')
sa.Column('is_active', sa.Boolean(), server_default='false')

# String with sa.text()
sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'))
sa.Column('is_active', sa.Boolean(), server_default=sa.text('TRUE'))

# PostgreSQL boolean literals
sa.Column('is_active', sa.Boolean(), server_default=sa.text('TRUE'))
```

## 🔍 What Gets Validated

- ✓ Boolean columns with string defaults ('true', 'false', etc.)
- ✓ PostgreSQL-specific boolean literals
- ✓ Incorrect use of sa.text() with string booleans
- ✓ Mixed case boolean strings (True, False, TRUE, FALSE)

## 🔧 Integration Points

### Pre-commit Hook
Automatically runs on migration file changes:
```bash
# Install hooks
pre-commit install

# Run manually
pre-commit run validate-migrations --all-files
```

### CI/CD
- **GitLab CI**: Runs in `quality` stage when migrations change
- **GitHub Actions**: Runs in `code-quality` job on every push/PR

### Make Target
Part of the `quality` target:
```bash
make quality  # Includes migration validation
```

## 📖 Full Documentation

See [MIGRATION_VALIDATION_README.md](./MIGRATION_VALIDATION_README.md) for complete details.

See [alembic/MYSQL_MIGRATION_GUIDE.md](../alembic/MYSQL_MIGRATION_GUIDE.md) for MySQL best practices.
