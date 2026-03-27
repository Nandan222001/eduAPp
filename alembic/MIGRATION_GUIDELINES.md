# Migration Best Practices and Guidelines

## Table of Contents
1. [Overview](#overview)
2. [Idempotent Migration Patterns](#idempotent-migration-patterns)
3. [Checking Object Existence](#checking-object-existence)
4. [Database-Specific Patterns](#database-specific-patterns)
5. [Testing Procedures](#testing-procedures)
6. [Rollback Testing](#rollback-testing)
7. [Common Pitfalls](#common-pitfalls)
8. [Code Examples](#code-examples)

## Overview

Migrations should be **idempotent** - they can be run multiple times without causing errors or unintended side effects. This is critical for:
- **Recovery**: Re-running failed migrations after fixes
- **Multi-environment deployments**: Handling partially applied migrations
- **Database state variations**: Working with databases in different states
- **CI/CD pipelines**: Ensuring reliable automated deployments

## Idempotent Migration Patterns

### Core Principle
Always check if a database object exists before creating it, and verify it exists before dropping it.

### When to Use Idempotent Patterns

**ALWAYS use for:**
- Creating/dropping tables
- Creating/dropping indexes
- Adding/removing columns
- Creating/dropping constraints (foreign keys, unique constraints, check constraints)
- Creating/dropping triggers, views, or stored procedures

**Optional for:**
- Data migrations (may need different logic based on requirements)
- One-time fixes (use with caution and document thoroughly)

## Checking Object Existence

### Using SQLAlchemy Inspector

The `Inspector` is your primary tool for checking database state:

```python
from alembic import op
import sqlalchemy as sa

def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    # Your migration logic here
```

### Table Existence Check

```python
def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    if 'users' not in inspector.get_table_names():
        op.create_table(
            'users',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('email', sa.String(255), nullable=False),
            sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.PrimaryKeyConstraint('id')
        )
```

### Index Existence Check

```python
def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    # Get existing indexes for a table
    existing_indexes = {idx['name'] for idx in inspector.get_indexes('users')}
    
    if 'idx_users_email' not in existing_indexes:
        op.create_index('idx_users_email', 'users', ['email'])
```

### Column Existence Check

```python
def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    # Get existing columns for a table
    existing_columns = {col['name'] for col in inspector.get_columns('users')}
    
    if 'phone_number' not in existing_columns:
        op.add_column('users', sa.Column('phone_number', sa.String(20), nullable=True))
```

### Foreign Key Constraint Check

```python
def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    # Get existing foreign keys
    existing_fks = {fk['name'] for fk in inspector.get_foreign_keys('orders')}
    
    if 'fk_orders_user_id' not in existing_fks:
        op.create_foreign_key(
            'fk_orders_user_id',
            'orders',
            'users',
            ['user_id'],
            ['id'],
            ondelete='CASCADE'
        )
```

### Unique Constraint Check

```python
def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    # Get existing unique constraints
    existing_constraints = {uc['name'] for uc in inspector.get_unique_constraints('users')}
    
    if 'uq_users_email' not in existing_constraints:
        op.create_unique_constraint('uq_users_email', 'users', ['email'])
```

## Database-Specific Patterns

### MySQL: IF NOT EXISTS

MySQL supports native `IF NOT EXISTS` clauses for some operations:

```python
def upgrade():
    bind = op.get_bind()
    
    # For MySQL, you can use raw SQL with IF NOT EXISTS
    if bind.dialect.name == 'mysql':
        op.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
    else:
        # Fallback to inspector pattern for other databases
        inspector = sa.inspect(bind)
        if 'users' not in inspector.get_table_names():
            op.create_table(
                'users',
                sa.Column('id', sa.Integer(), nullable=False),
                sa.Column('email', sa.String(255), nullable=False),
                sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
                sa.PrimaryKeyConstraint('id')
            )
```

### PostgreSQL: CREATE IF NOT EXISTS

```python
def upgrade():
    bind = op.get_bind()
    
    if bind.dialect.name == 'postgresql':
        op.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
```

### SQLite Considerations

SQLite has limited ALTER TABLE support. Be aware:
- Cannot drop columns (until SQLite 3.35.0+)
- Cannot modify column types directly
- Limited constraint modification

```python
def upgrade():
    bind = op.get_bind()
    
    if bind.dialect.name == 'sqlite':
        # Use batch operations for complex changes
        with op.batch_alter_table('users') as batch_op:
            batch_op.add_column(sa.Column('new_field', sa.String(100)))
```

## Testing Procedures

### Test Matrix

Every migration should be tested in the following scenarios:

#### 1. Fresh Database
```bash
# Start with empty database
alembic upgrade head
# Verify: All objects created successfully
```

#### 2. Existing Database with Previous Migrations
```bash
# Database at revision N-1
alembic upgrade head
# Verify: Migration applies cleanly
```

#### 3. Partial State Database
```bash
# Manually create some objects that migration will create
# Run migration
alembic upgrade head
# Verify: No errors, idempotent behavior works
```

#### 4. Re-run After Failure
```bash
# Simulate failure mid-migration (comment out part of upgrade)
alembic upgrade head  # Fails
# Fix the migration
alembic upgrade head  # Should succeed
```

### Testing Checklist

- [ ] Migration applies successfully on fresh database
- [ ] Migration applies successfully on database with all previous migrations
- [ ] Migration is idempotent (can be run multiple times)
- [ ] Downgrade successfully removes all changes
- [ ] Downgrade is idempotent (can be run multiple times)
- [ ] Foreign key relationships are maintained
- [ ] Indexes are created as expected
- [ ] Data integrity is preserved (for data migrations)
- [ ] No orphaned database objects after downgrade
- [ ] Performance impact is acceptable (for large tables)

### Testing with Existing Data

When testing migrations that modify existing tables:

```python
def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    # Check table exists and has data
    if 'users' in inspector.get_table_names():
        # Get existing columns
        existing_columns = {col['name'] for col in inspector.get_columns('users')}
        
        # Add nullable column first if table has data
        if 'status' not in existing_columns:
            # Step 1: Add as nullable
            op.add_column('users', sa.Column('status', sa.String(20), nullable=True))
            
            # Step 2: Populate existing rows
            op.execute("UPDATE users SET status = 'active' WHERE status IS NULL")
            
            # Step 3: Make NOT NULL if needed
            op.alter_column('users', 'status', nullable=False)
```

### Testing Script Template

Create a test script for each migration:

```python
"""
Test script for migration XXX_description

Run this before committing the migration:
    python test_migration_XXX.py
"""
import subprocess
import sys

def run_command(cmd):
    """Run command and return success status"""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    print(result.stdout)
    if result.returncode != 0:
        print(result.stderr, file=sys.stderr)
    return result.returncode == 0

def test_migration():
    """Test migration in various scenarios"""
    
    print("Test 1: Fresh database...")
    if not run_command("alembic downgrade base"):
        return False
    if not run_command("alembic upgrade head"):
        return False
    
    print("\nTest 2: Idempotent upgrade...")
    if not run_command("alembic upgrade head"):
        return False
    
    print("\nTest 3: Downgrade...")
    if not run_command("alembic downgrade -1"):
        return False
    
    print("\nTest 4: Idempotent downgrade...")
    if not run_command("alembic downgrade -1"):
        return False
    
    print("\nTest 5: Re-upgrade...")
    if not run_command("alembic upgrade head"):
        return False
    
    print("\n✓ All tests passed!")
    return True

if __name__ == "__main__":
    success = test_migration()
    sys.exit(0 if success else 1)
```

## Rollback Testing

### Rollback Requirements

Every migration MUST have a working downgrade function that:
1. Removes all objects created in upgrade
2. Restores all objects removed in upgrade
3. Is idempotent (can be run multiple times)
4. Handles partial application states

### Downgrade Pattern

```python
def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    # Drop in reverse order of creation
    # Always check existence before dropping
    
    # 1. Drop indexes first
    if 'users' in inspector.get_table_names():
        existing_indexes = {idx['name'] for idx in inspector.get_indexes('users')}
        if 'idx_users_email' in existing_indexes:
            op.drop_index('idx_users_email', 'users')
    
    # 2. Drop foreign keys
    if 'orders' in inspector.get_table_names():
        existing_fks = {fk['name'] for fk in inspector.get_foreign_keys('orders')}
        if 'fk_orders_user_id' in existing_fks:
            op.drop_constraint('fk_orders_user_id', 'orders', type_='foreignkey')
    
    # 3. Drop tables
    if 'orders' in inspector.get_table_names():
        op.drop_table('orders')
    
    if 'users' in inspector.get_table_names():
        op.drop_table('users')
```

### Critical Rollback Considerations

1. **Order Matters**: Drop objects in reverse dependency order
   - Indexes → Foreign Keys → Tables

2. **Data Loss**: Document any destructive operations
   ```python
   def downgrade():
       """
       WARNING: This migration drops the 'audit_logs' table.
       All audit data will be permanently lost.
       Backup the table before running this downgrade.
       """
       bind = op.get_bind()
       inspector = sa.inspect(bind)
       
       if 'audit_logs' in inspector.get_table_names():
           op.drop_table('audit_logs')
   ```

3. **Irreversible Migrations**: Some migrations cannot be reversed
   ```python
   def downgrade():
       """
       This migration cannot be reversed because it involves
       data transformations that cannot be undone without data loss.
       
       Manual intervention required:
       1. Restore from backup
       2. Re-apply migrations up to previous revision
       """
       raise NotImplementedError(
           "This migration cannot be automatically reversed. "
           "See migration docstring for manual steps."
       )
   ```

### Rollback Testing Procedure

```bash
# 1. Apply migration
alembic upgrade head

# 2. Verify database state
# Check tables, indexes, constraints created

# 3. Rollback migration
alembic downgrade -1

# 4. Verify complete rollback
# Ensure all objects removed, database in previous state

# 5. Test idempotent rollback
alembic downgrade -1
# Should not error

# 6. Re-apply
alembic upgrade head
# Should work after rollback
```

## Common Pitfalls

### ❌ Non-Idempotent: Missing Existence Checks
```python
def upgrade():
    # BAD: Will fail if table exists
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
```

### ✅ Idempotent: With Existence Check
```python
def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    # GOOD: Checks before creating
    if 'users' not in inspector.get_table_names():
        op.create_table(
            'users',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.PrimaryKeyConstraint('id')
        )
```

### ❌ Missing Constraint Names
```python
def upgrade():
    # BAD: No constraint name, can't drop reliably
    op.create_foreign_key(
        None,  # Auto-generated name varies by database
        'orders', 'users',
        ['user_id'], ['id']
    )
```

### ✅ Named Constraints
```python
def upgrade():
    # GOOD: Explicit name for reliable drops
    op.create_foreign_key(
        'fk_orders_user_id',
        'orders', 'users',
        ['user_id'], ['id'],
        ondelete='CASCADE'
    )
```

### ❌ Incomplete Downgrade
```python
def downgrade():
    # BAD: Doesn't check existence, drops only table
    op.drop_table('users')
```

### ✅ Complete Idempotent Downgrade
```python
def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    # GOOD: Checks existence, removes all related objects
    if 'users' in inspector.get_table_names():
        # Drop indexes first
        existing_indexes = {idx['name'] for idx in inspector.get_indexes('users')}
        if 'idx_users_email' in existing_indexes:
            op.drop_index('idx_users_email', 'users')
        
        # Then drop table
        op.drop_table('users')
```

### ❌ Modifying Populated Tables Without Care
```python
def upgrade():
    # BAD: Makes column NOT NULL immediately, fails if NULLs exist
    op.add_column('users', sa.Column('status', sa.String(20), nullable=False))
```

### ✅ Safe Column Addition with Default
```python
def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    if 'users' in inspector.get_table_names():
        existing_columns = {col['name'] for col in inspector.get_columns('users')}
        
        if 'status' not in existing_columns:
            # GOOD: Add as nullable with default
            op.add_column('users', 
                sa.Column('status', sa.String(20), 
                         nullable=True, 
                         server_default='active'))
            
            # Update existing rows
            op.execute("UPDATE users SET status = 'active' WHERE status IS NULL")
            
            # Optional: Make NOT NULL after populating
            # op.alter_column('users', 'status', nullable=False)
```

## Code Examples

### Complete Migration Example

```python
"""Add user authentication fields

Revision ID: 015
Revises: 014
Create Date: 2024-01-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '015'
down_revision = '014'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    # Add columns to existing table
    if 'users' in inspector.get_table_names():
        existing_columns = {col['name'] for col in inspector.get_columns('users')}
        
        if 'password_hash' not in existing_columns:
            op.add_column('users', 
                sa.Column('password_hash', sa.String(255), nullable=True))
        
        if 'last_login' not in existing_columns:
            op.add_column('users', 
                sa.Column('last_login', sa.DateTime(), nullable=True))
        
        if 'failed_login_attempts' not in existing_columns:
            op.add_column('users', 
                sa.Column('failed_login_attempts', sa.Integer(), 
                         nullable=False, server_default='0'))
        
        # Add indexes
        existing_indexes = {idx['name'] for idx in inspector.get_indexes('users')}
        
        if 'idx_users_last_login' not in existing_indexes:
            op.create_index('idx_users_last_login', 'users', ['last_login'])
    
    # Create new table
    if 'user_sessions' not in inspector.get_table_names():
        op.create_table(
            'user_sessions',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('token', sa.String(255), nullable=False),
            sa.Column('expires_at', sa.DateTime(), nullable=False),
            sa.Column('created_at', sa.DateTime(), 
                     server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], 
                                   name='fk_user_sessions_user_id',
                                   ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('token', name='uq_user_sessions_token')
        )
        
        # Add indexes for new table
        op.create_index('idx_user_sessions_user_id', 'user_sessions', ['user_id'])
        op.create_index('idx_user_sessions_expires_at', 'user_sessions', ['expires_at'])


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    # Drop user_sessions table and its indexes
    if 'user_sessions' in inspector.get_table_names():
        existing_indexes = {idx['name'] for idx in inspector.get_indexes('user_sessions')}
        
        if 'idx_user_sessions_expires_at' in existing_indexes:
            op.drop_index('idx_user_sessions_expires_at', 'user_sessions')
        if 'idx_user_sessions_user_id' in existing_indexes:
            op.drop_index('idx_user_sessions_user_id', 'user_sessions')
        
        op.drop_table('user_sessions')
    
    # Remove columns from users table
    if 'users' in inspector.get_table_names():
        existing_indexes = {idx['name'] for idx in inspector.get_indexes('users')}
        existing_columns = {col['name'] for col in inspector.get_columns('users')}
        
        # Drop indexes first
        if 'idx_users_last_login' in existing_indexes:
            op.drop_index('idx_users_last_login', 'users')
        
        # Drop columns
        if 'failed_login_attempts' in existing_columns:
            op.drop_column('users', 'failed_login_attempts')
        if 'last_login' in existing_columns:
            op.drop_column('users', 'last_login')
        if 'password_hash' in existing_columns:
            op.drop_column('users', 'password_hash')
```

### Data Migration Example

```python
"""Migrate user status values

Revision ID: 016
Revises: 015
Create Date: 2024-01-21 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import table, column

revision = '016'
down_revision = '015'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    if 'users' in inspector.get_table_names():
        existing_columns = {col['name'] for col in inspector.get_columns('users')}
        
        # Add new column
        if 'account_status' not in existing_columns:
            op.add_column('users', 
                sa.Column('account_status', sa.String(20), nullable=True))
            
            # Migrate data using table construct for metadata-independent migration
            users = table('users',
                column('status', sa.String),
                column('account_status', sa.String)
            )
            
            # Map old values to new values
            op.execute(
                users.update()
                .where(users.c.status == 'active')
                .values(account_status='ACTIVE')
            )
            op.execute(
                users.update()
                .where(users.c.status == 'inactive')
                .values(account_status='SUSPENDED')
            )
            op.execute(
                users.update()
                .where(users.c.status == 'deleted')
                .values(account_status='DELETED')
            )
            
            # Set default for any remaining NULL values
            op.execute(
                users.update()
                .where(users.c.account_status == None)
                .values(account_status='ACTIVE')
            )
            
            # Now make NOT NULL
            op.alter_column('users', 'account_status', nullable=False)
        
        # Drop old column only if new column exists and is populated
        if 'account_status' in {col['name'] for col in inspector.get_columns('users')}:
            if 'status' in existing_columns:
                op.drop_column('users', 'status')


def downgrade():
    """
    WARNING: This migration involves data transformation.
    Some data fidelity may be lost during downgrade.
    """
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    if 'users' in inspector.get_table_names():
        existing_columns = {col['name'] for col in inspector.get_columns('users')}
        
        # Add back old column
        if 'status' not in existing_columns:
            op.add_column('users', 
                sa.Column('status', sa.String(20), nullable=True))
            
            # Reverse data migration
            users = table('users',
                column('status', sa.String),
                column('account_status', sa.String)
            )
            
            op.execute(
                users.update()
                .where(users.c.account_status == 'ACTIVE')
                .values(status='active')
            )
            op.execute(
                users.update()
                .where(users.c.account_status == 'SUSPENDED')
                .values(status='inactive')
            )
            op.execute(
                users.update()
                .where(users.c.account_status == 'DELETED')
                .values(status='deleted')
            )
            
            # Set default for any remaining NULL values
            op.execute(
                users.update()
                .where(users.c.status == None)
                .values(status='active')
            )
            
            op.alter_column('users', 'status', nullable=False)
        
        # Drop new column
        if 'account_status' in existing_columns:
            op.drop_column('users', 'account_status')
```

### Multi-Database Compatible Migration

```python
"""Add json fields with database compatibility

Revision ID: 017
Revises: 016
Create Date: 2024-01-22 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '017'
down_revision = '016'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    dialect_name = bind.dialect.name
    
    if 'user_preferences' not in inspector.get_table_names():
        # Choose appropriate JSON type based on database
        if dialect_name == 'postgresql':
            json_type = sa.dialects.postgresql.JSONB()
        elif dialect_name == 'mysql':
            json_type = sa.JSON()
        elif dialect_name == 'sqlite':
            json_type = sa.Text()  # SQLite stores JSON as TEXT
        else:
            json_type = sa.Text()
        
        op.create_table(
            'user_preferences',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('preferences', json_type, nullable=True),
            sa.Column('created_at', sa.DateTime(), 
                     server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], 
                                   name='fk_user_preferences_user_id',
                                   ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('user_id', name='uq_user_preferences_user_id')
        )
        
        op.create_index('idx_user_preferences_user_id', 
                       'user_preferences', ['user_id'])


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    if 'user_preferences' in inspector.get_table_names():
        existing_indexes = {idx['name'] for idx in inspector.get_indexes('user_preferences')}
        
        if 'idx_user_preferences_user_id' in existing_indexes:
            op.drop_index('idx_user_preferences_user_id', 'user_preferences')
        
        op.drop_table('user_preferences')
```

## Summary

Following these guidelines ensures:
- ✅ Migrations are safe and reliable
- ✅ Rollbacks work consistently
- ✅ Migrations can be re-run without errors
- ✅ Database state is predictable
- ✅ CI/CD pipelines are stable
- ✅ Production deployments are less risky

Always test migrations thoroughly before deploying to production!
