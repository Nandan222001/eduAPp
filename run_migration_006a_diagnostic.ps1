# =====================================================================
# Migration 006a Diagnostic Script
# =====================================================================
# This script guides you through checking the status of migration 006a
# and the questions_bank table existence.
# =====================================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Migration 006a Diagnostic Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠ WARNING: .env file not found" -ForegroundColor Yellow
    Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
    
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✓ Created .env file" -ForegroundColor Green
        Write-Host "⚠ Please edit .env file with your actual database credentials" -ForegroundColor Yellow
        Write-Host ""
    } else {
        Write-Host "✗ .env.example not found - cannot create .env file" -ForegroundColor Red
        Write-Host "Please create .env file manually with database credentials" -ForegroundColor Red
        Write-Host ""
    }
}

# Read database configuration from .env
Write-Host "Reading database configuration from .env..." -ForegroundColor White
$envContent = Get-Content ".env" -ErrorAction SilentlyContinue

$dbHost = "localhost"
$dbPort = "3306"
$dbUser = "mysql"
$dbPassword = "mysql_password"
$dbName = "mysql_db"

if ($envContent) {
    foreach ($line in $envContent) {
        if ($line -match "^DATABASE_HOST=(.+)$") { $dbHost = $matches[1] }
        if ($line -match "^DATABASE_PORT=(.+)$") { $dbPort = $matches[1] }
        if ($line -match "^DATABASE_USER=(.+)$") { $dbUser = $matches[1] }
        if ($line -match "^DATABASE_PASSWORD=(.+)$") { $dbPassword = $matches[1] }
        if ($line -match "^DATABASE_NAME=(.+)$") { $dbName = $matches[1] }
    }
}

Write-Host "Database Configuration:" -ForegroundColor Cyan
Write-Host "  Host: $dbHost" -ForegroundColor White
Write-Host "  Port: $dbPort" -ForegroundColor White
Write-Host "  User: $dbUser" -ForegroundColor White
Write-Host "  Database: $dbName" -ForegroundColor White
Write-Host ""

# Display diagnostic options
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Diagnostic Methods Available" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "METHOD 1: Using Alembic (Recommended)" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host "This method uses Alembic to check the current migration version."
Write-Host ""
Write-Host "Command to run:" -ForegroundColor Cyan
Write-Host "  alembic current" -ForegroundColor Green
Write-Host ""
Write-Host "What to look for:" -ForegroundColor Cyan
Write-Host "  - If version shows '006a' or later: Migration 006a is complete" -ForegroundColor White
Write-Host "  - If version shows '006' or earlier: Migration 006a needs to be run" -ForegroundColor White
Write-Host "  - If error occurs: Database connectivity issue" -ForegroundColor White
Write-Host ""

Write-Host "METHOD 2: Using MySQL Command Line" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host "This method uses direct SQL queries to check table existence."
Write-Host ""
Write-Host "Option A - Quick check for questions_bank table:" -ForegroundColor Cyan
Write-Host "  mysql -h $dbHost -P $dbPort -u $dbUser -p$dbPassword $dbName -e `"SHOW TABLES LIKE 'questions_bank';`"" -ForegroundColor Green
Write-Host ""
Write-Host "Option B - Run comprehensive diagnostic SQL script:" -ForegroundColor Cyan
Write-Host "  mysql -h $dbHost -P $dbPort -u $dbUser -p$dbPassword $dbName < check_migration_006a.sql" -ForegroundColor Green
Write-Host ""
Write-Host "What to look for:" -ForegroundColor Cyan
Write-Host "  - Option A: If 'questions_bank' appears, the table exists" -ForegroundColor White
Write-Host "  - Option B: Detailed report showing all migration 006a tables and status" -ForegroundColor White
Write-Host ""

Write-Host "METHOD 3: Using Python Diagnostic Script" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host "This method uses a custom Python script to check database state."
Write-Host ""
Write-Host "Prerequisites:" -ForegroundColor Cyan
Write-Host "  1. Python environment with pymysql installed" -ForegroundColor White
Write-Host "  2. Database connectivity working" -ForegroundColor White
Write-Host ""
Write-Host "Command to run:" -ForegroundColor Cyan
Write-Host "  python check_migration_006a_status.py" -ForegroundColor Green
Write-Host ""
Write-Host "Note: This requires pymysql to be installed in your Python environment" -ForegroundColor White
Write-Host ""

Write-Host "METHOD 4: Using MySQL Workbench or GUI Tool" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host "If you have MySQL Workbench or another MySQL GUI tool:" -ForegroundColor White
Write-Host ""
Write-Host "Steps:" -ForegroundColor Cyan
Write-Host "  1. Connect to database: $dbName" -ForegroundColor White
Write-Host "  2. Check for these tables:" -ForegroundColor White
Write-Host "     - previous_year_papers" -ForegroundColor White
Write-Host "     - questions_bank" -ForegroundColor White
Write-Host "     - topic_predictions" -ForegroundColor White
Write-Host "  3. Check alembic_version table for current version" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Troubleshooting Database Connectivity" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "If you're getting connection errors, check:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Is MySQL server running?" -ForegroundColor Cyan
Write-Host "   Windows: Check Services for 'MySQL' service" -ForegroundColor White
Write-Host "   Command: Get-Service | Where-Object { `$_.Name -like '*mysql*' }" -ForegroundColor Green
Write-Host ""

Write-Host "2. Does the database exist?" -ForegroundColor Cyan
Write-Host "   Connect to MySQL and run:" -ForegroundColor White
Write-Host "   SHOW DATABASES LIKE '$dbName';" -ForegroundColor Green
Write-Host ""

Write-Host "3. Are credentials correct?" -ForegroundColor Cyan
Write-Host "   Verify in .env file:" -ForegroundColor White
Write-Host "   - DATABASE_USER=$dbUser" -ForegroundColor White
Write-Host "   - DATABASE_PASSWORD=[check your actual password]" -ForegroundColor White
Write-Host "   - DATABASE_NAME=$dbName" -ForegroundColor White
Write-Host ""

Write-Host "4. Does user have proper permissions?" -ForegroundColor Cyan
Write-Host "   Connect as root and run:" -ForegroundColor White
Write-Host "   GRANT ALL PRIVILEGES ON $dbName.* TO '$dbUser'@'localhost';" -ForegroundColor Green
Write-Host "   FLUSH PRIVILEGES;" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Choose one of the diagnostic methods above" -ForegroundColor White
Write-Host "2. Run the appropriate command" -ForegroundColor White
Write-Host "3. Document the findings:" -ForegroundColor White
Write-Host "   - Current migration version" -ForegroundColor Gray
Write-Host "   - Whether questions_bank table exists" -ForegroundColor Gray
Write-Host "   - Whether other migration 006a tables exist" -ForegroundColor Gray
Write-Host ""

Write-Host "Based on findings, take action:" -ForegroundColor Yellow
Write-Host ""
Write-Host "If migration 006a NOT run:" -ForegroundColor Cyan
Write-Host "  alembic upgrade 006a" -ForegroundColor Green
Write-Host ""
Write-Host "If migration 006a PARTIALLY run:" -ForegroundColor Cyan
Write-Host "  alembic downgrade 006" -ForegroundColor Green
Write-Host "  alembic upgrade 006a" -ForegroundColor Green
Write-Host ""
Write-Host "If tables exist but version incorrect:" -ForegroundColor Cyan
Write-Host "  alembic stamp 006a" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Documentation Generated" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "The following files have been created:" -ForegroundColor White
Write-Host "  ✓ MIGRATION_006A_DIAGNOSTIC_REPORT.md - Comprehensive analysis" -ForegroundColor Green
Write-Host "  ✓ check_migration_006a.sql - SQL diagnostic script" -ForegroundColor Green
Write-Host "  ✓ check_migration_006a_status.py - Python diagnostic script" -ForegroundColor Green
Write-Host "  ✓ run_migration_006a_diagnostic.ps1 - This script" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Ready to proceed with diagnostics" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
