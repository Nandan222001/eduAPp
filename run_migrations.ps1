# Migration Testing Script
# This script runs alembic migrations to test the fixed MySQL schema

Write-Host "=== MySQL Migration Testing Script ===" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found. Please create one with your database credentials." -ForegroundColor Red
    Write-Host "Example .env file:" -ForegroundColor Yellow
    Write-Host "DATABASE_HOST=localhost" -ForegroundColor Yellow
    Write-Host "DATABASE_PORT=3306" -ForegroundColor Yellow
    Write-Host "DATABASE_USER=root" -ForegroundColor Yellow
    Write-Host "DATABASE_PASSWORD=root" -ForegroundColor Yellow
    Write-Host "DATABASE_NAME=fastapi_db" -ForegroundColor Yellow
    exit 1
}

Write-Host "Step 1: Checking current migration status..." -ForegroundColor Green
alembic current
if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: Could not check current migration status. This may be normal if no migrations have been applied yet." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 2: Downgrading to base (if migrations exist)..." -ForegroundColor Green
alembic downgrade base
if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: Downgrade failed or no migrations to downgrade. Continuing..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 3: Upgrading to head (applying all migrations)..." -ForegroundColor Green
alembic upgrade head
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Migration upgrade failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 4: Verifying migration status..." -ForegroundColor Green
alembic current

Write-Host ""
Write-Host "Step 5: Verifying tables were created..." -ForegroundColor Green
python -c "
from sqlalchemy import create_engine, text, inspect
from src.config import settings

engine = create_engine(settings.database_url)
inspector = inspect(engine)
tables = inspector.get_table_names()

print(f'\nTotal tables created: {len(tables)}')
print('\nTables:')
for table in sorted(tables):
    print(f'  - {table}')

# Check for subscriptions table specifically
if 'subscriptions' in tables:
    print('\n✓ subscriptions table exists')
    
    # Get column details
    columns = inspector.get_columns('subscriptions')
    print('\nSubscriptions table columns:')
    for col in columns:
        nullable = 'NULL' if col['nullable'] else 'NOT NULL'
        default = f'DEFAULT {col[\"default\"]}' if col.get('default') else ''
        print(f'  - {col[\"name\"]}: {col[\"type\"]} {nullable} {default}')
else:
    print('\n✗ subscriptions table NOT found!')
    exit(1)
"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=== SUCCESS: All migrations applied successfully! ===" -ForegroundColor Green
    Write-Host "The subscriptions table and all other tables were created without errors." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "=== FAILURE: Migration verification failed ===" -ForegroundColor Red
    exit 1
}
