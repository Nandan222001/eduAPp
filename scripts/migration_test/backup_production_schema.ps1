# PowerShell script to backup production database schema using pg_dump --schema-only
# This creates a baseline schema for comparison and testing

param(
    [string]$DatabaseName = "fastapi_db",
    [string]$DatabaseHost = "localhost",
    [int]$DatabasePort = 5432,
    [string]$DatabaseUser = "postgres",
    [string]$DatabasePassword = "postgres"
)

# Load environment variables from .env file if it exists
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            Set-Item -Path "env:$name" -Value $value
        }
    }
}

# Override with environment variables if set
if ($env:DATABASE_NAME) { $DatabaseName = $env:DATABASE_NAME }
if ($env:DATABASE_HOST) { $DatabaseHost = $env:DATABASE_HOST }
if ($env:DATABASE_PORT) { $DatabasePort = $env:DATABASE_PORT }
if ($env:DATABASE_USER) { $DatabaseUser = $env:DATABASE_USER }
if ($env:DATABASE_PASSWORD) { $DatabasePassword = $env:DATABASE_PASSWORD }

$env:PGPASSWORD = $DatabasePassword

# Backup directory and file
$BackupDir = "backups/migration_test"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$SchemaFile = "$BackupDir/schema_${DatabaseName}_${Timestamp}.sql"
$LatestSchemaFile = "$BackupDir/schema_latest.sql"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Production Schema Backup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Database: $DatabaseName"
Write-Host "Host: $DatabaseHost"
Write-Host "Port: $DatabasePort"
Write-Host "User: $DatabaseUser"
Write-Host "============================================" -ForegroundColor Cyan

# Create backup directory if it doesn't exist
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

# Check if PostgreSQL is accessible
Write-Host "Checking PostgreSQL connection..."
try {
    $null = & psql -h $DatabaseHost -p $DatabasePort -U $DatabaseUser -d $DatabaseName -c "SELECT 1" 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Connection failed"
    }
    Write-Host "✓ Database connection successful" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Cannot connect to database $DatabaseName" -ForegroundColor Red
    Write-Host "Please ensure PostgreSQL is running and the database exists" -ForegroundColor Red
    exit 1
}

# Backup schema only (no data)
Write-Host "Backing up database schema..."
& pg_dump -h $DatabaseHost -p $DatabasePort -U $DatabaseUser `
    --schema-only `
    --no-owner `
    --no-privileges `
    --no-tablespaces `
    --no-security-labels `
    --no-publications `
    --no-subscriptions `
    $DatabaseName | Out-File -FilePath $SchemaFile -Encoding utf8

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Schema backup created: $SchemaFile" -ForegroundColor Green
} else {
    Write-Host "ERROR: Schema backup failed" -ForegroundColor Red
    exit 1
}

# Copy to latest schema file
Copy-Item -Path $SchemaFile -Destination $LatestSchemaFile -Force
Write-Host "✓ Latest schema copy updated: $LatestSchemaFile" -ForegroundColor Green

# Get schema statistics
Write-Host ""
Write-Host "Schema Statistics:" -ForegroundColor Cyan
Write-Host "----------------------------------------"
$Content = Get-Content $SchemaFile
$TableCount = ($Content | Select-String -Pattern "^CREATE TABLE" | Measure-Object).Count
$IndexCount = ($Content | Select-String -Pattern "^CREATE.*INDEX" | Measure-Object).Count
$ConstraintCount = ($Content | Select-String -Pattern "CONSTRAINT" | Measure-Object).Count
$EnumCount = ($Content | Select-String -Pattern "CREATE TYPE.*ENUM" | Measure-Object).Count

Write-Host "Tables: $TableCount"
Write-Host "Indexes: $IndexCount"
Write-Host "Constraints: $ConstraintCount"
Write-Host "Enums: $EnumCount"
$FileSize = (Get-Item $SchemaFile).Length / 1KB
Write-Host "File size: $([math]::Round($FileSize, 2)) KB"
Write-Host "----------------------------------------"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Schema backup completed successfully!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backup file: $SchemaFile"
Write-Host "Latest copy: $LatestSchemaFile"
Write-Host ""
