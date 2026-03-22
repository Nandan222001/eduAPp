# PowerShell script to run PostgreSQL audit
# Usage: .\scripts\run_postgresql_audit.ps1 [-Verbose] [-Output <file>]

param(
    [Parameter(Mandatory=$false)]
    [switch]$Verbose,
    
    [Parameter(Mandatory=$false)]
    [string]$Output = "postgresql_audit_report.txt"
)

Write-Host "================================" -ForegroundColor Cyan
Write-Host "PostgreSQL References Audit" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Build command arguments
$scriptArgs = @("scripts/audit_postgresql_references.py")

if ($Output) {
    $scriptArgs += @("--output", $Output)
}

if ($Verbose) {
    $scriptArgs += @("--verbose")
}

# Run the audit script
Write-Host "Running PostgreSQL audit..." -ForegroundColor Yellow
Write-Host ""

try {
    & python @scriptArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "================================" -ForegroundColor Cyan
        Write-Host "✓ Audit PASSED - No PostgreSQL references found!" -ForegroundColor Green
        Write-Host "================================" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "================================" -ForegroundColor Cyan
        Write-Host "✗ Audit FAILED - PostgreSQL references found" -ForegroundColor Red
        Write-Host "================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "See $Output for details" -ForegroundColor Yellow
    }
    
    exit $LASTEXITCODE
} catch {
    Write-Host "Error running audit script: $_" -ForegroundColor Red
    exit 1
}
