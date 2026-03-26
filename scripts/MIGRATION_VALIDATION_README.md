# Migration Validation Script

## Overview

The `validate_migrations.py` script scans Alembic migration files to detect MySQL compatibility issues, particularly focusing on Boolean column definitions that use string defaults instead of numeric defaults.

## Why This Is Important

MySQL represents Boolean columns as `TINYINT(1)` under the hood:
- `TRUE` is stored as `1`
- `FALSE` is stored as `0`

Using string defaults like `'true'` or `'false'` can cause:
- SQL syntax errors during migration execution
- Data type mismatches
- Unpredictable behavior across different database engines
- Migration failures in production environments

## Usage

### Validate All Migrations

```bash
# Using poetry
poetry run python scripts/validate_migrations.py

# Direct execution
python scripts/validate_migrations.py
```

### Validate a Specific Migration File

```bash
poetry run python scripts/validate_migrations.py --file alembic/versions/001_create_multi_tenant_schema.py
```

### Verbose Output

```bash
poetry run python scripts/validate_migrations.py --verbose
```

### Custom Migrations Directory

```bash
poetry run python scripts/validate_migrations.py --migrations-dir /path/to/alembic
```

## Integration

### Pre-commit Hook

The validation script is automatically integrated into pre-commit hooks. It runs whenever migration files in `alembic/versions/` are modified.

To run pre-commit manually:
```bash
pre-commit run validate-migrations --all-files
```

### CI/CD Pipeline

The validation is integrated into:

#### GitLab CI
- Runs in the `quality` stage
- Only executes when migration files change
- Blocks the pipeline if errors are found

#### GitHub Actions
- Runs as part of the `code-quality` job
- Executes on every push/PR
- Fails the build if errors are detected

## Detected Issues

The script detects the following patterns:

### ❌ Incorrect: String Boolean Defaults

```python
# String server_default - WRONG
sa.Column('is_active', sa.Boolean(), server_default='true')
sa.Column('is_enabled', sa.Boolean(), server_default='false')

# String with text() - WRONG
sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'))
sa.Column('is_enabled', sa.Boolean(), server_default=sa.text('TRUE'))

# String default parameter - WRONG
sa.Column('is_active', sa.Boolean(create_constraint=True, default='true'))
```

### ✅ Correct: Numeric Boolean Defaults

```python
# Numeric server_default with text() - CORRECT for MySQL
sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1'))
sa.Column('is_enabled', sa.Boolean(), nullable=False, server_default=sa.text('0'))

# Python boolean for application-level default - CORRECT
sa.Column('is_active', sa.Boolean(), nullable=False, default=True)
sa.Column('is_enabled', sa.Boolean(), nullable=False, default=False)

# Combined: server default (DB) and Python default (app) - CORRECT
sa.Column('is_active', sa.Boolean(), nullable=False, 
          default=True, server_default=sa.text('1'))
```

## Best Practices

### Boolean Column Patterns

1. **With Server Default (Database-level)**
   ```python
   sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1'))
   ```

2. **With Application Default Only**
   ```python
   sa.Column('is_active', sa.Boolean(), nullable=False, default=True)
   ```

3. **With Both Server and Application Defaults**
   ```python
   sa.Column('is_active', sa.Boolean(), nullable=False, 
             default=True, server_default=sa.text('1'))
   ```

### When to Use Which Approach

- **`server_default`**: Use when you want the database to provide a default value. This is safer for direct SQL inserts and ensures consistency at the database level.

- **`default`**: Use when you want SQLAlchemy to provide the default value at the application level. The database won't have a default constraint.

- **Both**: Recommended approach for maximum compatibility. The server_default ensures database-level consistency, while the Python default helps with ORM operations.

## Output Format

### Success Case
```
================================================================================
✓ MIGRATION VALIDATION PASSED
================================================================================

No MySQL compatibility issues found in migration files.
```

### Failure Case
```
================================================================================
✗ MIGRATION VALIDATION FAILED
================================================================================

Found 2 error(s) and 1 warning(s)

📄 alembic/versions/009_enhance_gamification_tables.py
--------------------------------------------------------------------------------

❌ Line 28: Boolean column using string server_default
   Boolean columns must use numeric defaults (0/1) for MySQL
   Code: sa.Column('auto_award', sa.Boolean(), nullable=False, server_default='true'),
   💡 Suggestion: Use server_default=sa.text('0') or server_default=sa.text('1') for MySQL compatibility

================================================================================
MYSQL BOOLEAN COLUMN BEST PRACTICES:
--------------------------------------------------------------------------------
✓ Use server_default=sa.text('0') or sa.text('1') for boolean columns
✓ Use Python bool (True/False) for default parameter (application-level default)
✗ Avoid string literals like 'true', 'false', 'TRUE', 'FALSE'

Example:
  sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1'))
================================================================================
```

## Exit Codes

- `0`: Success - no errors found (warnings are OK)
- `1`: Failure - one or more errors detected

## Maintenance

### Adding New Patterns

To detect additional MySQL compatibility issues, edit `scripts/validate_migrations.py` and add patterns to:

- `BOOLEAN_STRING_DEFAULT_PATTERNS`: For Boolean-specific issues
- `MYSQL_COMPATIBILITY_PATTERNS`: For general MySQL compatibility issues

Each pattern tuple contains:
1. Regex pattern to match
2. Issue description
3. Suggestion for fix

### Testing the Script

```bash
# Test on all migrations
poetry run python scripts/validate_migrations.py

# Test on specific file
poetry run python scripts/validate_migrations.py --file alembic/versions/test.py

# Test with verbose output to see all details
poetry run python scripts/validate_migrations.py --verbose
```

## Related Documentation

- [Alembic MySQL Migration Guide](../alembic/MYSQL_MIGRATION_GUIDE.md)
- [Migration Testing Guide](../scripts/MIGRATION_README.md)
- [SQLAlchemy Boolean Type Documentation](https://docs.sqlalchemy.org/en/20/core/type_basics.html#sqlalchemy.types.Boolean)

## Troubleshooting

### Script Not Running in Pre-commit

1. Ensure pre-commit is installed:
   ```bash
   poetry run pre-commit install
   ```

2. Run manually to test:
   ```bash
   poetry run pre-commit run validate-migrations --all-files
   ```

### False Positives

If the script reports false positives, you can:
1. Add exclusion patterns to the script
2. Use inline comments to document why a pattern is intentional
3. Contact the development team to refine the validation rules

## Contributing

When adding new validation rules:
1. Test against existing migrations
2. Document the pattern being detected
3. Provide clear suggestions for fixes
4. Update this README with examples
