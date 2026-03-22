# Clean up migration test artifacts and test database

# Load environment variables
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            Set-Item -Path "env:$name" -Value $value
        }
    }
}

if (Test-Path .env.test.migration) {
    Get-Content .env.test.migration | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            Set-Item -Path "env:$name" -Value $value
        }
    }
}

$TestDatabaseName = if ($env:TEST_DATABASE_NAME) { $env:TEST_DATABASE_NAME } else { "fastapi_db_migration_test" }
$DatabaseUser = if ($env:DATABASE_USER) { $env:DATABASE_USER } else { "root" }
$DatabasePassword = if ($env:DATABASE_PASSWORD) { $env:DATABASE_PASSWORD } else { "test_password" }

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Migration Test Cleanup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "This will remove:"
Write-Host "  - Test database: $TestDatabaseName"
Write-Host "  - Test reports in backups/migration_test/"
Write-Host "  - Test configuration: .env.test.migration"
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$response = Read-Host "Continue? (y/N)"
if ($response -ne 'y' -and $response -ne 'Y') {
    Write-Host "Cleanup cancelled"
    exit 0
}

# Drop test database
Write-Host "Dropping test database..."
try {
    $null = & mysql -h localhost -u $DatabaseUser -p"$DatabasePassword" -e "DROP DATABASE IF EXISTS ``$TestDatabaseName``;" 2>&1
    Write-Host "✓ Test database dropped" -ForegroundColor Green
} catch {
    Write-Host "✓ Test database dropped (or did not exist)" -ForegroundColor Green
}

# Remove test reports
Write-Host "Removing test reports..."
if (Test-Path "backups\migration_test") {
    Remove-Item -Path "backups\migration_test\*.json" -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "backups\migration_test\*.txt" -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "backups\migration_test\*.log" -Force -ErrorAction SilentlyContinue
}
Write-Host "✓ Test reports removed" -ForegroundColor Green

# Remove test configuration
Write-Host "Removing test configuration..."
if (Test-Path ".env.test.migration") {
    Remove-Item -Path ".env.test.migration" -Force
}
Write-Host "✓ Test configuration removed" -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Cleanup completed successfully!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To set up the test environment again:"
Write-Host "  .\scripts\migration_test\setup_test_db.ps1"
Write-Host ""
