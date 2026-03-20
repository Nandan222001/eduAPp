# Comprehensive Migration Test Suite Runner for PowerShell
# Runs all migration validation tests in sequence

# Track test results
$TestsPassed = 0
$TestsFailed = 0
$TestsWarnings = 0

Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                    ║" -ForegroundColor Cyan
Write-Host "║        COMPREHENSIVE MIGRATION TEST SUITE                          ║" -ForegroundColor Cyan
Write-Host "║                                                                    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Started at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Blue
Write-Host ""

# Function to run a test
function Run-Test {
    param(
        [string]$TestName,
        [scriptblock]$TestCommand
    )
    
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "Test: $TestName" -ForegroundColor Blue
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    
    try {
        & $TestCommand
        if ($LASTEXITCODE -eq 0 -or $null -eq $LASTEXITCODE) {
            Write-Host "✓ $TestName PASSED" -ForegroundColor Green
            $script:TestsPassed++
            return $true
        } else {
            Write-Host "✗ $TestName FAILED" -ForegroundColor Red
            $script:TestsFailed++
            return $false
        }
    } catch {
        Write-Host "✗ $TestName FAILED: $_" -ForegroundColor Red
        $script:TestsFailed++
        return $false
    }
}

# Test 1: Set up test database
Run-Test "Test Database Setup" {
    .\scripts\migration_test\setup_test_db.ps1
}

# Test 2: Backup production schema
if (Test-Path ".env") {
    $result = Run-Test "Production Schema Backup" {
        .\scripts\migration_test\backup_production_schema.ps1
    }
    if (-not $result) {
        Write-Host "⚠ Production database not available, skipping backup" -ForegroundColor Yellow
        $script:TestsWarnings++
    }
} else {
    Write-Host "⚠ No .env file found, skipping production schema backup" -ForegroundColor Yellow
    $script:TestsWarnings++
}

# Test 3: Full migration validation
Run-Test "Full Migration Validation" {
    python scripts\migration_test\validate_migrations.py
}

# Test 4: Test recent migrations
Run-Test "Recent Migrations Test" {
    python scripts\migration_test\test_recent_migrations.py -n 3
}

# Test 5: Schema comparison (if production DB is available)
if ((Test-Path ".env") -and (Test-Path ".env.test.migration")) {
    $result = Run-Test "Schema Comparison" {
        python scripts\migration_test\compare_schemas.py fastapi_db fastapi_db_migration_test
    }
    if (-not $result) {
        Write-Host "⚠ Schema comparison found differences (this may be expected)" -ForegroundColor Yellow
        $script:TestsWarnings++
    }
} else {
    Write-Host "⚠ Skipping schema comparison (production DB not configured)" -ForegroundColor Yellow
    $script:TestsWarnings++
}

# Print final summary
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                    ║" -ForegroundColor Cyan
Write-Host "║                      TEST SUITE SUMMARY                            ║" -ForegroundColor Cyan
Write-Host "║                                                                    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Passed:   $TestsPassed" -ForegroundColor Green
Write-Host "  Failed:   $TestsFailed" -ForegroundColor Red
Write-Host "  Warnings: $TestsWarnings" -ForegroundColor Yellow
Write-Host ""
Write-Host "Completed at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Blue
Write-Host ""

# Generate summary report
$ReportDir = "backups\migration_test"
if (-not (Test-Path $ReportDir)) {
    New-Item -ItemType Directory -Path $ReportDir -Force | Out-Null
}

$SummaryReport = @"
Migration Test Suite Summary
=============================
Run Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

Results:
  Passed:   $TestsPassed
  Failed:   $TestsFailed
  Warnings: $TestsWarnings

Reports Generated:
  - migration_validation_report.json
  - recent_migrations_test_report.json
  - schema_comparison_report.json (if applicable)

Status: $(if ($TestsFailed -eq 0) { "SUCCESS" } else { "FAILED" })
"@

$SummaryReport | Out-File -FilePath "$ReportDir\test_suite_summary.txt" -Encoding utf8

Write-Host "✓ Summary report saved to: $ReportDir\test_suite_summary.txt" -ForegroundColor Green
Write-Host ""

# Exit with appropriate code
if ($TestsFailed -eq 0) {
    Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                   ALL TESTS PASSED! ✓                              ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    exit 0
} else {
    Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║                   SOME TESTS FAILED! ✗                             ║" -ForegroundColor Red
    Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Red
    exit 1
}
