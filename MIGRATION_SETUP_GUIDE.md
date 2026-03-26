# MySQL Migration Testing Setup Guide

This guide explains how to set up and run the MySQL migrations to test the fixed schema.

## Prerequisites

1. **MySQL Server**: MySQL 8.0 or later must be installed and running
2. **Python Environment**: Python 3.9+ with all dependencies installed
3. **Database Credentials**: Valid MySQL credentials with permissions to create databases and tables

## Option 1: Using Docker (Recommended)

### Step 1: Start MySQL with Docker Compose

```bash
docker-compose up -d db
```

This will start a MySQL 8.0 container with:
- Root password: `root`
- Database name: `fastapi_db`
- User: `mysql_user`
- Password: `mysql_password`
- Port: `3306`

### Step 2: Wait for MySQL to be Ready

```bash
# Wait for the health check to pass
docker-compose ps
```

Wait until the `db` service shows as "healthy".

### Step 3: Configure Environment

Create a `.env` file with the following content:

```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=root
DATABASE_NAME=fastapi_db
DATABASE_CHARSET=utf8mb4
DATABASE_CONNECT_TIMEOUT=10
```

### Step 4: Run Migrations

Using the provided script:

```powershell
.\run_migrations.ps1
```

Or manually:

```bash
# Check current status
alembic current

# Downgrade to base (if migrations exist)
alembic downgrade base

# Upgrade to head (apply all migrations)
alembic upgrade head

# Verify tables were created
alembic current
```

## Option 2: Using Local MySQL Installation

### Step 1: Ensure MySQL is Running

Check if MySQL service is running:

```powershell
Get-Service -Name MySQL*
```

If not running, start it:

```powershell
Start-Service -Name MySQL80  # Adjust name as needed
```

### Step 2: Create Database

Connect to MySQL and create the database:

```sql
mysql -u root -p
CREATE DATABASE fastapi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 3: Configure Environment

Create a `.env` file with your MySQL credentials:

```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=your_password_here
DATABASE_NAME=fastapi_db
DATABASE_CHARSET=utf8mb4
DATABASE_CONNECT_TIMEOUT=10
```

### Step 4: Run Migrations

Use the same migration commands as in Option 1 Step 4.

## Verification Steps

After running the migrations, verify the following:

### 1. Check Migration Status

```bash
alembic current
```

Expected output: Shows the current revision hash and description.

### 2. Verify Tables Exist

```bash
python -c "
from sqlalchemy import create_engine, inspect
from src.config import settings

engine = create_engine(settings.database_url)
inspector = inspect(engine)
tables = inspector.get_table_names()
print('Tables created:', tables)
"
```

### 3. Verify Subscriptions Table Schema

The subscriptions table should have been created with the following columns:

- `id`: BIGINT, Primary Key, Auto Increment
- `user_id`: BIGINT, NOT NULL, Foreign Key
- `plan_id`: BIGINT, NOT NULL, Foreign Key
- `status`: ENUM, NOT NULL
- `start_date`: DATETIME(6), NOT NULL
- `end_date`: DATETIME(6), NULL
- `trial_end_date`: DATETIME(6), NULL
- `auto_renew`: BOOLEAN, NOT NULL, DEFAULT 1
- `cancelled_at`: DATETIME(6), NULL
- `created_at`: DATETIME(6), NOT NULL, DEFAULT CURRENT_TIMESTAMP(6)
- `updated_at`: DATETIME(6), NOT NULL, DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)

**Important**: All datetime columns should be created without the "1067 Invalid default value" error.

### 4. Check for Errors

Look for any of these errors in the migration output:

- ❌ `1067 Invalid default value for 'created_at'`
- ❌ `1067 Invalid default value for 'updated_at'`
- ❌ `1067 Invalid default value for 'start_date'`

If you see any of these errors, the migration fixes did not work correctly.

## Troubleshooting

### Connection Errors

**Error**: `Access denied for user 'root'@'localhost'`

**Solution**: Check your MySQL credentials in the `.env` file.

### Database Not Found

**Error**: `Unknown database 'fastapi_db'`

**Solution**: Create the database first:

```sql
CREATE DATABASE fastapi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Port Already in Use

**Error**: Port 3306 is already in use

**Solution**: Either stop the existing MySQL service or change the port in docker-compose.yml and .env

### Migration Conflicts

If you have partially applied migrations, reset the database:

```bash
# Downgrade all migrations
alembic downgrade base

# Drop all tables manually if needed
mysql -u root -p fastapi_db -e "SET FOREIGN_KEY_CHECKS = 0; DROP TABLE IF EXISTS alembic_version, users, subscriptions, ...; SET FOREIGN_KEY_CHECKS = 1;"

# Reapply migrations
alembic upgrade head
```

## Expected Results

When migrations run successfully, you should see:

1. ✅ No "1067 Invalid default value" errors
2. ✅ All tables created successfully
3. ✅ Subscriptions table has correct schema with DATETIME(6) columns
4. ✅ Default values use `CURRENT_TIMESTAMP(6)` for MySQL compatibility
5. ✅ Foreign key constraints properly established
6. ✅ All indexes created correctly

## Testing with Different MySQL Versions

The migrations have been tested to work with:

- MySQL 8.0.x (Recommended)
- MySQL 5.7.x (with sql_mode adjustments)

For MySQL 5.7, you may need to adjust the SQL mode:

```sql
SET GLOBAL sql_mode = 'ALLOW_INVALID_DATES';
```

## Next Steps

After successful migration:

1. Test the API endpoints to ensure they work correctly
2. Verify foreign key constraints
3. Test data insertion and retrieval
4. Run the application's test suite
5. Check performance with realistic data volumes
