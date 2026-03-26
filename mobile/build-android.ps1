#!/usr/bin/env pwsh
# Android Development Build Script - PowerShell version
# This script clears caches and rebuilds the development app for Android

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "EduTrack Mobile - Android Dev Build" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: package.json not found" -ForegroundColor Red
    Write-Host "Please run this script from the mobile folder" -ForegroundColor Red
    exit 1
}

# Function to print status
function Print-Status {
    param([string]$step, [string]$message)
    Write-Host "[$step] $message" -ForegroundColor Yellow
}

function Print-Success {
    param([string]$message)
    Write-Host "✓ $message" -ForegroundColor Green
}

# Step 1: Clear Metro bundler cache
Print-Status "1/5" "Clearing Metro bundler cache..."
if (Test-Path ".expo") {
    Remove-Item ".expo" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "node_modules\.cache") {
    Remove-Item "node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue
}
Print-Success "Metro cache cleared"

# Step 2: Clear Android Gradle cache
Write-Host ""
Print-Status "2/5" "Clearing Android Gradle cache..."
Push-Location android
if (Test-Path "app\build") {
    Remove-Item "app\build" -Recurse -Force -ErrorAction SilentlyContinue
}
& .\gradlew.bat clean 2>&1 | Out-Null
Pop-Location
Print-Success "Android build cache cleared"

# Step 3: Install dependencies
Write-Host ""
Print-Status "3/5" "Installing dependencies..."
npm install 2>&1 | Out-Null
Print-Success "Dependencies installed"

# Step 4: Start development server
Write-Host ""
Print-Status "4/5" "Starting development server..."
Write-Host ""
Write-Host "Dev server starting on port 8081..." -ForegroundColor Cyan
Write-Host "Waiting for bundler to prepare..." -ForegroundColor Cyan
Write-Host ""

# Start the dev server in a new window
$devServerScript = @"
Set-Location (Get-Item $PSScriptRoot).FullName
try {
    npx expo start --clear --reset-cache
} catch {
    Write-Host "Dev server error: `$_" -ForegroundColor Red
}
Read-Host "Press Enter to close"
"@

$devServerScript | Out-File -FilePath "$env:TEMP\dev-server-temp.ps1" -Encoding UTF8
Start-Process pwsh -ArgumentList "-NoExit", "-File", "$env:TEMP\dev-server-temp.ps1"

Write-Host "Dev server started in separate window" -ForegroundColor Green
Write-Host ""

# Wait for server to start
Write-Host "Waiting 5 seconds for server to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# Step 5: Build the app
Write-Host ""
Print-Status "5/5" "Building development app for Android..."
Write-Host ""
Write-Host "This will:" -ForegroundColor Cyan
Write-Host "  - Compile the latest code"
Write-Host "  - Bundle all assets"
Write-Host "  - Create APK for Android emulator/device"
Write-Host ""
Write-Host "Please wait (this may take 2-5 minutes)..." -ForegroundColor Cyan
Write-Host ""

npx expo run:android --clear

# Final summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Build Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "If you see errors about assets:" -ForegroundColor Yellow
Write-Host "  1. Check your Android device/emulator is running (adb devices)" -ForegroundColor White
Write-Host "  2. Verify all assets in assets/ folder exist" -ForegroundColor White
Write-Host "  3. Check the troubleshooting guide: ANDROID_ASSET_FIX.md" -ForegroundColor White
Write-Host ""

Write-Host "To view logs while app runs:" -ForegroundColor Cyan
Write-Host '  adb logcat | Select-String "assets"' -ForegroundColor White
Write-Host ""

Write-Host "Dev server should still be running in the other window" -ForegroundColor Green
Write-Host ""

Read-Host "Press Enter to close this window"
