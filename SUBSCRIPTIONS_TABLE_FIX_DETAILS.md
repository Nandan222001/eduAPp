# Subscriptions Table MySQL Fix - Detailed Breakdown

## Overview

This document provides a detailed breakdown of the fixes applied to the subscriptions table migration to resolve MySQL "1067 Invalid default value" errors.

## Migration File

**File**: `alembic/versions/004_create_subscription_billing_tables.py`

**Purpose**: Creates subscription billing tables including:
- `subscriptions` (main table)
- `payments`
- `invoices`
- `usage_records`

## The Problem

MySQL 5.7+ enforces strict SQL modes that validate datetime default values. The original migration used PostgreSQL-style `now()` function which is not valid in MySQL.

### Original Code (Broken)

```python
sa.Column('start_date', sa.DateTime(), nullable=False),
sa.Column('end_date', sa.DateTime(), nullable=True),
sa.Column('trial_end_date', sa.DateTime(), nullable=True),
sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
```

### Errors Produced

When running `alembic upgrade head`:

```
sqlalchemy.exc.OperationalError: (pymysql.err.OperationalError) (1067, 
"Invalid default value for 'created_at'")
```

Similar errors for `updated_at`, `start_date`, and other datetime columns.

## The Solution

### Fixed Code

```python
sa.Column('start_date', sa.DateTime(timezone=False), nullable=False),
sa.Column('end_date', sa.DateTime(timezone=False), nullable=True),
sa.Column('trial_end_date', sa.DateTime(timezone=False), nullable=True),
sa.Column('created_at', sa.DateTime(timezone=False), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
sa.Column('updated_at', sa.DateTime(timezone=False), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
```

### Key Changes

1. **Added `timezone=False` parameter**
   - Tells SQLAlchemy to use `DATETIME` instead of `TIMESTAMP`
   - MySQL requires this for proper datetime handling

2. **Changed `now()` to `CURRENT_TIMESTAMP`**
   - `now()` is PostgreSQL syntax
   - `CURRENT_TIMESTAMP` is MySQL-compatible

3. **Added `ON UPDATE CURRENT_TIMESTAMP` for updated_at**
   - Automatically updates the timestamp when row is modified
   - Standard MySQL pattern for tracking record modifications

## Complete Subscriptions Table Fix

### Before and After Comparison

#### created_at Column

**Before (Broken):**
```python
sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()'))
```

**After (Fixed):**
```python
sa.Column('created_at', sa.DateTime(timezone=False), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'))
```

#### updated_at Column

**Before (Broken):**
```python
sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()'))
```

**After (Fixed):**
```python
sa.Column('updated_at', sa.DateTime(timezone=False), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))
```

#### All Other DateTime Columns

**Before (Broken):**
```python
sa.Column('start_date', sa.DateTime(), nullable=False)
sa.Column('end_date', sa.DateTime(), nullable=True)
sa.Column('trial_end_date', sa.DateTime(), nullable=True)
sa.Column('grace_period_end', sa.DateTime(), nullable=True)
sa.Column('canceled_at', sa.DateTime(), nullable=True)
sa.Column('next_billing_date', sa.DateTime(), nullable=True)
```

**After (Fixed):**
```python
sa.Column('start_date', sa.DateTime(timezone=False), nullable=False)
sa.Column('end_date', sa.DateTime(timezone=False), nullable=True)
sa.Column('trial_end_date', sa.DateTime(timezone=False), nullable=True)
sa.Column('grace_period_end', sa.DateTime(timezone=False), nullable=True)
sa.Column('canceled_at', sa.DateTime(timezone=False), nullable=True)
sa.Column('next_billing_date', sa.DateTime(timezone=False), nullable=True)
```

## Full Fixed Migration Code

Here's the complete `upgrade()` function for the subscriptions table after fixes:

```python
def upgrade() -> None:
    op.execute('DROP TABLE IF EXISTS subscriptions CASCADE')
    
    op.create_table(
        'subscriptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution_id', sa.Integer(), nullable=False),
        sa.Column('plan_name', sa.String(length=100), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('billing_cycle', sa.String(length=50), nullable=False),
        sa.Column('price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False, server_default='INR'),
        sa.Column('max_users', sa.Integer(), nullable=True),
        sa.Column('max_storage_gb', sa.Integer(), nullable=True),
        sa.Column('features', sa.Text(), nullable=True),
        # FIXED: All datetime columns now use timezone=False
        sa.Column('start_date', sa.DateTime(timezone=False), nullable=False),
        sa.Column('end_date', sa.DateTime(timezone=False), nullable=True),
        sa.Column('trial_end_date', sa.DateTime(timezone=False), nullable=True),
        sa.Column('grace_period_end', sa.DateTime(timezone=False), nullable=True),
        sa.Column('canceled_at', sa.DateTime(timezone=False), nullable=True),
        sa.Column('next_billing_date', sa.DateTime(timezone=False), nullable=True),
        sa.Column('auto_renew', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('external_subscription_id', sa.String(length=255), nullable=True),
        sa.Column('razorpay_subscription_id', sa.String(length=255), nullable=True),
        sa.Column('razorpay_customer_id', sa.String(length=255), nullable=True),
        sa.Column('metadata', sa.Text(), nullable=True),
        # FIXED: Use CURRENT_TIMESTAMP instead of now()
        sa.Column('created_at', sa.DateTime(timezone=False), nullable=False, 
                 server_default=sa.text('CURRENT_TIMESTAMP')),
        # FIXED: Added ON UPDATE CURRENT_TIMESTAMP
        sa.Column('updated_at', sa.DateTime(timezone=False), nullable=False, 
                 server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['institution_id'], ['institutions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Indexes remain unchanged
    op.create_index('idx_subscription_institution_id', 'subscriptions', ['institution_id'])
    op.create_index('idx_subscription_plan_name', 'subscriptions', ['plan_name'])
    op.create_index('idx_subscription_status', 'subscriptions', ['status'])
    op.create_index('idx_subscription_institution_status', 'subscriptions', ['institution_id', 'status'])
    op.create_index('idx_subscription_dates', 'subscriptions', ['start_date', 'end_date'])
    op.create_index('idx_subscription_next_billing', 'subscriptions', ['next_billing_date'])
    op.create_index('idx_subscription_grace_period', 'subscriptions', ['grace_period_end'])
    op.create_index('idx_subscription_external_id', 'subscriptions', ['external_subscription_id'])
    op.create_index('idx_subscription_razorpay_id', 'subscriptions', ['razorpay_subscription_id'])
    op.create_index('idx_subscription_razorpay_customer_id', 'subscriptions', ['razorpay_customer_id'])
```

## Resulting MySQL Table Schema

When the migration runs successfully, MySQL will create this table:

```sql
CREATE TABLE subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    billing_cycle VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    max_users INT NULL,
    max_storage_gb INT NULL,
    features TEXT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NULL,
    trial_end_date DATETIME NULL,
    grace_period_end DATETIME NULL,
    canceled_at DATETIME NULL,
    next_billing_date DATETIME NULL,
    auto_renew TINYINT(1) NOT NULL DEFAULT 1,
    external_subscription_id VARCHAR(255) NULL,
    razorpay_subscription_id VARCHAR(255) NULL,
    razorpay_customer_id VARCHAR(255) NULL,
    metadata TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_subscription_institution 
        FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
    INDEX idx_subscription_institution_id (institution_id),
    INDEX idx_subscription_plan_name (plan_name),
    INDEX idx_subscription_status (status),
    INDEX idx_subscription_institution_status (institution_id, status),
    INDEX idx_subscription_dates (start_date, end_date),
    INDEX idx_subscription_next_billing (next_billing_date),
    INDEX idx_subscription_grace_period (grace_period_end),
    INDEX idx_subscription_external_id (external_subscription_id),
    INDEX idx_subscription_razorpay_id (razorpay_subscription_id),
    INDEX idx_subscription_razorpay_customer_id (razorpay_customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Verification

After running the migration, you can verify the fix with:

```sql
-- Check table exists
SHOW TABLES LIKE 'subscriptions';

-- Check table structure
DESCRIBE subscriptions;

-- Check created_at default
SHOW CREATE TABLE subscriptions;
```

Expected output for created_at:
```
created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
```

Expected output for updated_at:
```
updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

## Other Tables Fixed in Same Migration

The same fixes were applied to:

1. **payments table**
   - `paid_at` column
   - `created_at` column  
   - `updated_at` column

2. **invoices table**
   - `billing_period_start` column
   - `billing_period_end` column
   - `due_date` column
   - `paid_at` column
   - `created_at` column
   - `updated_at` column

3. **usage_records table**
   - `recorded_at` column
   - `period_start` column
   - `period_end` column
   - `created_at` column

## Testing

To test the fix:

```bash
# 1. Downgrade to remove any partial migrations
alembic downgrade base

# 2. Upgrade to apply the fixed migration
alembic upgrade head

# 3. Verify success (should show current revision)
alembic current

# 4. Check in MySQL
mysql -u root -p fastapi_db -e "DESCRIBE subscriptions;"
```

## Success Criteria

✅ Migration completes without errors
✅ No "1067 Invalid default value" errors
✅ subscriptions table exists
✅ All datetime columns have proper defaults
✅ created_at uses CURRENT_TIMESTAMP
✅ updated_at uses CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
✅ All indexes are created
✅ Foreign key constraint to institutions table works

## Additional Notes

- These changes are backward compatible with existing data
- The fixes only affect table creation, not data migration
- The same pattern should be applied to all other migration files
- Testing in a development environment is recommended before production deployment
