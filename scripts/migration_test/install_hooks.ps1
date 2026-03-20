# PowerShell script to install Git hooks for migration validation

$HooksDir = ".git\hooks"
$HookFile = "$HooksDir\pre-commit"
$SourceHook = "scripts\migration_test\pre-commit-migration-check"

Write-Host "Installing migration validation pre-commit hook..." -ForegroundColor Cyan

# Check if .git directory exists
if (-not (Test-Path ".git")) {
    Write-Host "Error: Not in a git repository" -ForegroundColor Red
    exit 1
}

# Create hooks directory if it doesn't exist
if (-not (Test-Path $HooksDir)) {
    New-Item -ItemType Directory -Path $HooksDir -Force | Out-Null
}

# Check if hook already exists
if (Test-Path $HookFile) {
    Write-Host "Warning: Pre-commit hook already exists" -ForegroundColor Yellow
    Write-Host "Backing up to $HookFile.backup" -ForegroundColor Yellow
    Copy-Item -Path $HookFile -Destination "$HookFile.backup" -Force
}

# Copy hook file
Copy-Item -Path $SourceHook -Destination $HookFile -Force

Write-Host "✓ Pre-commit hook installed successfully" -ForegroundColor Green
Write-Host ""
Write-Host "The hook will:"
Write-Host "  - Validate migration file syntax"
Write-Host "  - Check for duplicate revision IDs"
Write-Host "  - Run quick migration validation (optional)"
Write-Host ""
Write-Host "To skip the hook for a commit: git commit --no-verify"
Write-Host 'To skip migration test: $env:SKIP_MIGRATION_TEST=1; git commit'
Write-Host ""
