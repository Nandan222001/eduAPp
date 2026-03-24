# MySQL 8.0 Comprehensive Migration Testing Script (PowerShell)
# This script runs comprehensive migration tests on MySQL 8.0

param(
    [string]$DatabaseHost = "localhost",
    [string]$DatabasePort = "3306",
    [string]$DatabaseUser = "root",
    [string]$DatabasePassword = "test_password",
    [string]$DatabaseName = "test_mysql_migration"
)

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "MySQL 8.0 COMPREHENSIVE MIGRATION TESTING" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

# Construct database URL
$DatabaseUrl = "mysql+pymysql://${DatabaseUser}:${DatabasePassword}@${DatabaseHost}:${DatabasePort}/${DatabaseName}?charset=utf8mb4"

Write-Host "Database Configuration:" -ForegroundColor Yellow
Write-Host "  Host: $DatabaseHost"
Write-Host "  Port: $DatabasePort"
Write-Host "  User: $DatabaseUser"
Write-Host "  Database: $DatabaseName"
Write-Host ""

# Check if Python is available
Write-Host "Checking Python installation..." -ForegroundColor Yellow
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
    Write-Host "✗ Python not found in PATH" -ForegroundColor Red
    Write-Host "  Please install Python 3.9+ and add to PATH" -ForegroundColor Red
    exit 1
}

$pythonVersion = python --version
Write-Host "✓ Found: $pythonVersion" -ForegroundColor Green
Write-Host ""

# Check if MySQL client is available (optional, just for info)
Write-Host "Checking MySQL client..." -ForegroundColor Yellow
$mysqlCmd = Get-Command mysql -ErrorAction SilentlyContinue
if ($mysqlCmd) {
    Write-Host "✓ MySQL client found" -ForegroundColor Green
} else {
    Write-Host "⚠ MySQL client not found (optional)" -ForegroundColor Yellow
    Write-Host "  Install MySQL client for manual database operations" -ForegroundColor Yellow
}
Write-Host ""

# Set environment variable for test
$env:MYSQL_TEST_DATABASE_URL = $DatabaseUrl

# Run the comprehensive test script
Write-Host "Running comprehensive migration tests..." -ForegroundColor Yellow
Write-Host ""

try {
    python scripts/test_mysql_migrations_comprehensive.py
    $exitCode = $LASTEXITCODE
    
    Write-Host ""
    if ($exitCode -eq 0) {
        Write-Host "================================================================================" -ForegroundColor Green
        Write-Host "✓ ALL TESTS PASSED" -ForegroundColor Green
        Write-Host "================================================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Test results saved to: backups/migration_test/mysql_migration_test_results.json" -ForegroundColor Cyan
    } else {
        Write-Host "================================================================================" -ForegroundColor Red
        Write-Host "✗ TESTS FAILED" -ForegroundColor Red
        Write-Host "================================================================================" -ForegroundColor Red
        Write-Host ""
        Write-Host "Check test results in: backups/migration_test/mysql_migration_test_results.json" -ForegroundColor Cyan
    }
    
    exit $exitCode
} catch {
    Write-Host ""
    Write-Host "================================================================================" -ForegroundColor Red
    Write-Host "✗ ERROR RUNNING TESTS" -ForegroundColor Red
    Write-Host "================================================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}
